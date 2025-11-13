import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock update-notifier-cjs before importing the module
vi.mock('update-notifier-cjs', () => {
  const mockNotify = vi.fn();
  const mockUpdateNotifier = vi.fn(() => ({
    update: null,
    notify: mockNotify,
  }));
  return {
    default: mockUpdateNotifier,
  };
});

vi.mock('./translation', () => ({
  t: vi.fn((key: string) => key),
}));

import updateNotifier from 'update-notifier-cjs';
// Import after mocks are set up
import { checkForPackageUpdates } from './update-notifier';

// Get references to the mocked functions
const mockUpdateNotifier = vi.mocked(updateNotifier);

describe('update-notifier', () => {
  let mockNotify: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNotify = vi.fn();
    // Reset the mock to return no update by default
    mockUpdateNotifier.mockReturnValue({
      update: null,
      notify: mockNotify,
    });
  });

  describe('checkForPackageUpdates', () => {
    it('should not notify when no update is available', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      await checkForPackageUpdates(pkg);

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('should notify when update is available', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      mockUpdateNotifier.mockReturnValue({
        update: {
          current: '0.2.0',
          latest: '0.2.1',
          name: '@alternatefutures/cli',
        },
        notify: mockNotify,
      });

      await checkForPackageUpdates(pkg);

      expect(mockNotify).toHaveBeenCalledTimes(1);
    });

    it('should include correct version information', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      mockUpdateNotifier.mockReturnValue({
        update: {
          current: '0.1.0',
          latest: '0.3.0',
          name: '@alternatefutures/cli',
        },
        notify: mockNotify,
      });

      await checkForPackageUpdates(pkg);

      expect(mockNotify).toHaveBeenCalled();
      const callArgs = mockNotify.mock.calls[0][0];
      expect(callArgs).toHaveProperty('message');
      expect(callArgs).toHaveProperty('boxenOptions');
    });

    it('should handle major version updates', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      mockUpdateNotifier.mockReturnValue({
        update: {
          current: '0.2.1',
          latest: '1.0.0',
          name: '@alternatefutures/cli',
        },
        notify: mockNotify,
      });

      await checkForPackageUpdates(pkg);

      expect(mockNotify).toHaveBeenCalledTimes(1);
    });

    it('should handle minor version updates', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      mockUpdateNotifier.mockReturnValue({
        update: {
          current: '0.2.0',
          latest: '0.3.0',
          name: '@alternatefutures/cli',
        },
        notify: mockNotify,
      });

      await checkForPackageUpdates(pkg);

      expect(mockNotify).toHaveBeenCalledTimes(1);
    });

    it('should handle patch version updates', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      mockUpdateNotifier.mockReturnValue({
        update: {
          current: '0.2.0',
          latest: '0.2.1',
          name: '@alternatefutures/cli',
        },
        notify: mockNotify,
      });

      await checkForPackageUpdates(pkg);

      expect(mockNotify).toHaveBeenCalledTimes(1);
    });

    it('should use correct boxen styling options', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      mockUpdateNotifier.mockReturnValue({
        update: {
          current: '0.2.0',
          latest: '0.2.1',
          name: '@alternatefutures/cli',
        },
        notify: mockNotify,
      });

      await checkForPackageUpdates(pkg);

      const callArgs = mockNotify.mock.calls[0][0];
      expect(callArgs.boxenOptions).toEqual({
        padding: 1,
        margin: 1,
        align: 'left',
        borderColor: 'yellow',
        borderStyle: 'round',
      });
    });

    it('should handle different package names', async () => {
      const pkg = {
        pkg: '@custom/package',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      mockUpdateNotifier.mockReturnValue({
        update: {
          current: '1.0.0',
          latest: '2.0.0',
          name: '@custom/package',
        },
        notify: mockNotify,
      });

      await checkForPackageUpdates(pkg);

      expect(mockNotify).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined update gracefully', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      mockUpdateNotifier.mockReturnValue({
        update: undefined,
        notify: mockNotify,
      });

      await checkForPackageUpdates(pkg);

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('should handle null update gracefully', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      mockUpdateNotifier.mockReturnValue({
        update: null,
        notify: mockNotify,
      });

      await checkForPackageUpdates(pkg);

      expect(mockNotify).not.toHaveBeenCalled();
    });

    it('should complete without errors on valid package', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      await expect(checkForPackageUpdates(pkg)).resolves.not.toThrow();
    });
  });

  describe('notification content', () => {
    it('should include message in notification', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      mockUpdateNotifier.mockReturnValue({
        update: {
          current: '0.2.0',
          latest: '0.2.1',
          name: '@alternatefutures/cli',
        },
        notify: mockNotify,
      });

      await checkForPackageUpdates(pkg);

      const callArgs = mockNotify.mock.calls[0][0];
      expect(callArgs.message).toBeDefined();
      expect(typeof callArgs.message).toBe('string');
    });

    it('should include boxenOptions in notification', async () => {
      const pkg = {
        pkg: '@alternatefutures/cli',
        updateCheckInternal: 1000 * 60 * 60 * 4,
      };

      mockUpdateNotifier.mockReturnValue({
        update: {
          current: '0.2.0',
          latest: '0.2.1',
          name: '@alternatefutures/cli',
        },
        notify: mockNotify,
      });

      await checkForPackageUpdates(pkg);

      const callArgs = mockNotify.mock.calls[0][0];
      expect(callArgs.boxenOptions).toBeDefined();
      expect(typeof callArgs.boxenOptions).toBe('object');
    });
  });
});
