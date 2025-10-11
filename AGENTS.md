# AGENTS.md - AlternateFutures CLI

## Project Context

The **AlternateFutures CLI** (`@alternatefutures/cli`) is a command-line interface tool for interacting with the AlternateFutures Cloud platform. It enables developers to deploy static sites, manage serverless functions, handle storage (IPFS), configure domains, and manage AI agents - all from the terminal.

**Key Features:**
- 🌐 Static site deployment (SSG, SSR frameworks)
- ⚡ Serverless Functions deployment
- 🗄️ IPFS Storage management
- 🌍 Domain and DNS configuration
- 🤖 AI Agent hosting (Eliza, ComfyUI)
- 🔐 Authentication and project management

## Architecture Overview

### Technology Stack
- **Runtime:** Node.js (>=18.18.2)
- **Language:** TypeScript
- **Package Manager:** pnpm
- **CLI Framework:** Commander.js
- **Build Tool:** esbuild (for bundling)
- **Testing:** Vitest
- **Linting/Formatting:** BiomeJS
- **Version Management:** Changesets
- **SDK:** `@alternatefutures/sdk` (GraphQL-based)

### Project Structure

```
cloud-cli/
├── src/
│   ├── commands/           # CLI command implementations
│   │   ├── auth/          # Authentication (login, logout, whoami)
│   │   ├── sites/         # Site deployment & management
│   │   ├── functions/     # Serverless functions
│   │   ├── storage/       # IPFS storage operations
│   │   ├── domains/       # Domain management
│   │   ├── gateways/      # Private gateway management
│   │   ├── ipns/          # IPNS record management
│   │   ├── ens/           # ENS domain integration
│   │   └── applications/  # Application credentials
│   ├── guards/            # Authentication & authorization guards
│   ├── output/            # CLI output formatting (tables, spinners, colors)
│   ├── utils/             # Utilities (translation, configuration, fs)
│   ├── templates/         # Configuration file templates
│   ├── cli.ts            # CLI entry point
│   ├── config.ts         # Configuration management
│   ├── secrets.ts        # Environment variable secrets
│   └── defined.ts        # Build-time environment variables
├── locales/              # Internationalization (i18n) strings
├── bin/                  # Executable entry point
├── dist/                 # Compiled output (gitignored)
├── .changeset/           # Changeset files for version management
└── .github/workflows/    # CI/CD pipelines
```

## Key Files and Their Purposes

### Entry Points
- **`bin/index.js`** - Executable entry point (#!/usr/bin/env node)
- **`src/cli.ts`** - Main CLI setup, command registration, ASCII art banner

### Core Configuration
- **`src/config.ts`** - User configuration (PAT, project ID) stored via `conf` package
- **`src/secrets.ts`** - Environment variable secrets (AF_TOKEN, AF_PROJECT_ID)
- **`src/defined.ts`** - Build-time environment variables (API URLs)

### Command Structure
Each command follows this pattern:
```typescript
// Example: src/commands/sites/deploy.ts
import { withGuards } from '../../guards/withGuards';
import type { SdkGuardedFunction } from '../../guards/types';

const deployAction: SdkGuardedFunction<DeployArgs> = async ({ sdk, args }) => {
  // Implementation
};

export const deployActionHandler = withGuards(deployAction, {
  scopes: { authenticated: true, project: true, site: true }
});
```

### Guards System
- **`src/guards/withGuards.ts`** - HOF that wraps actions with auth/scope checks
- Guards ensure user is authenticated, has project/site context before executing commands

### Output System
- **`src/output/Output.ts`** - Abstraction for CLI output (success, error, warn, table, spinner)
- Handles colors, formatting, and user-facing messages

### Utilities
- **`src/utils/translation.ts`** - i18n utilities (loads from `locales/en.json`)
- **`src/utils/configuration/`** - Manages `af.config.{js,ts,json}` files
- **`src/utils/fs.ts`** - File system helpers

## Environment Variables

### User Secrets (from environment or config)
- **`AF_TOKEN`** - Personal Access Token for authentication
- **`AF_PROJECT_ID`** - Current project ID
- *(Legacy: `FLEEK_TOKEN`, `FLEEK_PROJECT_ID` - deprecated as of v0.2.0)*

### Build-Time Variables (defined at compile time)
- **`UI__APP_URL`** - Dashboard URL (e.g., `https://app.alternatefutures.ai`)
- **`SDK__GRAPHQL_API_URL`** - GraphQL API endpoint
- **`SDK__AUTH_APPS_URL`** - Authentication apps URL
- **`SDK__IPFS__STORAGE_API_URL`** - IPFS storage API
- **`SDK__UPLOAD_PROXY_API_URL`** - Upload proxy API

### CI/CD Secrets (GitHub Actions)
- **`AF_TOKEN`** - Token for CI deployments
- **`AF_PROJECT_ID`** - Project ID for CI
- **`AF_PLATFORM_BOT_APP_ID`** - GitHub App ID for bot
- **`AF_PLATFORM_BOT_PRIVATE_KEY`** - GitHub App private key

## Development Workflows

### Setup
```bash
# Clone and install dependencies
git clone https://github.com/alternatefutures/cloud-cli.git
cd cloud-cli
pnpm install

# Link CLI globally for testing
pnpm link -g

# Create production environment file
cp .env.production.example .env.production
```

### Development Cycle
```bash
# Build the CLI
pnpm build

# Run tests
pnpm test                 # Run all tests
pnpm test:watch          # Watch mode
pnpm test:coverage       # With coverage

# Type checking
pnpm tsc                 # Type check only (no output)

# Formatting & Linting
pnpm format              # Auto-format with Biome
pnpm format:check        # Check formatting only
pnpm lint                # Auto-lint with Biome
pnpm lint:check          # Check linting only
pnpm format:unsafe       # Format + lint with auto-fixes
```

### Making Changes
1. Create feature branch: `git checkout -b feat/my-feature`
2. Make changes to source files in `src/`
3. Rebuild: `pnpm build`
4. Test locally: `af <command>`
5. Run tests: `pnpm test`
6. Create changeset: `pnpm changeset:add`
7. Commit: `git commit -m "feat: description"`
8. Push and create PR

### Testing Strategy
- **Unit Tests:** Located alongside source files (`*.test.ts`)
- **Mocking:** SDK and CLI output are mocked in tests
- **Test Runner:** Vitest with mock-stdin for interactive prompts
- **Coverage:** Use `pnpm test:coverage` to check coverage

## Common Tasks and Commands

### Adding a New Command
1. Create command file: `src/commands/<service>/<command>.ts`
2. Implement action with `SdkGuardedFunction` type
3. Wrap with `withGuards()` specifying required scopes
4. Register in parent index: `src/commands/<service>/index.ts`
5. Add i18n strings to `locales/en.json`
6. Write tests: `src/commands/<service>/<command>.test.ts`

### Modifying Configuration Schema
1. Update types in `src/utils/configuration/types.ts`
2. Update templates in `src/templates/sites/config/`
3. Update schema validation if applicable
4. Update documentation

### Updating Dependencies
```bash
# Update @alternatefutures packages
pnpm update @alternatefutures/sdk @alternatefutures/errors # etc

# Update all dependencies
pnpm update --latest
```

### Creating a Release
1. Ensure all changes have changesets: `pnpm changeset:add`
2. Push changes to `develop` branch
3. CI will automatically bump version and update CHANGELOG
4. After CI completes, pull latest and publish: `pnpm release`

## SDK Integration

The CLI uses `@alternatefutures/sdk` for all API interactions:

```typescript
import { AlternateFuturesSdk, PersonalAccessTokenService } from '@alternatefutures/sdk/node';

// SDK is initialized in guards and passed to actions
const accessTokenService = new PersonalAccessTokenService({ personalAccessToken });
const sdk = new AlternateFuturesSdk({ accessTokenService });

// Available services:
sdk.sites()           // Site management
sdk.functions()       // Serverless functions
sdk.storage()         // IPFS storage
sdk.domains()         // Domain management
sdk.privateGateways() // Private gateways
sdk.ipns()           // IPNS records
sdk.ens()            // ENS integration
```

## Configuration Files

### User Configuration (`af.config.{js,ts,json}`)
```typescript
// Example af.config.ts
import { defineConfig } from '@alternatefutures/cli';

export default defineConfig({
  sites: [{
    slug: 'my-site',
    distDir: 'dist',
    buildCommand: 'npm run build',
  }]
});
```

### Global Configuration
Stored in OS-specific config directory via `conf` package:
- macOS: `~/Library/Preferences/alternate-futures-nodejs/global.json`
- Linux: `~/.config/alternate-futures-nodejs/global.json`
- Windows: `%APPDATA%\alternate-futures-nodejs\Config\global.json`

## CI/CD Workflows

### Automated Workflows
1. **`test-runner.yml`** - Runs tests on PRs
2. **`code-format.yml`** - Auto-formats code and commits
3. **`changeset-version-management.yml`** - Bumps version when changesets are pushed
4. **`build-dry-run.yml`** - Validates build process
5. **`conventional-commits.yml`** - Validates commit message format

### GitHub Actions Deployment
Users can deploy sites via GitHub Actions:
```yaml
# .github/workflows/af-deploy.yaml
- run: npm install -g @alternatefutures/cli
- run: af sites deploy
  env:
    AF_TOKEN: ${{ secrets.AF_TOKEN }}
    AF_PROJECT_ID: ${{ secrets.AF_PROJECT_ID }}
```

## Debugging Tips

### Enable Debug Mode
```bash
# Set environment variable for verbose logging
DEBUG=* af <command>
```

### Test CLI Without Installing
```bash
# Run directly from source
pnpm build && node bin/index.js <command>
```

### Inspect Configuration
```bash
# View stored config location
node -e "const Conf = require('conf'); console.log(new Conf({projectName: 'alternate-futures'}).path)"

# View current config
af whoami
```

### Common Issues
- **"Command not found"** - Run `pnpm link -g` after building
- **"Unauthorized"** - Run `af login` to authenticate
- **"No project selected"** - Run `af projects switch` or set `AF_PROJECT_ID`
- **TypeScript errors** - Run `pnpm tsc` to check for type errors

## Related Repositories

- **`cloud-sdk`** - TypeScript SDK (GraphQL client)
- **`cloud-dashboard`** - Web dashboard UI
- **`*-cloud-template`** - Framework templates (Next.js, Astro, Hugo, etc.)
- **`next-on-af-cloud`** - Next.js adapter for AlternateFutures

## Recent Changes (v0.2.0)

**Breaking Changes:**
- Environment variables renamed: `FLEEK_TOKEN` → `AF_TOKEN`, `FLEEK_PROJECT_ID` → `AF_PROJECT_ID`
- Workflow file renamed: `fleek-deploy.yaml` → `af-deploy.yaml`
- Function env var: `FLEEK_URL` → `AF_URL`
- Temp directory: `.fleek` → `.af`

**Migration Guide:**
- Update CI/CD secrets to use new variable names
- Update local environment variables
- Regenerate GitHub Actions workflows with `af sites ci`

## Contributing

See the main [README.md](./README.md) for contribution guidelines, branching strategy, and commit conventions.

For questions or issues, open an issue at: https://github.com/alternatefutures/cloud-cli/issues

---

**Last Updated:** 2025-10-11
**Version:** 0.2.0 (pending release)
