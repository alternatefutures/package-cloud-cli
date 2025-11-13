# Internationalization (i18n) Implementation

## Linear Ticket Template

**Title:** Implement Internationalization (i18n) Support for Global Accessibility

**Team:** Engineering
**Project:** Alternate Futures CLI
**Priority:** High
**Labels:** `enhancement`, `i18n`, `accessibility`, `user-experience`
**Estimate:** 3 weeks (15 working days)

---

## Summary

Implement comprehensive internationalization (i18n) support to make the AlternateFutures CLI accessible to non-English speaking users worldwide. This aligns with our mission as a censorship-resistant, privacy-focused platform serving a global audience.

**Current State:** English-only CLI (365 strings in `/locales/en.json`)
**Desired State:** Multi-language support with auto-detection, starting with Spanish

---

## Problem Statement

The CLI currently only supports English, which:
- Limits accessibility for non-English speaking users (majority of world population)
- Contradicts our mission of global censorship resistance
- Reduces adoption in non-English speaking markets
- Creates barriers for international developers

---

## Success Criteria

✅ Language auto-detection from system locale
✅ Spanish localization complete (365 strings translated)
✅ Emoji accessibility mode (`--no-emoji` flag)
✅ Documentation for contributors to add new languages
✅ All tests pass with new i18n system
✅ No breaking changes to existing English users

---

## Implementation Plan

### Phase 1: Infrastructure (Week 1)

#### 1.1 Language Detection System
**File:** `/src/utils/translation.ts`

**Tasks:**
- [ ] Implement `detectLanguage()` function
  - Check `AF_LANGUAGE` environment variable
  - Fall back to system `LANG` variable
  - Default to `en` for unsupported languages
- [ ] Update `loadJSONFromPackageRoot()` to load language-specific files
- [ ] Add supported languages list: `['en', 'es']`

**Code Example:**
```typescript
function detectLanguage(): string {
  const envLang = process.env.AF_LANGUAGE;
  if (envLang && supportedLanguages.includes(envLang)) {
    return envLang;
  }

  const systemLang = process.env.LANG?.split('_')[0] || 'en';
  return supportedLanguages.includes(systemLang) ? systemLang : 'en';
}
```

**Tests:**
- [ ] Test `AF_LANGUAGE` env var override
- [ ] Test system `LANG` detection
- [ ] Test fallback to English
- [ ] Test unsupported language handling

---

#### 1.2 Plural Handling
**File:** `/src/utils/translation.ts` (Line 55 - TODO)

**Tasks:**
- [ ] Implement plural rules for English
- [ ] Implement plural rules for Spanish
- [ ] Add `{count}` placeholder support
- [ ] Update type definitions

**Code Example:**
```typescript
function pluralize(
  key: string,
  count: number,
  language: string
): string {
  const rules = {
    en: (n: number) => n === 1 ? 'one' : 'other',
    es: (n: number) => n === 1 ? 'one' : 'other',
  };

  const form = rules[language](count);
  return t(`${key}.${form}`, { count });
}
```

**Tests:**
- [ ] Test singular/plural forms in English
- [ ] Test singular/plural forms in Spanish
- [ ] Test edge cases (0, negative numbers)

---

### Phase 2: Spanish Localization (Week 2)

#### 2.1 Translation File Creation
**File:** `/locales/es.json` (NEW)

**Tasks:**
- [ ] Copy `/locales/en.json` to `/locales/es.json`
- [ ] Translate all 365 strings to Spanish
- [ ] Review translations for technical accuracy
- [ ] Validate JSON syntax and placeholders

**Key Translation Areas:**
```
- Success/Error/Warning messages (50 strings)
- IPFS/IPNS commands (30 strings)
- Domain commands (40 strings)
- Site deployment (50 strings)
- Project management (30 strings)
- Function commands (30 strings)
- Gateway commands (20 strings)
- Auth commands (15 strings)
- Help text (100 strings)
```

**Quality Checks:**
- [ ] Placeholder variables preserved (`{variable}`)
- [ ] Technical terms handled correctly (IPFS, IPNS, ENS)
- [ ] Tone consistent with CLI voice
- [ ] Native speaker review

---

#### 2.2 Type Definitions
**File:** `/locales/es.d.ts` (NEW)

**Tasks:**
- [ ] Generate TypeScript types for Spanish locale
- [ ] Ensure type parity with English
- [ ] Update build process to include new file

---

### Phase 3: Accessibility (Week 2-3)

#### 3.1 Emoji Accessibility Mode
**File:** `/src/output/Output.ts`

**Tasks:**
- [ ] Add `--no-emoji` CLI flag
- [ ] Add `NO_EMOJI` environment variable support
- [ ] Replace emoji icons with text equivalents
- [ ] Add ASCII fallback mode

**Mapping:**
```typescript
const iconFallbacks = {
  '✅': '[OK]',
  '❌': '[ERROR]',
  '⚠️': '[WARN]',
  '💡': '[INFO]',
  '🤖': '[BOT]',
  '🌐': '[WEB]',
  '🔐': '[SECURE]',
};
```

**Tests:**
- [ ] Test emoji rendering (default)
- [ ] Test `--no-emoji` flag
- [ ] Test `NO_EMOJI` env var
- [ ] Test screen reader compatibility

---

#### 3.2 Terminal Width Detection
**File:** `/src/output/Output.ts`

**Tasks:**
- [ ] Implement `process.stdout.columns` detection
- [ ] Add responsive table formatting
- [ ] Handle narrow terminals gracefully

**Tests:**
- [ ] Test on 80-column terminal
- [ ] Test on 120-column terminal
- [ ] Test on mobile-width terminals (40 columns)

---

### Phase 4: Documentation & Testing (Week 3)

#### 4.1 i18n Documentation
**File:** `/docs/i18n.md` (NEW)

**Sections:**
- [ ] Overview of i18n system
- [ ] How to add a new language
- [ ] Translation guidelines
- [ ] Testing translations
- [ ] Contributing translations

**File:** `/docs/CONTRIBUTING.md` (UPDATE)
- [ ] Add "Translation" section
- [ ] Link to i18n.md
- [ ] Add translator guidelines

---

#### 4.2 README Updates
**File:** `/README.md` (UPDATE)

**Tasks:**
- [ ] Add "Language Support" section
- [ ] Document `AF_LANGUAGE` env var
- [ ] Show language selection example
- [ ] Add translation contributor credits

```markdown
## Language Support

The CLI supports multiple languages:
- 🇬🇧 English (en) - Default
- 🇪🇸 Spanish (es)

Set your preferred language:
\`\`\`bash
export AF_LANGUAGE=es
af sites deploy
\`\`\`
```

---

#### 4.3 Comprehensive Testing
**Files:** Various test files

**Test Coverage:**
- [ ] Language detection tests (10 tests)
- [ ] Translation loading tests (5 tests)
- [ ] Pluralization tests (8 tests)
- [ ] Emoji fallback tests (6 tests)
- [ ] Integration tests with Spanish locale (10 tests)
- [ ] Terminal width tests (4 tests)

**Target Coverage:** Maintain 60%+ overall coverage

---

### Phase 5: Package & Release (Week 3)

#### 5.1 Build Configuration
**File:** `/package.json`

**Tasks:**
- [ ] Include `/locales/es.json` in "files" array
- [ ] Include `/locales/es.d.ts` in "files" array
- [ ] Update build scripts if needed

---

#### 5.2 CI/CD Updates
**File:** `/.github/workflows/test-runner.yml`

**Tasks:**
- [ ] Add i18n tests to CI
- [ ] Test with multiple language environments
- [ ] Validate all locale files in CI

---

## Technical Requirements

### Dependencies

**No new dependencies required** - use existing infrastructure:
- Existing translation system in `/src/utils/translation.ts`
- Commander.js for `--no-emoji` flag
- Node.js native `process.env` for language detection

### Performance

**Constraints:**
- Language detection: < 1ms
- Locale file loading: < 10ms
- No impact on CLI startup time
- Bundle size increase: < 50KB (for Spanish locale)

### Compatibility

**Requirements:**
- Node.js >=18.18.2 (existing requirement)
- Backward compatible with English-only users
- No breaking changes to existing commands
- Environment variable support for CI/CD

---

## Testing Strategy

### Unit Tests (40 tests total)

**Translation System:**
- Language detection (10 tests)
- Locale loading (5 tests)
- Placeholder replacement (5 tests)
- Pluralization (10 tests)
- Error handling (5 tests)
- Default fallbacks (5 tests)

### Integration Tests (10 tests)

**Workflows:**
- Full CLI flow in Spanish (3 tests)
- Language switching (2 tests)
- Emoji fallback mode (3 tests)
- Error messages in Spanish (2 tests)

### Manual Testing

**Checklist:**
- [ ] Deploy site with Spanish locale
- [ ] Test all commands in Spanish
- [ ] Verify emoji fallback on restricted terminals
- [ ] Test language auto-detection on macOS/Linux/Windows
- [ ] Verify CI/CD works with Spanish locale

---

## Migration & Rollout

### Phase 1: Beta Release (Week 3)

- [ ] Merge i18n branch to `develop`
- [ ] Tag as `v0.3.0-beta.1`
- [ ] Announce in Discord/community
- [ ] Gather feedback from Spanish speakers

### Phase 2: Stable Release (Week 4)

- [ ] Address beta feedback
- [ ] Update changelog
- [ ] Release as `v0.3.0`
- [ ] Announce officially
- [ ] Update documentation site

### Phase 3: Additional Languages (Future)

**Prioritized by demand:**
1. Portuguese (pt) - Brazil/Portugal
2. French (fr)
3. German (de)
4. Mandarin (zh)
5. Japanese (ja)

---

## Success Metrics

### Quantitative

- **Translation Completeness:** 100% (365/365 strings)
- **Test Coverage:** 60%+ maintained
- **Performance:** <5ms language detection overhead
- **Bundle Size:** <50KB increase
- **Test Pass Rate:** 100%

### Qualitative

- **User Feedback:** Positive reception from Spanish-speaking community
- **Adoption:** 10%+ of users use non-English locale within 3 months
- **Contributions:** 2+ community members contribute translations
- **Documentation:** Clear i18n docs enable easy language additions

---

## Risks & Mitigation

### Risk 1: Translation Quality
**Impact:** Medium
**Probability:** Medium
**Mitigation:**
- Native speaker review required
- Community review process
- Beta testing with Spanish users
- Maintain glossary of technical terms

### Risk 2: Performance Degradation
**Impact:** Low
**Probability:** Low
**Mitigation:**
- Benchmark language detection
- Lazy-load locale files
- Cache loaded translations
- Monitor bundle size in CI

### Risk 3: Breaking Changes
**Impact:** High
**Probability:** Low
**Mitigation:**
- Comprehensive testing
- Backward compatibility tests
- Beta release first
- Rollback plan ready

### Risk 4: Maintenance Burden
**Impact:** Medium
**Probability:** Medium
**Mitigation:**
- Clear contribution guidelines
- Automated translation validation
- Community translators program
- Regular translation audits

---

## Dependencies

### Blocked By:
- None (can start immediately)

### Blocks:
- Additional language implementations (pt, fr, de, etc.)
- Localized documentation
- Regional marketing efforts

---

## Resources

### Team Assignment

- **Engineering Lead:** TBD
- **Translator (Spanish):** TBD (native speaker required)
- **Reviewer:** TBD
- **QA:** Engineering team

### External Resources

- Spanish-speaking community members for review
- Translation validation tools (optional)
- Localization testing services (optional)

---

## Acceptance Criteria

### Definition of Done

- [ ] Language detection implemented and tested
- [ ] Spanish translation complete (365/365 strings)
- [ ] Emoji accessibility mode functional
- [ ] All tests pass (271+ tests)
- [ ] Documentation complete (`docs/i18n.md`, README updates)
- [ ] CI/CD updated
- [ ] Code reviewed and approved
- [ ] Beta tested with Spanish speakers
- [ ] Changelog updated
- [ ] Release notes prepared

### Demo Script

```bash
# 1. Install latest version
npm install -g @alternatefutures/cli@latest

# 2. Test language auto-detection (on Spanish system)
af --version
# Should display Spanish messages

# 3. Test manual language selection
export AF_LANGUAGE=es
af sites deploy
# Should show Spanish prompts and messages

# 4. Test emoji fallback
af --no-emoji sites list
# Should use text icons instead of emoji

# 5. Test help in Spanish
af help
# Should display help text in Spanish
```

---

## Post-Launch

### Week 1 After Launch
- [ ] Monitor error reports
- [ ] Gather user feedback
- [ ] Track language usage analytics (privacy-respecting)
- [ ] Iterate on translations based on feedback

### Month 1 After Launch
- [ ] Publish blog post about i18n support
- [ ] Reach out to international communities
- [ ] Identify next language to implement
- [ ] Update contributor guides

---

## References

- [Analysis Report: Internationalization Gaps](/SECURITY_IMPROVEMENTS.md#7-accessibility--internationalization)
- [Translation System Code](/src/utils/translation.ts)
- [Existing Locale File](/locales/en.json)
- [i18next Documentation](https://www.i18next.com/) (alternative framework reference)
- [Unicode CLDR](https://cldr.unicode.org/) (plural rules reference)

---

## Estimate Breakdown

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Infrastructure | Language detection, plural handling | 3 days |
| Spanish Localization | Translation, review, types | 5 days |
| Accessibility | Emoji mode, terminal detection | 2 days |
| Documentation | i18n guide, README updates | 2 days |
| Testing | Unit tests, integration tests, manual testing | 2 days |
| Package & Release | CI/CD, beta, stable release | 1 day |
| **Total** | | **15 days (3 weeks)** |

---

**Created:** 2025-11-12
**Last Updated:** 2025-11-12
**Status:** Ready for Planning
**Version:** 1.0
