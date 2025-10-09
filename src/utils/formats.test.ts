import { describe, expect, it } from 'vitest';

import { AlternateFuturesSiteConfigFormats } from './configuration';
import { isValidAlternateFuturesConfigFormat } from './formats';

describe('In the Formats utils', () => {
  describe('isValidAlternateFuturesConfigFormat', () => {
    it('should be true for JSON', () => {
      expect(isValidAlternateFuturesConfigFormat(AlternateFuturesSiteConfigFormats.JSON)).toBe(true);
    });
    it('should be true for Typescript', () => {
      expect(isValidAlternateFuturesConfigFormat(AlternateFuturesSiteConfigFormats.Typescript)).toBe(
        true,
      );
    });
    it('should be true for Javascript', () => {
      expect(isValidAlternateFuturesConfigFormat(AlternateFuturesSiteConfigFormats.Javascript)).toBe(
        true,
      );
    });
    it('should be false for unknown formats', () => {
      expect(
        isValidAlternateFuturesConfigFormat('foobar' as unknown as AlternateFuturesSiteConfigFormats),
      ).toBe(false);
    });
  });
});
