import { describe, test, expect } from 'vitest';
import { normalizeEmail, isValidEmail } from '../normalizeEmail';

describe("normalizeEmail", () => {
  test.each([
    ['  TEST@Example.com  ', 'test@example.com'],
    ['"USER@EXAMPLE.COM"', 'user@example.com'],
    ['""mixed.Case@DoMain.io""', 'mixed.case@domain.io'],
  ])("normalizes %p → %p", (input, expected) => {
    expect(normalizeEmail(input)).toBe(expected);
  });

  test("isValidEmail rejects obvious bad values", () => {
    expect(isValidEmail('no-at')).toBe(false);
    expect(isValidEmail('"bad"@example.com')).toBe(false);
    expect(isValidEmail(' test @example.com ')).toBe(false);
  });

  test("isValidEmail accepts normalized good value", () => {
    expect(isValidEmail('  "Ok@EXAMPLE.org" ')).toBe(true);
  });
});
