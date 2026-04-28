---
name: af-cli
description: Reference for the Alternate Clouds CLI (`af`) — login, projects, services, deployments, templates, SSH, billing, and PATs. Use when helping a user deploy, manage, or troubleshoot apps on Alternate Clouds via the terminal, or when the user mentions `af`, alternatefutures.ai, or "AF Cloud" in a CLI context.
---

# Alternate Clouds CLI (`af`)

The `af` command is the official CLI for [Alternate Clouds](https://alternatefutures.ai), a decentralized cloud platform offering web services, GPU compute, databases, AI models, and TEE/confidential workloads. This skill gives an AI assistant a complete map of the CLI surface so it can suggest the right command, flags, and workflow without guessing.

**Package**: `@alternatefutures/cli` · **Binary**: `af` · **Repo**: https://github.com/alternatefutures/package-cloud-cli

## Install

```bash
npm install -g @alternatefutures/cli
# or
pnpm add -g @alternatefutures/cli
```

Verify: `af --version`

## Authentication

The CLI is unauthenticated by default. Every command except `login`, `logout`, `signup`, `version`, and `--help` requires an active session.

```bash
af login                    # opens browser to web UI (default flow)
af login --email            # email + verification code (no browser; CI / SSH friendly)
af login --auth-url <url>   # override auth service URL (rare; for staging)
af logout                   # clear local session
af signup                   # create a new account (also browser-based)
```

The session is persisted to disk; subsequent commands reuse it. `--debug` on any command prints the request/response cycle.

## Concept model

```
Account
└── Project          (top-level workspace, billing, RBAC)
    └── Service      (the deployable: VM, Function, Server, DB, Confidential)
        └── Deployment   (a running instance of a service — multiple over time)
```

A *project* is the unit you switch into (`af projects switch`); subsequent `af services` commands act on the selected project unless `-p` overrides it. A *service* is a long-lived deployable; *deployments* are ephemeral runs of that service. Closing a deployment doesn't delete the service.

## Command reference

### Global

| Command | Description |
|---|---|
| `af --version` / `-V` | Print CLI version |
| `af --help` / `-h` | Top-level help |
| `af --debug <cmd>` | Verbose mode (prints API calls) |
| `af help <command>` | Per-command help |

### `af login` / `af logout` / `af signup`

```bash
af login                                  # browser flow (default)
af login --email                          # email-code flow, no browser
af login --auth-url https://auth.staging.alternatefutures.ai  # override env
af logout
af signup                                 # browser-only
```

### `af projects` — workspace management

```bash
af projects                  # default action: list (same as `af projects list`)
af projects list             # list all projects
af projects create           # interactive (prompts for name)
af projects create --name "My App"        # non-interactive
af projects switch [id]      # change the "selected" project (interactive picker if id omitted)
af projects update [id]      # rename a project
af projects delete [id]      # delete project AND every service inside it (destructive; prompts to confirm)
```

The "selected" project is shown with ✅ in `af projects list` and is the default for `af services` / `af deployments`.

### `af services` — deployable units

```bash
af services                            # list services in selected project
af services list                       # explicit list
af services list -p my-project         # list services in a specific project (by name or id)
af services info [id]                  # show details (image, env, ports, status); prompts for id if omitted
af services create                     # interactive: pick template kind, fill env vars, deploy
af services deploy [id]                # deploy/redeploy an existing service
af services logs [id]                  # tail recent logs
af services logs [id] --tail 200       # last 200 lines (default 50)
af services close [id]                 # close the active deployment (service kept; can be redeployed later)
af services delete [id]                # close + delete the service entirely
```

The `-p / --project` flag works on every `services` subcommand to override the selected project.

**`af services create` flow today:**
- ✅ **📦 Template** — pre-built templates (Next.js, Postgres, Ollama, Hyperscape, Minecraft, etc.)
- 🚧 🐳 Docker Image — *Coming soon!* CLI redirects to dashboard
- 🚧 ⚡ Function — *Coming soon!*
- 🚧 🖥️ Server — *Coming soon!*

For the not-yet-CLI options, the official guidance is `https://alternatefutures.ai` (dashboard).

### `af deployments` — runtime history

```bash
af deployments                            # list (default action)
af deployments list                       # same
af deployments --project <name-or-id>     # filter by project
af deployments --service <name-or-id>     # filter by service
af deployments --status active            # active | failed | closed
af deployments --all                      # include closed/old
af deployments -l 100                     # max rows (default 50)
```

Deployments are read-only here — close/redeploy go through `af services`.

### `af templates` — pre-built deployable templates

```bash
af templates                              # list (default action)
af templates list                         # explicit list
af templates list -c WEB_SERVER           # filter by category
af templates info <templateId>            # full details: image, env vars, resources, ports
```

Categories: `AI_ML`, `WEB_SERVER`, `GAME_SERVER`, `DATABASE`, `DEVTOOLS`, `CUSTOM`.

### `af ssh <serviceId>` — interactive shell

```bash
af ssh <serviceId>                                # /bin/bash by default
af ssh <serviceId> --command /bin/sh              # for alpine images
af ssh <serviceId> --service web                  # SDL service name (multi-service SDLs)
```

Requires the service to be in `ACTIVE` state. Connection is brokered through the platform; no manual SSH key setup needed.

### `af pat` — Personal Access Tokens (CI/CD, programmatic access)

```bash
af pat list                              # show your PATs
af pat create                            # interactive
af pat create --name "ci-deploy"         # named, non-interactive
af pat delete <id>                       # revoke
```

PATs are scoped to your account; use them as `Authorization: Bearer <pat>` against the GraphQL endpoint.

### `af billing` — credit balance

```bash
af billing                               # default action: balance
af billing balance                       # show ACT credit balance
```

## Common workflows

**Deploy a Next.js app (template path)**
```bash
af login
af projects create --name "my-nextjs"
af projects switch my-nextjs
af services create     # pick "Template" → "Next.js App" → answer prompts
af services logs       # tail logs while it boots
af services info       # get the public URL
```

**Deploy from an existing template**
```bash
af templates list -c DATABASE          # find a Postgres template
af templates info postgres-pgvector    # check env-var requirements
af services create                     # pick that template ID when prompted
```

**Inspect a failing deployment**
```bash
af deployments --status failed --service my-svc -l 5
af services logs my-svc --tail 500
af ssh my-svc                          # only works if status is ACTIVE
```

**Switch projects when you have many**
```bash
af projects list
af projects switch                     # interactive picker
# subsequent `af services …` commands act on the new project
```

## Limitations & gotchas (April 2026)

- **Custom Docker images via CLI is not yet shipped.** `af services create` → Docker Image prints "Coming soon!" and points at the dashboard. If a user asks "how do I deploy my own image with `af`?" the honest answer today is: build + push to a registry, then deploy via the **dashboard at https://alternatefutures.ai**. CLI support is on the roadmap.
- **Templates are global.** Anything registered in `service-cloud-api/src/templates/definitions/` is visible to every signed-in user. There is a `releaseStage: 'internal'` field on the template schema, but the listing query does *not* filter on it yet. Don't suggest "just register it as an internal template" as a way to deploy private code.
- **Project selection is sticky.** A user who runs `af services list` and gets unexpected output may have a different project selected than they think. Suggest `af projects list` first to confirm.
- **`af services delete` cascades.** It closes the active deployment and removes the service. There's no "undelete." Always confirm before suggesting it.
- **`--debug` is your friend.** When troubleshooting, add `--debug` to any command — it prints the GraphQL request/response so you can see exactly what failed.
- **TLS verification is disabled in some builds.** `NODE_TLS_REJECT_UNAUTHORIZED=0` shows up in CLI output as a Node warning. Safe to ignore for the official build; flag it if a user is connecting to a custom auth URL.

## When NOT to suggest the CLI

- **Static sites with custom domains, IPFS pinning, or per-deploy preview URLs** → those go through `af sites` (deprecated/legacy) or the dashboard. The CLI's `services` flow is for containerized SSR/server workloads.
- **Bulk/programmatic operations** (e.g., scripted CI deploys) → use a PAT + the GraphQL API directly. The CLI is interactive-friendly but not the cleanest for automation.
- **Cross-project resource queries** → only `af deployments` supports project-agnostic listing today.

## For AI assistants helping users

When a user asks how to do something with `af`:

1. **Check what's selected first.** Run `af projects list` mentally — if the user is doing `af services …` without specifying `-p`, the active project matters. Surface this.
2. **Don't invent flags.** If a flag isn't in this skill or in `af <cmd> --help`, it doesn't exist. Several "obvious" flags (e.g., `--image`, `--env`, `--port` on `services create`) are not yet wired in 0.2.x.
3. **Prefer the named subcommand.** `af services list` is clearer in transcripts/scripts than the bare `af services` (which defaults to list but is easy to misread).
4. **For destructive ops** (`projects delete`, `services delete`, `pat delete`), always show the user the exact command and confirm intent before executing.
5. **When stuck, `--debug`.** Suggest re-running with `--debug` — the GraphQL error message is usually more specific than the CLI's pretty output.
6. **Version check.** This reference matches CLI `0.2.x`. If a user is on a much older or newer build, command surface may differ — `af --version` confirms.
