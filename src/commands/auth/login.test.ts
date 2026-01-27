import { describe, expect, it, vi } from 'vitest';

import { output } from '../../cli';
import { config } from '../../config';
import { loginActionHandler } from './login';

vi.mock('../../cli', () => {
  const output = {
    chore: vi.fn(),
    log: vi.fn(),
    link: vi.fn(),
    success: vi.fn(),
    spinner: vi.fn(),
    error: vi.fn(),
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

vi.mock('../../utils/token/waitForPersonalAccessTokenFromCliSession', () => ({
  waitForPersonalAccessTokenFromCliSession: vi
    .fn()
    .mockResolvedValue('mockPat'),
}));

describe('Login', () => {
  it('should update config correctly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          verificationSessionId: 'sess',
          pollSecret: 'secret',
          verificationUrl: 'https://app.alternatefutures.ai/login/sess',
        }),
      }),
    );

    await loginActionHandler({
      authServiceUrl: 'https://auth.service',
    });

    expect(output.success).toHaveBeenCalled();
    expect(config.personalAccessToken.set).toHaveBeenCalledWith('mockPat');
    expect(config.projectId.clear).toHaveBeenCalled();
  });
});
