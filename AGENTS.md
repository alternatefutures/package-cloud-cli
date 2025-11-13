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
git clone https://github.com/alternatefutures/package-cloud-cli.git
cd package-cloud-cli
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
// Example af.config.ts with sites
import { defineConfig } from '@alternatefutures/cli';

export default defineConfig({
  sites: [{
    slug: 'my-site',
    distDir: 'dist',
    buildCommand: 'npm run build',
  }]
});

// Example af.config.ts with functions and routing
import type { AlternateFuturesFunctionConfig } from '@alternatefutures/cli';

const config: AlternateFuturesFunctionConfig = {
  name: 'my-gateway',
  type: 'function',
  routes: {
    '/api/users/*': 'https://users-service.com',
    '/api/products/*': 'https://products-service.com',
    '/api/*': 'https://api.example.com',
    '/*': 'https://default.com'
  },
};

export default config;
```

### Global Configuration
Stored in OS-specific config directory via `conf` package:
- macOS: `~/Library/Preferences/alternate-futures-nodejs/global.json`
- Linux: `~/.config/alternate-futures-nodejs/global.json`
- Windows: `%APPDATA%\alternate-futures-nodejs\Config\global.json`

## Function Routing Feature

AlternateFutures Functions support native routing/proxying to enable gateway patterns and microservice routing. This allows a single function to act as a reverse proxy, routing requests to different backend services based on path patterns.

### Overview

The routing feature enables:
- **API Gateway Pattern** - Route requests to multiple backend services
- **Microservice Routing** - Direct traffic to different microservices based on paths
- **Path-Based Proxying** - Forward requests with wildcard and exact matching
- **Header Preservation** - Automatic forwarding of headers, query params, and body
- **X-Forwarded Headers** - Automatic injection of X-Forwarded-* headers for proxying

### Configuration

Routes are configured as an object mapping path patterns to target URLs:

```typescript
routes: {
  '/api/users/*': 'https://users-service.com',
  '/api/products/*': 'https://products-service.com',
  '/api/*': 'https://api.example.com',
  '/*': 'https://default.com'
}
```

**Path Pattern Rules:**
- Must start with `/`
- Supports wildcards with `*` (matches any path segment)
- Routes are automatically prioritized:
  1. Exact matches (e.g., `/api/users`)
  2. Specific paths (e.g., `/api/users/123`)
  3. Wildcards (e.g., `/api/*`, `/*`)

**Target URL Requirements:**
- Must be a valid URL
- Must use `http://` or `https://` protocol
- Can include ports, paths, and query parameters

### CLI Usage

#### Create Function with Routes

```bash
# Using command line flag with JSON
af functions create --name my-gateway --routes '{""/api/*"": ""https://api.example.com""}'

# Using command line flag with file path
af functions create --name my-gateway --routes ./routes.json

# Using af.config.js (automatic during deploy)
af functions create --name my-gateway
```

#### Update Function Routes

```bash
# Update routes via command line
af functions update --functionName my-gateway --routes '{""/new-path/*"": ""https://new-service.com""}'

# Update routes via file
af functions update --functionName my-gateway --routes ./new-routes.json
```

#### Deploy with Routes

When deploying a function, routes are automatically loaded from `af.config.js` if present:

```bash
# Deploy function (reads routes from af.config.js automatically)
af functions deploy --name my-gateway --path ./index.js
```

### Configuration File Integration

Routes can be defined in `af.config.js`, `af.config.ts`, or `af.config.json`:

**JavaScript Example (`af.config.js`):**
```javascript
module.exports = {
  name: 'my-gateway',
  type: 'function',
  routes: {
    '/api/users/*': 'https://users-service.com',
    '/api/products/*': 'https://products-service.com',
    '/api/*': 'https://api.example.com',
    '/*': 'https://default.com'
  },
};
```

**TypeScript Example (`af.config.ts`):**
```typescript
import type { AlternateFuturesFunctionConfig } from '@alternatefutures/cli';

const config: AlternateFuturesFunctionConfig = {
  name: 'my-gateway',
  type: 'function',
  routes: {
    '/api/users/*': 'https://users-service.com',
    '/api/products/*': 'https://products-service.com',
  },
};

export default config;
```

**JSON Example (`af.config.json`):**
```json
{
  "functions": [{
    "name": "my-gateway",
    "type": "function",
    "routes": {
      "/api/users/*": "https://users-service.com",
      "/api/products/*": "https://products-service.com"
    }
  }]
}
```

### Route Validation

The CLI validates routes before sending to the backend:
- Path patterns must start with `/`
- Target URLs must be valid and use http/https
- Routes object cannot be empty
- All values must be strings

Validation errors will be displayed with helpful messages indicating the issue.

### Examples

**API Gateway Pattern:**
```typescript
// Route different API versions to different services
{
  '/v1/api/*': 'https://api-v1.example.com',
  '/v2/api/*': 'https://api-v2.example.com',
  '/*': 'https://api-latest.example.com'
}
```

**Microservice Routing:**
```typescript
// Route to different microservices by domain
{
  '/auth/*': 'https://auth-service.com',
  '/users/*': 'https://users-service.com',
  '/orders/*': 'https://orders-service.com',
  '/payments/*': 'https://payments-service.com',
  '/*': 'https://frontend.com'
}
```

**Development/Production Routing:**
```typescript
// Route to different environments
{
  '/staging/*': 'https://staging.example.com',
  '/*': 'https://production.example.com'
}
```

### Related Files

- **Route Validation:** `src/commands/functions/utils/routeValidation.ts`
- **Config Loading:** `src/commands/functions/utils/loadFunctionConfig.ts`
- **Create Command:** `src/commands/functions/create.ts`
- **Update Command:** `src/commands/functions/update.ts`
- **Deploy Command:** `src/commands/functions/deploy.ts`
- **Config Types:** `src/utils/configuration/types.ts`
- **Tests:** `src/commands/functions/utils/*.test.ts`

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

For questions or issues, open an issue at: https://github.com/alternatefutures/package-cloud-cli/issues

---

**Last Updated:** 2025-10-11
**Version:** 0.2.0 (pending release)
