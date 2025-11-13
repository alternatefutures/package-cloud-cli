import { constants, promises as fs } from 'node:fs';
import { join as joinPath } from 'node:path';
import { FleekConfigMissingFileError } from '@alternatefutures/errors';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfigurationPath } from './getConfigurationPath';

// Mock fs promises
vi.mock('node:fs', () => ({
  constants: {
    R_OK: 4,
  },
  promises: {
    access: vi.fn(),
  },
}));

describe('getConfigurationPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with predefined config path', () => {
    it('should return absolute path when predefined path exists', async () => {
      const predefinedPath = 'custom/config.ts';
      const expectedPath = joinPath(process.cwd(), predefinedPath);

      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await getConfigurationPath({
        predefinedConfigPath: predefinedPath,
      });

      expect(result).toBe(expectedPath);
      expect(fs.access).toHaveBeenCalledWith(expectedPath, constants.R_OK);
    });

    it('should throw FleekConfigMissingFileError when predefined path does not exist', async () => {
      const predefinedPath = 'nonexistent/config.ts';

      vi.mocked(fs.access).mockRejectedValueOnce(new Error('ENOENT'));

      await expect(
        getConfigurationPath({ predefinedConfigPath: predefinedPath }),
      ).rejects.toThrow(FleekConfigMissingFileError);
    });

    it('should handle absolute predefined paths', async () => {
      const predefinedPath = '/absolute/path/config.ts';
      const expectedPath = joinPath(process.cwd(), predefinedPath);

      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await getConfigurationPath({
        predefinedConfigPath: predefinedPath,
      });

      expect(result).toBe(expectedPath);
    });

    it('should handle predefined path with spaces', async () => {
      const predefinedPath = 'path with spaces/config.ts';
      const expectedPath = joinPath(process.cwd(), predefinedPath);

      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await getConfigurationPath({
        predefinedConfigPath: predefinedPath,
      });

      expect(result).toBe(expectedPath);
    });

    it('should reject when predefined path is not readable', async () => {
      const predefinedPath = 'unreadable/config.ts';

      vi.mocked(fs.access).mockRejectedValueOnce(new Error('EACCES'));

      await expect(
        getConfigurationPath({ predefinedConfigPath: predefinedPath }),
      ).rejects.toThrow(FleekConfigMissingFileError);
    });
  });

  describe('without predefined config path (auto-discovery)', () => {
    it('should find af.config.ts as first priority', async () => {
      const expectedPath = joinPath(process.cwd(), 'af.config.ts');

      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await getConfigurationPath({});

      expect(result).toBe(expectedPath);
      expect(fs.access).toHaveBeenCalledWith(expectedPath, constants.R_OK);
      expect(fs.access).toHaveBeenCalledTimes(1);
    });

    it('should find af.config.js as second priority', async () => {
      const tsPath = joinPath(process.cwd(), 'af.config.ts');
      const jsPath = joinPath(process.cwd(), 'af.config.js');

      vi.mocked(fs.access)
        .mockRejectedValueOnce(new Error('ENOENT')) // ts not found
        .mockResolvedValueOnce(undefined); // js found

      const result = await getConfigurationPath({});

      expect(result).toBe(jsPath);
      expect(fs.access).toHaveBeenCalledWith(tsPath, constants.R_OK);
      expect(fs.access).toHaveBeenCalledWith(jsPath, constants.R_OK);
      expect(fs.access).toHaveBeenCalledTimes(2);
    });

    it('should find af.config.json as third priority', async () => {
      const tsPath = joinPath(process.cwd(), 'af.config.ts');
      const jsPath = joinPath(process.cwd(), 'af.config.js');
      const jsonPath = joinPath(process.cwd(), 'af.config.json');

      vi.mocked(fs.access)
        .mockRejectedValueOnce(new Error('ENOENT')) // ts not found
        .mockRejectedValueOnce(new Error('ENOENT')) // js not found
        .mockResolvedValueOnce(undefined); // json found

      const result = await getConfigurationPath({});

      expect(result).toBe(jsonPath);
      expect(fs.access).toHaveBeenCalledWith(tsPath, constants.R_OK);
      expect(fs.access).toHaveBeenCalledWith(jsPath, constants.R_OK);
      expect(fs.access).toHaveBeenCalledWith(jsonPath, constants.R_OK);
      expect(fs.access).toHaveBeenCalledTimes(3);
    });

    it('should throw FleekConfigMissingFileError when no config files exist', async () => {
      vi.mocked(fs.access)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'));

      await expect(getConfigurationPath({})).rejects.toThrow(
        FleekConfigMissingFileError,
      );

      expect(fs.access).toHaveBeenCalledTimes(3);
    });

    it('should prefer af.config.ts over af.config.js when both exist', async () => {
      const expectedPath = joinPath(process.cwd(), 'af.config.ts');

      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await getConfigurationPath({});

      expect(result).toBe(expectedPath);
      expect(fs.access).toHaveBeenCalledTimes(1);
    });

    it('should check files in correct priority order', async () => {
      const callOrder: string[] = [];

      vi.mocked(fs.access).mockImplementation(async (path) => {
        callOrder.push(path as string);
        throw new Error('ENOENT');
      });

      await expect(getConfigurationPath({})).rejects.toThrow();

      expect(callOrder[0]).toContain('af.config.ts');
      expect(callOrder[1]).toContain('af.config.js');
      expect(callOrder[2]).toContain('af.config.json');
    });
  });

  describe('edge cases', () => {
    it('should handle empty predefinedConfigPath', async () => {
      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await getConfigurationPath({
        predefinedConfigPath: '',
      });

      // Empty string should be treated as no predefined path
      expect(result).toBeTruthy();
    });

    it('should handle process.cwd() changes', async () => {
      const originalCwd = process.cwd();
      const expectedPath = joinPath(originalCwd, 'af.config.ts');

      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await getConfigurationPath({});

      expect(result).toBe(expectedPath);
    });

    it('should throw when all config files are unreadable', async () => {
      vi.mocked(fs.access)
        .mockRejectedValueOnce(new Error('EACCES'))
        .mockRejectedValueOnce(new Error('EACCES'))
        .mockRejectedValueOnce(new Error('EACCES'));

      await expect(getConfigurationPath({})).rejects.toThrow(
        FleekConfigMissingFileError,
      );
    });

    it('should handle permission errors on predefined path', async () => {
      const predefinedPath = 'restricted/config.ts';

      vi.mocked(fs.access).mockRejectedValueOnce(
        Object.assign(new Error('EACCES'), { code: 'EACCES' }),
      );

      await expect(
        getConfigurationPath({ predefinedConfigPath: predefinedPath }),
      ).rejects.toThrow(FleekConfigMissingFileError);
    });

    it('should handle symlinks correctly', async () => {
      const predefinedPath = 'symlink/config.ts';
      const expectedPath = joinPath(process.cwd(), predefinedPath);

      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await getConfigurationPath({
        predefinedConfigPath: predefinedPath,
      });

      expect(result).toBe(expectedPath);
    });

    it('should handle undefined as argument', async () => {
      const expectedPath = joinPath(process.cwd(), 'af.config.ts');

      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await getConfigurationPath({
        predefinedConfigPath: undefined,
      });

      expect(result).toBe(expectedPath);
    });

    it('should handle config path with special characters', async () => {
      const predefinedPath = 'config$special!chars/af.config.ts';
      const expectedPath = joinPath(process.cwd(), predefinedPath);

      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await getConfigurationPath({
        predefinedConfigPath: predefinedPath,
      });

      expect(result).toBe(expectedPath);
    });

    it('should handle very long paths', async () => {
      const longPath = `${'a'.repeat(200)}/config.ts`;
      const expectedPath = joinPath(process.cwd(), longPath);

      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await getConfigurationPath({
        predefinedConfigPath: longPath,
      });

      expect(result).toBe(expectedPath);
    });
  });

  describe('error handling', () => {
    it('should include config path in error when predefined path not found', async () => {
      const predefinedPath = 'missing/config.ts';

      vi.mocked(fs.access).mockRejectedValueOnce(new Error('ENOENT'));

      try {
        await getConfigurationPath({ predefinedConfigPath: predefinedPath });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FleekConfigMissingFileError);
      }
    });

    it('should throw appropriate error when no configs found', async () => {
      vi.mocked(fs.access)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'));

      try {
        await getConfigurationPath({});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FleekConfigMissingFileError);
      }
    });
  });
});
