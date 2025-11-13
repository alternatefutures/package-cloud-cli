import {
  AlternateFuturesSdk,
  PersonalAccessTokenService,
} from '@alternatefutures/sdk/node';
import { type Mock, describe, expect, it, vi } from 'vitest';

import { output as fakeOutput } from '../../cli';
import { listEnsRecordsAction } from './list';

vi.mock('../../cli', () => {
  const output = {
    table: vi.fn(),
    cross: vi.fn().mockReturnValue('X'),
    checkmark: vi.fn().mockReturnValue('V'),
    printNewLine: vi.fn(),
  };

  return { output };
});

vi.mock('@alternatefutures/sdk/node', () => {
  const AlternateFuturesSdkMock = vi.fn();

  const ens = {
    list: vi.fn().mockResolvedValue([
      {
        id: 'firstEnsRecordId',
        name: 'first.eth',
        status: 'ACTIVE',
        createdAt: '2023-02-01T00:00:00.000Z',
      },
      {
        id: 'secondEnsRecordId',
        name: 'second.eth',
        status: 'CREATED',
        createdAt: '2023-02-02T00:00:00.000Z',
      },
    ]),
    listByIpnsRecordId: vi.fn().mockResolvedValue([
      {
        id: 'firstEnsRecordId',
        name: 'first.eth',
        status: 'ACTIVE',
        createdAt: '2023-02-01T00:00:00.000Z',
      },
      {
        id: 'secondEnsRecordId',
        name: 'second.eth',
        status: 'CREATED',
        createdAt: '2023-02-02T00:00:00.000Z',
      },
    ]),
  };

  AlternateFuturesSdkMock.prototype.ens = () => ens;

  const sites = {
    get: vi.fn().mockResolvedValue({
      id: 'testSiteId',
      ipnsRecords: [{ id: 'testIpnsRecordId' }],
    }),
  };

  AlternateFuturesSdkMock.prototype.sites = () => sites;

  return {
    AlternateFuturesSdk: AlternateFuturesSdkMock,
    PersonalAccessTokenService: vi.fn(),
  };
});

describe('List all ENS records', () => {
  it('List all ENS records assigned to selected project', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });

    await expect(
      listEnsRecordsAction({ sdk: fakeSdk, args: {} }),
    ).resolves.toBeUndefined();

    expect(fakeOutput.table).toHaveBeenCalledWith([
      {
        ENS: 'first.eth',
        Status: 'ACTIVE',
        'Created At': '2023-02-01T00:00:00.000Z',
      },
      {
        ENS: 'second.eth',
        Status: 'CREATED',
        'Created At': '2023-02-02T00:00:00.000Z',
      },
    ]);
  });

  it('List all ENS records for given siteId', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });
    (fakeSdk.ens().listByIpnsRecordId as Mock).mockResolvedValueOnce([
      {
        id: 'firstEnsId',
        name: 'first.eth',
        status: 'ACTIVE',
        createdAt: '2023-02-01T00:00:00.000Z',
      },
    ]);

    await expect(
      listEnsRecordsAction({ sdk: fakeSdk, args: { siteId: 'testSiteId' } }),
    ).resolves.toBeUndefined();

    expect(fakeSdk.sites().get as Mock).toHaveBeenNthCalledWith(1, {
      id: 'testSiteId',
    });
    expect(fakeSdk.ens().listByIpnsRecordId as Mock).toHaveBeenNthCalledWith(
      1,
      { ipnsRecordId: 'testIpnsRecordId' },
    );
    expect(fakeOutput.table).toHaveBeenCalledWith([
      {
        ENS: 'first.eth',
        Status: 'ACTIVE',
        'Created At': '2023-02-01T00:00:00.000Z',
      },
    ]);
  });
});
