import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Landing from '../landing';

const { mockSignInWithOtp, mockVerifyOtp } = vi.hoisted(() => ({
  mockSignInWithOtp: vi.fn(),
  mockVerifyOtp: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
    },
  },
  buildAuthOptions: vi.fn((mode: string) => ({
    shouldCreateUser: true,
    ...(mode === 'magic-link' ? { emailRedirectTo: 'http://localhost:5173/auth/callback' } : {}),
  })),
}));

vi.mock('@/contexts/I18nProvider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    setLanguage: vi.fn(),
    availableLanguages: [
      { code: 'en', name: 'English' },
      { code: 'ro', name: 'Română' },
    ],
  }),
}));

vi.mock('@/hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('wouter', () => ({
  useLocation: () => [null, vi.fn()],
}));

describe('Landing page email normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockVerifyOtp.mockResolvedValue({ error: null });
  });

  test('strips surrounding quotes and lowercases before OTP request', async () => {
    render(<Landing />);
    
    const loginButton = screen.getByTestId('button-login');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('input-otp-email')).toBeTruthy();
    }, { timeout: 3000 });
    
    const emailInput = screen.getByTestId('input-otp-email');
    const email = '"TeSt@Example.com"';
    fireEvent.change(emailInput, { target: { value: email } });
    
    const sendButton = screen.getByTestId('button-send-otp');
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalled();
      const calls = mockSignInWithOtp.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const args = calls[0][0];
      expect(args.email).toBe('test@example.com');
      expect(args.options?.emailRedirectTo).toBeUndefined();
    });
  });

  test('Magic Link request includes redirect_to with normalized email', async () => {
    render(<Landing />);
    
    const loginButton = screen.getByTestId('button-login');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('tab-magic-link')).toBeTruthy();
    }, { timeout: 3000 });
    
    const magicLinkTab = screen.getByTestId('tab-magic-link');
    fireEvent.click(magicLinkTab);
    
    await waitFor(() => {
      expect(screen.getByTestId('input-magic-link-email')).toBeTruthy();
    }, { timeout: 3000 });
    
    const emailInput = screen.getByTestId('input-magic-link-email');
    const email = '  USER@EXAMPLE.COM  ';
    fireEvent.change(emailInput, { target: { value: email } });
    
    const sendButton = screen.getByTestId('button-send-magic-link');
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalled();
      const calls = mockSignInWithOtp.mock.calls;
      const args = calls[calls.length - 1][0];
      expect(args.email).toBe('user@example.com');
      expect(args.options?.emailRedirectTo).toBeDefined();
    });
  });
});
