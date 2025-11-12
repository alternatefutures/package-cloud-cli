# Security Guidelines for Developers

This document provides security best practices and guidelines for developers contributing to the Alternate Futures CLI project.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Secrets Management](#secrets-management)
3. [Input Validation](#input-validation)
4. [Dependency Management](#dependency-management)
5. [Error Handling](#error-handling)
6. [Cryptography](#cryptography)
7. [Logging & Monitoring](#logging--monitoring)
8. [Code Review Checklist](#code-review-checklist)

## Authentication & Authorization

### Best Practices

- **Never** hardcode credentials, tokens, or API keys
- Always use environment variables for sensitive configuration:
  ```typescript
  // ✅ Good
  const token = process.env.AF_TOKEN;

  // ❌ Bad
  const token = "af_1234567890abcdef";
  ```
- Implement proper token validation before processing requests
- Use secure credential storage (system keychain) when possible
- Rotate credentials regularly
- Implement rate limiting for authentication endpoints

### Token Storage

The CLI uses `conf` package for secure configuration storage:

```typescript
import Conf from 'conf';

const config = new Conf({
  projectName: '@alternatefutures/cli',
  encryptionKey: 'your-encryption-key'
});

// Store securely
config.set('accessToken', token);
```

## Secrets Management

### Environment Variables

Use `.env` files for local development (never commit them!):

```bash
# .env.production (example)
AF_TOKEN=your_token_here
AF_PROJECT_ID=your_project_id
```

Ensure `.env` files are in `.gitignore`:

```gitignore
.env
.env.*
.env.local
.env.production.local
```

### CI/CD Secrets

For GitHub Actions, use encrypted secrets:

```yaml
- name: Deploy
  run: pnpm deploy
  env:
    AF_TOKEN: ${{ secrets.AF_TOKEN }}
    AF_PROJECT_ID: ${{ secrets.AF_PROJECT_ID }}
```

## Input Validation

### Validate All User Input

Always validate and sanitize user input to prevent injection attacks:

```typescript
import { z } from 'zod';

// Define schema
const siteNameSchema = z.string()
  .min(1)
  .max(63)
  .regex(/^[a-z0-9-]+$/);

// Validate input
function validateSiteName(name: string): boolean {
  try {
    siteNameSchema.parse(name);
    return true;
  } catch (error) {
    throw new Error('Invalid site name format');
  }
}
```

### Path Traversal Prevention

When handling file paths, always validate and sanitize:

```typescript
import path from 'path';

function safeFilePath(userPath: string, baseDir: string): string {
  const resolved = path.resolve(baseDir, userPath);

  // Ensure the path is within baseDir
  if (!resolved.startsWith(baseDir)) {
    throw new Error('Path traversal attempt detected');
  }

  return resolved;
}
```

### Command Injection Prevention

**Never** use `eval()` or pass unsanitized input to shell commands:

```typescript
// ❌ Dangerous
exec(`git clone ${userInput}`);

// ✅ Safe
import { spawn } from 'child_process';
spawn('git', ['clone', userInput]);
```

## Dependency Management

### Regular Audits

Run security audits regularly:

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically where possible
pnpm audit --fix

# View detailed audit report
pnpm audit --json
```

### Dependency Updates

- Keep dependencies up to date
- Review Dependabot PRs promptly
- Test thoroughly after updates
- Use exact versions for critical dependencies

### Supply Chain Security

- Verify package authenticity before installing
- Use `pnpm` for better dependency isolation
- Review package permissions
- Be cautious with packages that have:
  - Few maintainers
  - Low download counts
  - Recent major version bumps
  - Pre/post install scripts

## Error Handling

### Never Leak Sensitive Information

```typescript
// ❌ Bad - leaks internal details
catch (error) {
  console.error('Database connection failed:', error.message);
  throw new Error(`Failed to connect to ${dbHost}:${dbPort}`);
}

// ✅ Good - generic error message
catch (error) {
  logger.error('Database connection failed', { error });
  throw new Error('Service temporarily unavailable');
}
```

### Proper Error Logging

```typescript
import { logger } from './logger';

try {
  await performOperation();
} catch (error) {
  // Log internally with details
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: { userId, operation }
  });

  // Return generic message to user
  throw new Error('Operation failed. Please try again.');
}
```

## Cryptography

### Use Well-Tested Libraries

For the CLI, we use:

- `eciesjs` for encryption
- `hash-wasm` for hashing
- Native Node.js `crypto` module

```typescript
import { createHash } from 'crypto';

// ✅ Good - using standard algorithms
function hashData(data: string): string {
  return createHash('sha256')
    .update(data)
    .digest('hex');
}

// ❌ Bad - custom crypto implementation
function customHash(data: string): string {
  // Never implement your own crypto!
}
```

### Secure Random Generation

```typescript
import { randomBytes } from 'crypto';

// Generate secure random tokens
function generateToken(): string {
  return randomBytes(32).toString('hex');
}
```

## Logging & Monitoring

### What to Log

✅ **DO log:**
- Authentication attempts (success/failure)
- Authorization failures
- Input validation failures
- System errors
- Security-relevant events

❌ **DON'T log:**
- Passwords or tokens
- Personal Identifiable Information (PII)
- Credit card numbers
- API keys or secrets

### Secure Logging Example

```typescript
import { logger } from './logger';

// ✅ Good
logger.info('User login successful', {
  userId: user.id,
  timestamp: new Date()
});

// ❌ Bad
logger.info('User login successful', {
  userId: user.id,
  password: user.password, // Never log passwords!
  token: user.token        // Never log tokens!
});
```

## Code Review Checklist

When reviewing code for security, check for:

### Authentication & Authorization
- [ ] No hardcoded credentials
- [ ] Proper authentication checks
- [ ] Authorization validated before operations
- [ ] Tokens stored securely

### Input Validation
- [ ] All user input validated
- [ ] No command injection vulnerabilities
- [ ] No path traversal vulnerabilities
- [ ] No SQL/NoSQL injection vulnerabilities

### Error Handling
- [ ] Errors handled gracefully
- [ ] No sensitive info in error messages
- [ ] Proper logging implemented
- [ ] Stack traces not exposed to users

### Dependencies
- [ ] No known vulnerabilities (`pnpm audit`)
- [ ] Dependencies up to date
- [ ] No suspicious packages
- [ ] License compliance checked

### Data Protection
- [ ] Sensitive data encrypted
- [ ] Secure communication (HTTPS/WSS)
- [ ] No secrets in code or logs
- [ ] PII handled appropriately

### Code Quality
- [ ] Linter passes
- [ ] Tests pass
- [ ] Code follows security guidelines
- [ ] Documentation updated

## Security Testing

### Manual Testing

Before submitting a PR, test for:

1. **Authentication bypass**: Can operations be performed without proper auth?
2. **Authorization bypass**: Can users access resources they shouldn't?
3. **Input validation**: What happens with malformed input?
4. **Error handling**: Do errors leak sensitive information?

### Automated Testing

Run security scans:

```bash
# Dependency audit
pnpm audit

# Linting with security rules
pnpm lint

# Type checking
pnpm tsc

# Run tests
pnpm test
```

## Incident Response

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email security@alternatefutures.ai immediately
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
4. Wait for response before public disclosure

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

## Questions?

If you have questions about security practices, please:
- Check the [SECURITY.md](../SECURITY.md) file
- Consult with the security team
- Review existing secure code patterns in the codebase

---

**Remember**: Security is everyone's responsibility. When in doubt, ask!
