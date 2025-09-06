import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { db } from '../db';
import { users, refreshTokens } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';

interface JWTPayload {
  sub: string; // User ID
  email: string;
  role: string;
  type: 'access' | 'refresh';
  family?: string; // For refresh tokens
  exp: number;
  iat: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenFamily: string;
}

export class AuthService {
  private readonly JWT_ACCESS_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly ACCESS_TTL: string;
  private readonly REFRESH_TTL: string;

  constructor() {
    this.JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'fallback-access-secret';
    this.JWT_REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret';
    this.ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
    this.REFRESH_TTL = process.env.JWT_REFRESH_TTL || '30d';
  }

  // Password hashing with Argon2id
  async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    try {
      const salt = randomBytes(32).toString('hex');
      const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        hashLength: 64,
        timeCost: 3,
        memoryCost: 65536, // 64 MB
      });
      return { hash, salt };
    } catch (error) {
      throw new Error('Password hashing failed');
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }

  // JWT Token management
  private generateAccessToken(user: any): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      } as object,
      this.JWT_ACCESS_SECRET,
      { expiresIn: this.ACCESS_TTL }
    );
  }

  private generateRefreshToken(user: any, family: string): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
        family,
      } as object,
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TTL }
    );
  }

  async generateTokenPair(user: any): Promise<TokenPair> {
    const refreshTokenFamily = randomBytes(32).toString('hex');
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user, refreshTokenFamily);

    // Store refresh token hash in database
    const refreshTokenHash = await argon2.hash(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenFamily: refreshTokenFamily,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenFamily,
    };
  }

  async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = jwt.verify(token, this.JWT_ACCESS_SECRET) as JWTPayload;
      if (payload.type !== 'access') return null;
      return payload;
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = jwt.verify(token, this.JWT_REFRESH_SECRET) as JWTPayload;
      if (payload.type !== 'refresh') return null;

      // Check if token exists and is not revoked
      const storedTokens = await db
        .select()
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.userId, payload.sub),
            eq(refreshTokens.tokenFamily, payload.family || ''),
            eq(refreshTokens.isRevoked, false),
            lt(refreshTokens.expiresAt, new Date())
          )
        );

      if (storedTokens.length === 0) return null;

      // Verify token hash matches
      const isValid = await argon2.verify(storedTokens[0].tokenHash, token);
      if (!isValid) return null;

      return payload;
    } catch {
      return null;
    }
  }

  async rotateRefreshToken(oldToken: string): Promise<TokenPair | null> {
    const payload = await this.verifyRefreshToken(oldToken);
    if (!payload) return null;

    // Revoke old token family (security measure)
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(
        and(
          eq(refreshTokens.userId, payload.sub),
          eq(refreshTokens.tokenFamily, payload.family)
        )
      );

    // Get user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub));

    if (!user) return null;

    // Generate new token pair
    return await this.generateTokenPair(user);
  }

  async revokeRefreshTokenFamily(userId: string, family: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.tokenFamily, family)
        )
      );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  // User authentication
  async authenticateUser(email: string, password: string): Promise<any | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user || !user.passwordHash) return null;

      // Check account lock
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new Error('Account temporarily locked due to failed login attempts');
      }

      const isValidPassword = await this.verifyPassword(password, user.passwordHash);

      if (!isValidPassword) {
        // Increment failed attempts
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 min lock

        await db
          .update(users)
          .set({
            failedLoginAttempts: attempts,
            lockedUntil: lockUntil,
          })
          .where(eq(users.id, user.id));

        return null;
      }

      // Reset failed attempts on successful login
      await db
        .update(users)
        .set({
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return user;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Authentication failed');
    }
  }

  // Email masking for logs (GDPR compliance)
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local}***@${domain}`;
    return `${local.charAt(0)}***@${domain}`;
  }

  // Clean up expired tokens
  async cleanupExpiredTokens(): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(lt(refreshTokens.expiresAt, new Date()));
  }
}

export const authService = new AuthService();