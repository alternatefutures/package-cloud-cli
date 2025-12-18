# TODO: Publish SDK and CLI to npm

**Priority:** High
**Status:** Blocked - NPM token expired

## Summary

The billing system implementation is complete but npm publishing is blocked due to an expired/revoked npm token.

## Tasks

### NPM Account Recovery
- [ ] Recover access to npm account with `@alternatefutures` scope
- [ ] Generate new **Automation** token for CI/CD

### SDK Publishing (package-cloud-sdk)
- [ ] Update `NPM_TOKEN` secret in GitHub repo settings
- [ ] Trigger publish workflow for v0.2.5:
  ```bash
  cd /Users/wonderwomancode/Projects/alternatefutures/package-cloud-sdk
  gh workflow run "📦 Publish to npm" -f tag=v0.2.5
  ```
- [ ] Verify package published: `npm view @alternatefutures/sdk@0.2.5`

### CLI Publishing (package-cloud-cli)
- [ ] Update `NPM_TOKEN` secret in GitHub repo settings
- [ ] Re-run publish workflow:
  ```bash
  gh run rerun 20116188676
  ```
- [ ] Verify package published: `npm view @alternatefutures/cli@0.2.3`

---

## What Was Completed

### SDK (v0.2.5)
- ✅ BillingClient with REST-based billing API
- ✅ Support for customers, subscriptions, invoices, payments, usage
- ✅ `authServiceUrl` configuration option
- ✅ npm-publish workflow added
- ✅ GitHub release created: https://github.com/alternatefutures/package-cloud-sdk/releases/tag/v0.2.5

### CLI (v0.2.3)
- ✅ Billing commands: `af billing customer|subscriptions|invoices|usage|payment-methods`
- ✅ Email login: `af login --email`
- ✅ Backwards-compatible with older SDK versions
- ✅ `AUTH__API_URL` and `SDK__AUTH_SERVICE_URL` added to CI workflows
- ✅ GitHub release created: https://github.com/alternatefutures/package-cloud-cli/releases/tag/v0.2.3

---

## Notes

- The `@alternatefutures/cli` package exists on npm (v0.2.1 is current)
- The `@alternatefutures/sdk` package exists on npm (v0.2.3 is current)
- All tests pass for both packages
- Builds succeed with proper env vars
