import { beforeEach, describe, expect, it, vi } from 'vitest';

import { output } from '../../cli';
import { config } from '../../config';
import { loginActionHandler } from './login';

vi.mock('../../cli', () => {
  const output = {
    chore: vi.fn(),
    log: vi.fn(),
    link: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    spinner: vi.fn(),
    printNewLine: vi.fn(),
  };

  return { output };
});

vi.mock('../../config', () => ({
  config: {
    personalAccessToken: {
      set: vi.fn(),
      clear: vi.fn(),
    },
    projectId: {
      clear: vi.fn(),
    },
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Login', () => {
  it('should log the messages correctly on successful login', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          verificationSessionId: 'mock-session-id',
          pollSecret: 'mock-poll-secret',
          verificationUrl: 'https://app.example.com/verify/mock-session-id',
          expiresIn: 600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, token: 'mock-pat-token' }),
      });

    await loginActionHandler({
      uiAppUrl: 'https://app.example.com',
      authApiUrl: 'https://auth.example.com',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://auth.example.com/auth/cli/start',
      expect.objectContaining({ method: 'POST' }),
    );

    expect(output.success).toHaveBeenCalledWith(
      expect.stringContaining('logged in'),
    );
  });

  it('should update config correctly on successful login', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          verificationSessionId: 'mock-session-id',
          pollSecret: 'mock-poll-secret',
          verificationUrl: 'https://app.example.com/verify/mock-session-id',
          expiresIn: 600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, token: 'mock-pat-token' }),
      });

    await loginActionHandler({
      uiAppUrl: 'https://app.example.com',
      authApiUrl: 'https://auth.example.com',
    });

    expect(config.personalAccessToken.set).toHaveBeenCalledWith(
      'mock-pat-token',
    );
    expect(config.projectId.clear).toHaveBeenCalled();
  });

  it('should handle start endpoint failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await loginActionHandler({
      uiAppUrl: 'https://app.example.com',
      authApiUrl: 'https://auth.example.com',
    });

    expect(output.error).toHaveBeenCalled();
    expect(config.personalAccessToken.set).not.toHaveBeenCalled();
  });
});
