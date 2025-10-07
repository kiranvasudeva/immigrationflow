# OTP Authentication Audit Report

Generated: 2025-10-07T12:49:48.169Z

## Summary

- **Total signInWithOtp calls:** 3
- **Violations:** 0
- **Passed:** 3

## Rules

1. ✅ OTP mode (Email Code) must NOT include `emailRedirectTo` parameter
2. ✅ Magic Link mode must INCLUDE `emailRedirectTo` parameter

## Violations

None! All authentication calls follow the correct pattern.

## Details


### client/src/pages/__tests__/landing.test.tsx:14

- **Mode:** OTP (Email Code)
- **Has emailRedirectTo:** No
- **Status:** ✅ PASS


### client/src/pages/landing.tsx:117

- **Mode:** OTP (Email Code)
- **Has emailRedirectTo:** No
- **Status:** ✅ PASS


### client/src/pages/landing.tsx:188

- **Mode:** OTP (Email Code)
- **Has emailRedirectTo:** No
- **Status:** ✅ PASS

