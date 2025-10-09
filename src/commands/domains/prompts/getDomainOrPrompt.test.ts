import { DomainsNotFoundError } from '@alternatefutures/errors';
import {
  type Domain,
  AlternateFuturesSdk,
  PersonalAccessTokenService,
} from '@alternatefutures/sdk/node';
import { type Mock, describe, expect, it, vi } from 'vitest';

import { selectPrompt } from '../../../prompts/selectPrompt';
import { getDomainOrPrompt } from './getDomainOrPrompt';

vi.mock('../../../prompts/selectPrompt', () => ({
  selectPrompt: vi.fn().mockResolvedValue('secondDomainId'),
}));

vi.mock('@alternatefutures/sdk/node', () => {
  const AlternateFuturesSdkMock = vi.fn();

  const domains = {
    get: vi
      .fn()
      .mockResolvedValue({ id: 'firstDomainId', hostname: 'first.xyz' }),
    getByHostname: vi.fn().mockResolvedValue({
      id: 'secondDomainId',
      hostname: 'second.xyz',
      isVerified: false,
    }),
    list: vi.fn().mockResolvedValue([
      { id: 'firstDomainId', hostname: 'first.xyz', isVerified: false },
      { id: 'secondDomainId', hostname: 'second.xyz', isVerified: false },
      { id: 'thirdDomainId', hostname: 'third.xyz', isVerified: true },
    ] as Domain[]),
  };

  AlternateFuturesSdkMock.prototype.domains = () => domains;

  return { AlternateFuturesSdk: AlternateFuturesSdkMock, PersonalAccessTokenService: vi.fn() };
});

describe('Get domain by id, hostname or let the user choose from list', () => {
  it('Return domain by its id', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });

    await expect(
      getDomainOrPrompt({ sdk: fakeSdk, id: 'firstDomainId' }),
    ).resolves.toEqual({ id: 'firstDomainId', hostname: 'first.xyz' });

    expect(fakeSdk.domains().get).toHaveBeenCalledWith({
      domainId: 'firstDomainId',
    });
  });

  it('Return domain by its hostname', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });

    await expect(
      getDomainOrPrompt({ sdk: fakeSdk, hostname: 'second.xyz' }),
    ).resolves.toEqual({
      id: 'secondDomainId',
      hostname: 'second.xyz',
      isVerified: false,
    });

    expect(fakeSdk.domains().getByHostname).toHaveBeenCalledWith({
      hostname: 'second.xyz',
    });
  });

  it('Let the user choose from unverified domains and return chosen domain', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });

    await expect(
      getDomainOrPrompt({
        sdk: fakeSdk,
        choicesFilter: (domain) => !domain.isVerified,
      }),
    ).resolves.toEqual({
      id: 'secondDomainId',
      hostname: 'second.xyz',
      isVerified: false,
    });

    expect(fakeSdk.domains().list).toHaveBeenCalledOnce();
    expect(selectPrompt).toHaveBeenCalledWith({
      choices: [
        { value: 'firstDomainId', title: 'first.xyz' },
        { value: 'secondDomainId', title: 'second.xyz' },
      ],
      message: 'Select a domain:',
    });
  });

  it('should throw if no domains are present', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });
    (fakeSdk.domains().list as Mock).mockResolvedValue([]);
    await expect(getDomainOrPrompt({ sdk: fakeSdk })).rejects.toThrowError(
      new DomainsNotFoundError(),
    );

    expect(fakeSdk.domains().list).toHaveBeenCalledOnce();
    expect(selectPrompt).not.toHaveBeenCalled();
  });
});
