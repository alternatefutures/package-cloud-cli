# Alternate Clouds CLI

[![npm version](https://img.shields.io/npm/v/@alternatefutures/cli.svg)](https://www.npmjs.com/package/@alternatefutures/cli)
[![Tests](https://github.com/alternatefutures/package-cloud-cli/actions/workflows/test-runner.yml/badge.svg)](https://github.com/alternatefutures/package-cloud-cli/actions/workflows/test-runner.yml)

Simple command-line access to Alternate Clouds.

Authenticate, create projects, deploy services, inspect workloads, open shells, and check billing from one CLI.

## Install

```bash
npm install -g @alternatefutures/cli
```

Requires Node.js `>=18.18.2`.

## Start Here

```bash
af login
af projects create --name my-project
af services create
af services deploy
af services logs
```

## Core Commands

```bash
af projects
af services
af deployments
af ssh <serviceId>
af billing balance
```

## Projects

```bash
af projects list
af projects create --name my-project
af projects switch [id]
af projects update [id]
af projects delete [id]
```

## Services

```bash
af services list
af services info [id]
af services create
af services deploy [id]
af services logs [id] --tail 100
af services close [id]
af services delete [id]
```

Use a specific project when needed:

```bash
af services --project <id-or-name> list
```

## Deployments

```bash
af deployments
af deployments --all
af deployments --project <id-or-name> --status ACTIVE
af deployments list --service api --limit 20
```

## Shell Access

```bash
af ssh <serviceId>
af ssh <serviceId> --service web --command /bin/sh
```

## Authentication

Interactive:

```bash
af login
af login --email
af logout
```

Automation:

```bash
export AF_TOKEN="your_personal_access_token"
export AF_PROJECT_ID="your_project_id"
```

Create personal access tokens in the dashboard: [app.alternatefutures.ai](https://app.alternatefutures.ai)

## Advanced Commands

Available, but hidden from top-level help:

```bash
af templates list
af templates info <templateId>

af pat list
af pat create --name "CI token"
af pat delete <personalAccessTokenId>
```

## Help

```bash
af help
af services help
af services deploy --help
```

## Development

```bash
pnpm install
pnpm build
pnpm test
npm link
```

```bash
pnpm tsc
pnpm format
pnpm lint
```

## Links

- npm: [@alternatefutures/cli](https://www.npmjs.com/package/@alternatefutures/cli)
- Docs: [alternatefutures.ai/docs](https://alternatefutures.ai/docs)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
- Security: [`SECURITY.md`](./SECURITY.md)
