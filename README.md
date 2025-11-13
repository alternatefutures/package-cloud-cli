![](.repo/images/repo/hero-logo.svg)

# ✨ Alternate Futures CLI ✨

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-blue.svg)](https://conventionalcommits.org)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![Tests](https://github.com/alternatefutures/package-cloud-cli/actions/workflows/test-runner.yml/badge.svg)
![Security](https://img.shields.io/badge/security-audited-brightgreen.svg)
[![CodeQL](https://github.com/alternatefutures/package-cloud-cli/actions/workflows/codeql.yml/badge.svg)](https://github.com/alternatefutures/package-cloud-cli/actions/workflows/codeql.yml)

Alternate Futures CLI provides a unified command line interface to Alternate Futures Cloud.

## Overview

* [🤖 Install](#install)
* [🔐 Authentication](#authentication)
* [🌐 Decentralization & Censorship Resistance](#decentralization--censorship-resistance)
* [🛡️ Security](#security)
* [👷‍♀️Development](#development)
  - [Code format](#code-format)
  - [Changeset](#changeset)
* [📖 Docs](https://alternatefutures.ai/docs)
* [🤖 AI Agent Documentation](./AGENTS.md) - Detailed context for AI agents
* [🙏 Contributing](#contributing)
  - [Branching strategy](#branching-strategy)
  - [Contributing](#conventional-commits)
  - [Code of Conduct](./CODE_OF_CONDUCT.md)
* [⏱️ Changelog](./CHANGELOG.md)

## Requirements

- Nodejs as runtime
- NPM, Yarn to install the CLI as a client, or PNPM for development
- Familiarity with text-based user interfaces, command-line interface (CLI)

## Install

To install and use the CLI as a client or end-user, open your terminal and follow these simple steps. First, ensure you have Node.js installed on your system. If not, download and install it [here](https://nodejs.org/en/download). Next, run the following command to globally install our CLI tool:

```sh
# Install globally (recommended)
npm i -g @alternatefutures/cli
```

⚠️ If you're planning to contribute as a developer, you must install [pnpm](https://pnpm.io), otherwise most commands will fail.

For a quick start, learn the [basic commands](#basic-commands), or alternatively visit our [documentation](https://alternatefutures.ai/docs)

## Development

For developers looking to contribute to the CLI tool itself, [clone](https://github.com/alternatefutures/package-cloud-cli) the repository and follow the [contribution guide](#contributing).

Once cloned, you'll have to set up the local development environment, e.g. to have access to the source-code, iterate, run tests and much more.

For runtime we utilize [Nodejs](https://nodejs.org/en/download) and [PNPM](https://pnpm.io/installation) as the package manager.

Create a new file named .env in the root directory of your project. This file will store environment variables needed for local development.

```sh
touch .env.production
```

Open the .env.production file in a text editor and add the following:

```sh
IPFS_GATEWAY_HOSTNAME="gateway-ipfs.alternatefutures.ai"
SDK__AUTH_APPS_URL="https://auth-apps.service.alternatefutures.ai"
SDK__GRAPHQL_API_URL="https://graphql.service.alternatefutures.ai/graphql"
SDK__IPFS__STORAGE_API_URL="https://storage-ipfs.service.alternatefutures.ai"
SDK__UPLOAD_PROXY_API_URL="https://uploads.service.alternatefutures.ai"
SITE_SLUG_DOMAIN="af-cloud.app"
UI__APP_URL="https://app.alternatefutures.ai"
```

💡 The variables above point to our production environment, the same you interact with as an end-user.

Next, install the project dependencies:

```sh
pnpm i
```

Next, prepare your local changes and execute the commands to compute it.

In order to succeed, you're required to have the ability to execute commands in the binary, so we'll link the local package globally in your local system, as follows:

```sh
pnpm link -g
```

Everytime you prepare and save a change, you have to rebuild the binary:

```sh
pnpm build
```

You can call the global binary named `af`.

```sh
af
```

Learn the AlternateFutures CLI basic commands [here](#basic-commands). For extended documentation visit our [documentation site](https://alternatefutures.ai/docs).

### Code Format

Formatting and linting are facilitated by [BiomeJS](https://biomejs.dev). Configuration details can be found in:

```
biome.json
```

To format source code and apply changes directly in the file:

```sh
pnpm format
```

For checking source code formatting only:

```sh
pnpm format:check
```

To lint and apply changes directly in the file:

```sh
pnpm lint
```

For lint checks only:

```sh
pnpm lint:check
```

To both format and lint source code (with writes):

```sh
pnpm format:unsafe
```

### Changeset

Manage the versioning of changelog entries.

Declare an intent to release by executing the command and answering the wizard's questions:

```sh
pnpm changeset:add
```

## Authentication

The CLI requires authentication to interact with AlternateFutures Cloud. You can authenticate in two ways:

### Interactive Login (Recommended)

```bash
af login
```

This will open a browser window for authentication. Your credentials are stored securely in your system's config directory.

### Environment Variables

For CI/CD pipelines or automated workflows, use environment variables:

```bash
export AF_TOKEN="your-personal-access-token"
export AF_PROJECT_ID="your-project-id"
```

**Getting your tokens:**
- Personal Access Token: Generate from [AlternateFutures Dashboard](https://app.alternatefutures.ai)
- Project ID: Find in your project settings or use `af projects list`

**CI/CD Example (GitHub Actions):**

```yaml
- name: Deploy to AlternateFutures
  run: af sites deploy
  env:
    AF_TOKEN: ${{ secrets.AF_TOKEN }}
    AF_PROJECT_ID: ${{ secrets.AF_PROJECT_ID }}
```

💡 **Note:** As of v0.2.0, the legacy environment variables `FLEEK_TOKEN` and `FLEEK_PROJECT_ID` are deprecated. Please use `AF_TOKEN` and `AF_PROJECT_ID` instead.

## Decentralization & Censorship Resistance

Alternate Futures is built on decentralized infrastructure, ensuring your applications are **censorship-resistant** and **unstoppable**.

### 🌍 Decentralized Storage & Naming

| Technology | Purpose | Command |
|-----------|---------|---------|
| **IPFS** | Decentralized content storage | `af ipfs add ./file` |
| **IPNS** | Mutable pointers to IPFS content | `af ipns create --name myapp` |
| **ENS** | Human-readable .eth domains | `af domains register-ens --domain myapp.eth` |
| **Arweave** | Permanent, pay-once storage | `af domains register-arns --domain mysite` |

### Quick Start: Deploy to IPFS

```bash
# Deploy static site to decentralized IPFS network
af sites deploy --ipfs

# Create updatable IPNS record
af ipns create --name my-website --hash QmXxxx...

# Register human-readable ENS domain
af domains register-ens --domain myapp.eth --ipns k51qzi5uqu5...
```

### Why Decentralization?

✅ **No Single Point of Failure** - Content distributed across global network
✅ **Censorship Resistant** - No authority can take down your content
✅ **Immutable & Verifiable** - Content addressed by cryptographic hash
✅ **Cost Effective** - No server hosting fees
✅ **Privacy Focused** - No tracking or analytics by default

### Architecture

```
User Browser → ENS (myapp.eth) → IPNS → IPFS → Distributed Nodes
```

### Learn More

- **[Complete Decentralization Guide](./docs/DECENTRALIZATION.md)** - In-depth documentation
- **[IPFS Commands](./docs/DECENTRALIZATION.md#decentralized-storage-ipfs)** - Upload to IPFS
- **[IPNS Guide](./docs/DECENTRALIZATION.md#mutable-addressing-ipns)** - Mutable content addressing
- **[ENS Domains](./docs/DECENTRALIZATION.md#decentralized-naming-ens)** - Human-readable names
- **[Arweave Storage](./docs/DECENTRALIZATION.md#permanent-storage-arweave)** - Permanent archival
- **[Best Practices](./docs/DECENTRALIZATION.md#best-practices)** - Production deployment patterns

## Security

Security is a top priority for Alternate Futures. We maintain comprehensive security practices to protect our users and their data.

### Security Status

- ✅ **0 Known Vulnerabilities** - All dependencies regularly audited
- ✅ **Automated Security Scanning** - Daily vulnerability checks and CodeQL analysis
- ✅ **Secret Protection** - TruffleHog scans for leaked credentials
- ✅ **Dependency Monitoring** - Weekly Dependabot updates

### Resources

- [**Security Policy (SECURITY.md)**](./SECURITY.md) - Vulnerability reporting and security best practices
- [**Security Guidelines (docs/SECURITY_GUIDELINES.md)**](./docs/SECURITY_GUIDELINES.md) - Developer security guidelines
- [**Security Improvements Summary**](./SECURITY_IMPROVEMENTS.md) - Recent security enhancements
- [**Report a Vulnerability**](mailto:security@alternatefutures.ai) - Private security disclosure

### Best Practices

**For End Users:**
- Keep the CLI updated to the latest version
- Never commit credentials or `.env` files
- Use environment variables for tokens in CI/CD
- Rotate access tokens regularly

**For Developers:**
- Run `pnpm audit` before committing
- Review the [Security Guidelines](./docs/SECURITY_GUIDELINES.md)
- Complete the security checklist in PR templates
- Validate all user input

### Automated Security

This repository includes:
- **CodeQL Analysis** - Automated code security scanning
- **Dependabot** - Automated dependency updates
- **Secret Scanning** - Detection of committed secrets
- **Dependency Review** - PR-based vulnerability blocking
- **Daily Audits** - Continuous vulnerability monitoring

## Basic commands

The AlternateFutures CLI command has the following structure:

```bash
af <service> <command> [options and parameters]
```

To view all available services and commands use:

```bash
af help
```

To see all available commands for a service, use the help documentation as any one of the followings:

```bash
af <service> help
af <service> <command> help
```

To get the version of the AlternateFutures CLI:

```bash
af --version
```

## Contributing

This section guides you through the process of contributing to our open-source project. From creating a feature branch to submitting a pull request, get started by:

1. Fork the project [here](https://github.com/alternatefutures/package-cloud-cli)
2. Create your feature branch using our [branching strategy](#branching-strategy), e.g. `git checkout -b feat/my-new-feature`
3. Run the tests: `pnpm test`
4. Commit your changes by following our [commit conventions](#conventional-commits), e.g. `git commit -m 'chore: 🤖 my contribution description'`
5. Push to the branch, e.g. `git push origin feat/my-new-feature`
6. Create new Pull Request following the corresponding template guidelines

### Branching strategy

The develop branch serves as the main integration branch for features, enhancements, and fixes. It is always in a deployable state and represents the latest development version of the application.

Feature branches are created from the develop branch and are used to develop new features or enhancements. They should be named according to the type of work being done and the scope of the feature and in accordance with conventional commits [here](#conventional-commits).

### Conventional commits

We prefer to commit our work following [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0) conventions. Conventional Commits are a simple way to write commit messages that both people and computers can understand. It help us keep track fo changes in a consistent manner, making it easier to see what was added, changed, or fixed in each commit or update.

The commit messages are formatted as **[type]/[scope]**
The **type** is a short descriptor indicating the nature of the work (e.g., feat, fix, docs, style, refactor, test, chore). This follows the conventional commit types.

The **scope** is a more detailed description of the feature or fix. This could be the component or part of the codebase affected by the change.

Here's an example of different conventional commits messages that you should follow:

```txt
test: 💍 Adding missing tests
feat: 🎸 A new feature
fix: 🐛 A bug fix
chore: 🤖 Build process or auxiliary tool changes
docs: 📝 Documentation only changes
refactor: 💡 A code change that neither fixes a bug or adds a feature
style: 💄 Markup, white-space, formatting, missing semi-colons...
```
