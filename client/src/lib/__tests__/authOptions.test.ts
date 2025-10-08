import { describe, it, expect } from 'vitest';
import { buildAuthOptions } from '../supabase';

describe('Auth Options Builder', () => {
  it('OTP options should not include emailRedirectTo', () => {
    const options = buildAuthOptions('otp', 'test@example.com');
    
    expect(options).toEqual({
      email: 'test@example.com',
      options: { shouldCreateUser: true }
    });
    expect(options.options).not.toHaveProperty('emailRedirectTo');
  });

  it('OTP options should normalize email', () => {
    const options = buildAuthOptions('otp', '  TEST@EXAMPLE.COM  ');
    
    expect(options.email).toBe('test@example.com');
  });

  it('Magic Link options should include emailRedirectTo', () => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com' },
      writable: true
    });

    const options = buildAuthOptions('magic-link', 'test@example.com');
    
    expect(options.options).toHaveProperty('emailRedirectTo');
    expect(options.options.emailRedirectTo).toBe('https://example.com/auth/callback');
  });

  it('Magic Link options should normalize email', () => {
    const options = buildAuthOptions('magic-link', '  TEST@EXAMPLE.COM  ');
    
    expect(options.email).toBe('test@example.com');
  });

  it('Both modes should set shouldCreateUser to true', () => {
    const otpOptions = buildAuthOptions('otp', 'test@example.com');
    const linkOptions = buildAuthOptions('magic-link', 'test@example.com');
    
    expect(otpOptions.options.shouldCreateUser).toBe(true);
    expect(linkOptions.options.shouldCreateUser).toBe(true);
  });
});
