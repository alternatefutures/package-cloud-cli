import { ProjectsNotFoundError } from '@alternatefutures/errors';
import { AlternateFuturesSdk, PersonalAccessTokenService } from '@alternatefutures/sdk/node';
import { type Mock, describe, expect, it, vi } from 'vitest';

import { selectPrompt } from '../../../prompts/selectPrompt';
import { getProjectOrPrompt } from './getProjectOrPrompt';

vi.mock('../../../prompts/selectPrompt', () => ({
  selectPrompt: vi.fn().mockResolvedValue('secondProjectId'),
}));

vi.mock('@alternatefutures/sdk/node', () => {
  const AlternateFuturesSdkMock = vi.fn();

  const projects = {
    get: vi
      .fn()
      .mockResolvedValue({ id: 'firstProjectId', name: 'first project' }),
    list: vi.fn().mockResolvedValue([
      { id: 'firstProjectId', name: 'first project' },
      { id: 'secondProjectId', name: 'second project' },
    ]),
  };

  AlternateFuturesSdkMock.prototype.projects = () => projects;

  return { AlternateFuturesSdk: AlternateFuturesSdkMock, PersonalAccessTokenService: vi.fn() };
});

describe('Get project by its id or let the user choose from list', () => {
  it('Return project by its id', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });

    await expect(
      getProjectOrPrompt({ sdk: fakeSdk, id: 'firstProjectId' }),
    ).resolves.toEqual({
      id: 'firstProjectId',
      name: 'first project',
    });

    expect(fakeSdk.projects().get).toHaveBeenCalledWith({
      id: 'firstProjectId',
    });
    expect(fakeSdk.projects().list).not.toHaveBeenCalled();
    expect(selectPrompt).not.toHaveBeenCalled();
  });

  it('Throw an error because of no projects exist', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });
    (fakeSdk.projects().list as Mock).mockResolvedValueOnce([]);

    await expect(getProjectOrPrompt({ sdk: fakeSdk })).rejects.toThrowError(
      new ProjectsNotFoundError(),
    );

    expect(fakeSdk.projects().get).not.toHaveBeenCalled();
    expect(fakeSdk.projects().list).toHaveBeenCalledOnce();
    expect(selectPrompt).not.toHaveBeenCalled();
  });

  it('Let the user choose from list of existing projects and return chosen project', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });

    await expect(getProjectOrPrompt({ sdk: fakeSdk })).resolves.toEqual({
      id: 'secondProjectId',
      name: 'second project',
    });

    expect(fakeSdk.projects().get).not.toHaveBeenCalled();
    expect(fakeSdk.projects().list).toHaveBeenCalledOnce();
    expect(selectPrompt).toHaveBeenCalledOnce();
  });
});
