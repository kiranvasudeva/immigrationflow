# OTP Authentication Audit Report

Generated: 2025-10-08T08:48:41.630Z

## Summary

- **Total signInWithOtp calls:** 2
- **Violations:** 0
- **Passed:** 2

## Rules

1. ✅ OTP mode (Email Code) must NOT include `emailRedirectTo` parameter
2. ✅ Magic Link mode must INCLUDE `emailRedirectTo` parameter

## Violations

None! All authentication calls follow the correct pattern.

## Details


### client/src/pages/landing.tsx:117

- **Mode:** OTP (Email Code)
- **Has emailRedirectTo:** No
- **Status:** ✅ PASS


### client/src/pages/landing.tsx:205

- **Mode:** OTP (Email Code)
- **Has emailRedirectTo:** No
- **Status:** ✅ PASS

