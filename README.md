<div align="center">

# ☁️ Alternate Clouds CLI

**Deploy and manage services from your terminal.**

[![npm](https://img.shields.io/npm/v/@alternatefutures/cli?style=for-the-badge)](https://www.npmjs.com/package/@alternatefutures/cli)
[![Tests](https://github.com/alternatefutures/package-cloud-cli/actions/workflows/test-runner.yml/badge.svg)](https://github.com/alternatefutures/package-cloud-cli/actions/workflows/test-runner.yml)

---

</div>

## Install

```bash
npm install -g @alternatefutures/cli
```

Requires Node.js >= 18.

---

## Quick Start

```bash
af login
af projects create --name my-project
af services create
af services deploy
af services logs
```

---

## Commands

### Projects

```bash
af projects list
af projects create --name my-project
af projects switch [id]
af projects update [id]
af projects delete [id]
```

### Services

```bash
af services list
af services info [id]
af services create
af services deploy [id]
af services deploy [id] --region us-east     # Phase 46: pin to a curated region
af services logs [id] --tail 100
af services close [id]
af services delete [id]
af services --project <id-or-name> list
```

### Regions (Phase 46)

```bash
af regions                                    # list us-east, us-west, eu, asia with live availability
af regions --provider akash
af regions --provider phala                   # → "Phala Cloud is currently single-region"
af regions --gpu h100                         # surface median price for a specific GPU model
```

`af services deploy --region <region>` constrains your deploy to one of the
four curated buckets (`us-east`, `us-west`, `eu`, `asia`). Omit the flag for
"Any (cheapest globally)" — today's default behavior. If no provider in the
chosen region responds, the CLI prints alternatives + the exact retry
commands.

### Deployments

```bash
af deployments
af deployments --all
af deployments --project <id-or-name> --status ACTIVE
af deployments list --service api --limit 20
```

### Shell Access

```bash
af ssh <serviceId>
af ssh <serviceId> --command /bin/sh
```

### Auth

```bash
af login
af login --email
af logout
```

For CI/CD, use environment variables:

```bash
export AF_TOKEN="your_personal_access_token"
export AF_PROJECT_ID="your_project_id"
```

### Billing

```bash
af billing balance
```

---

## Development

```bash
pnpm install
pnpm build
pnpm test
npm link
```

---

## Related

- [service-auth](https://github.com/alternatefutures/service-auth) — Auth + billing + AI proxy
- [service-cloud-api](https://github.com/alternatefutures/service-cloud-api) — GraphQL API
- [web-app](https://github.com/alternatefutures/web-app.alternatefutures.ai) — Dashboard
- [npm](https://www.npmjs.com/package/@alternatefutures/cli) · [Changelog](./CHANGELOG.md) · [Security](./SECURITY.md)

---

AGPL-3.0-only
