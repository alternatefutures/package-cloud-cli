---
"@alternatefutures/cli": minor
---

Complete internal rebranding by removing all Fleek variable names and references.

**Breaking Changes:**
- Environment variables renamed: `FLEEK_TOKEN` → `AF_TOKEN`, `FLEEK_PROJECT_ID` → `AF_PROJECT_ID`
- Configuration constants updated: `FLEEK_CONFIG_*` → `AF_CONFIG_*`
- GitHub Actions workflow file renamed: `fleek-deploy.yaml` → `af-deploy.yaml`
- GitHub Actions secrets renamed: `FLEEK_TOKEN` → `AF_TOKEN`, `FLEEK_PROJECT_ID` → `AF_PROJECT_ID`
- Temp directory changed: `.fleek` → `.af`
- Function environment variable: `FLEEK_URL` → `AF_URL`

Users will need to update their environment variables and CI/CD configurations to use the new naming convention.
