import { SitesNotFoundError } from '@alternatefutures/errors';
import {
  AlternateFuturesSdk,
  PersonalAccessTokenService,
} from '@alternatefutures/sdk/node';
import { type Mock, describe, expect, it, vi } from 'vitest';

import { selectPrompt } from '../../../prompts/selectPrompt';
import { getSiteOrPrompt } from './getSiteOrPrompt';

vi.mock('../../../prompts/selectPrompt', () => ({
  selectPrompt: vi.fn().mockResolvedValue('secondSiteId'),
}));

vi.mock('@alternatefutures/sdk/node', () => {
  const AlternateFuturesSdkMock = vi.fn();

  const sites = {
    get: vi
      .fn()
      .mockResolvedValue({ id: 'firstSiteId', slug: 'first-first-first' }),
    getBySlug: vi
      .fn()
      .mockResolvedValue({ id: 'secondSiteId', slug: 'second-second-second' }),
    list: vi.fn().mockResolvedValue([
      { id: 'firstSiteId', slug: 'first-first-first' },
      { id: 'secondSiteId', slug: 'second-second-second' },
    ]),
  };

  AlternateFuturesSdkMock.prototype.sites = () => sites;

  return {
    AlternateFuturesSdk: AlternateFuturesSdkMock,
    PersonalAccessTokenService: vi.fn(),
  };
});

describe('Get site by id, slug or let the user choose from list', () => {
  it('Return site by its id', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });

    await expect(
      getSiteOrPrompt({ sdk: fakeSdk, id: 'firstSiteId' }),
    ).resolves.toEqual({ id: 'firstSiteId', slug: 'first-first-first' });

    expect(fakeSdk.sites().get).toHaveBeenCalledWith({ id: 'firstSiteId' });
  });

  it('Return site by its slug', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });

    await expect(
      getSiteOrPrompt({ sdk: fakeSdk, slug: 'second-second-second' }),
    ).resolves.toEqual({
      id: 'secondSiteId',
      slug: 'second-second-second',
    });

    expect(fakeSdk.sites().getBySlug).toHaveBeenCalledWith({
      slug: 'second-second-second',
    });
  });

  it('Let the user choose from list and return chosen site', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });

    await expect(getSiteOrPrompt({ sdk: fakeSdk })).resolves.toEqual({
      id: 'secondSiteId',
      slug: 'second-second-second',
    });

    expect(fakeSdk.sites().list).toHaveBeenCalledOnce();
    expect(selectPrompt).toHaveBeenCalledOnce();
  });

  it('should throw if no sites exist', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });
    (fakeSdk.sites().list as Mock).mockResolvedValue([]);
    await expect(getSiteOrPrompt({ sdk: fakeSdk })).rejects.toThrowError(
      new SitesNotFoundError(),
    );

    expect(fakeSdk.sites().list).toHaveBeenCalledOnce();
    expect(selectPrompt).not.toHaveBeenCalled();
  });
});
