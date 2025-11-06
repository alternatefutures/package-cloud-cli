# CLI TODOs

## ✅ Billing Commands - FIXED

**Status**: ✅ COMPLETED - 2025-11-06

**What Was Fixed**:
- SDK `billing()` method already existed
- Fixed TypeScript parameter destructuring in invoices.ts
- Fixed parameter types to match Commander options
- Exported billing types from SDK

**Files Fixed**:
- `src/commands/billing/invoices.ts` - Fixed parameter destructuring and types
- `src/commands/billing/index.ts` - Simplified action handler invocation

**Resolution**: All billing commands now compile successfully. The `sdk.billing()` client was already implemented; the issues were TypeScript type mismatches in the CLI command files.
