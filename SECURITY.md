# Security Policy

## Our Commitment

At Alternate Futures, we take security seriously. As an open source, privacy-focused, and censorship-resistant platform, we are committed to protecting our users and their data.

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| 0.1.x   | :x:                |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We appreciate the security community's efforts to responsibly disclose vulnerabilities. If you discover a security issue, please follow these steps:

### How to Report

1. **DO NOT** open a public GitHub issue
2. Email security findings to: **security@alternatefutures.ai**
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if applicable)
   - Your contact information

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies by severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

### What to Expect

1. **Acknowledgment**: We'll confirm receipt of your report
2. **Investigation**: Our security team will investigate the issue
3. **Updates**: Regular status updates throughout the process
4. **Resolution**: We'll work on a fix and coordinate disclosure
5. **Credit**: We'll publicly acknowledge your contribution (unless you prefer to remain anonymous)

## Security Best Practices

When using the Alternate Futures CLI:

### For End Users

- Always use the latest version
- Protect your authentication tokens (`AF_TOKEN`)
- Never commit `.env` files or credentials to version control
- Use environment variables for sensitive data in CI/CD
- Regularly rotate your access tokens
- Review permissions when granting access

### For Developers

- Run `pnpm audit` regularly to check for vulnerabilities
- Keep dependencies up to date
- Use Dependabot alerts
- Follow secure coding practices
- Validate and sanitize all inputs
- Use parameterized queries for database operations
- Implement proper authentication and authorization
- Enable multi-factor authentication for your account

## Security Features

### Built-in Protections

- Secure credential storage using system keychain
- Encrypted communication with AlternateFutures Cloud
- Input validation and sanitization
- Protection against common vulnerabilities (XSS, injection attacks)

### Monitoring

We continuously monitor for:
- Dependency vulnerabilities (Dependabot)
- Code security issues (CodeQL)
- Secret leakage (TruffleHog)
- Common CVEs and security advisories

## Privacy Policy

Our commitment to privacy includes:

- **Data Minimization**: We only collect necessary data
- **No Tracking**: No user behavior tracking or analytics without consent
- **Encryption**: All data transmission is encrypted
- **Transparency**: Open source code allows community audits

## Compliance

We strive to comply with:
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- Industry best practices for security

## Bug Bounty Program

We currently do not have a formal bug bounty program, but we deeply appreciate responsible disclosure and will:
- Publicly acknowledge contributors (with permission)
- Provide recognition in our security hall of fame
- Consider rewards for critical vulnerabilities on a case-by-case basis

## Hall of Fame

We thank the following security researchers for responsibly disclosing vulnerabilities:

<!-- List will be updated as researchers contribute -->

*Be the first to help secure Alternate Futures!*

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)

## Contact

- **Security Issues**: security@alternatefutures.ai
- **General Support**: https://alternatefutures.ai/docs
- **GitHub Issues**: https://github.com/alternatefutures/package-cloud-cli/issues (for non-security bugs)

---

Last Updated: 2025-11-12
