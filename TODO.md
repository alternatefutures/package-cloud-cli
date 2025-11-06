# CLI TODOs

## Billing Commands - Build Errors (PRE-EXISTING)

**Status**: 🔴 BLOCKED - Waiting for SDK billing client

**Issue**: Billing commands fail to compile because `sdk.billing()` doesn't exist

**Files Affected**:
- `src/commands/billing/subscriptions.ts` - Line 6
- `src/commands/billing/paymentMethods.ts` - Line 6
- `src/commands/billing/customer.ts` - Line 6
- `src/commands/billing/invoices.ts` - Various lines
- `src/commands/billing/index.ts` - Line 29

**Error**: `Property 'billing' does not exist on type 'AlternateFuturesSdk'`

**Blocker**: SDK needs to implement billing client

**Note**: These are **pre-existing build errors**, not introduced by the custom domain feature (ALT-38).

**Tasks**:
- [ ] SDK team implements `billing()` client in cloud-sdk
- [ ] SDK exports billing types
- [ ] Update CLI billing commands to use correct types
- [ ] Fix TypeScript errors in invoices.ts
- [ ] Re-enable billing commands
- [ ] Delete this TODO section when complete

**Temporary Solution**:
The build errors exist but don't block the custom domain functionality. The billing commands are not currently functional.

**Date Added**: 2025-11-06 (documented during ALT-38)
**Added By**: Claude Code
