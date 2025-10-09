import { AlternateFuturesSdk, PersonalAccessTokenService } from '@alternatefutures/sdk/node';
import { type Mock, describe, expect, it, vi } from 'vitest';

import { output } from '../../cli';
import { t } from '../../utils/translation';
import { listStorageAction } from './list';

vi.mock('../../cli', () => {
  const output = {
    log: vi.fn(),
    warn: vi.fn(),
    table: vi.fn(),
  };

  return { output };
});

vi.mock('@alternatefutures/sdk/node', () => {
  const AlternateFuturesSdkMock = vi.fn();

  const storage = {
    list: vi.fn().mockResolvedValue([
      {
        filename: 'index.html',
        cid: 'bafybeifylyzjlrpec75l66kggycx65yuouyavweaaqxmf22jvbtnmmaqru',
        filecoinDealIds: '58027558',
        arweaveId: '',
      },
      {
        filename: 'basic.car',
        cid: 'bafkreieasoapp3osmpdt2lwdqy6oqx75nhdsxgkoswyjuwy2675eyhvcg4',
        filecoinDealIds: '61342544',
        arweaveId: '',
      },
    ]),
  };

  const privateGateways = {
    list: vi.fn().mockResolvedValue([]),
  };

  const domains = {
    listByZoneId: vi.fn((options: { zoneId: string }) => {
      const data = [
        {
          hostname: 'cli-test.alternatefutures.ai',
          zoneId: 'clsba7n4z000008lb0loefpnn',
          status: 'ACTIVE',
        },
        {
          hostname: 'cli-test-no-status.alternatefutures.ai',
          zoneId: 'clsba7n4z000008lb0loefpnn',
        },
        {
          hostname: 'cli-test-storage.alternatefutures.ai',
          zoneId: 'clsba858j000108lb2euyfk6u',
          status: 'ACTIVE',
        },
        {
          hostname: 'cli-test-inactive.alternatefutures.ai',
          zoneId: 'clsba858j000108lb2euyfk6u',
          status: 'INACTIVE',
        },
      ];

      const found = data.find((item) => item.zoneId === options.zoneId);

      return Promise.resolve(found ? [found] : undefined);
    }),
  };

  AlternateFuturesSdkMock.prototype.storage = () => storage;
  AlternateFuturesSdkMock.prototype.privateGateways = () => privateGateways;
  AlternateFuturesSdkMock.prototype.domains = () => domains;

  return { AlternateFuturesSdk: AlternateFuturesSdkMock, PersonalAccessTokenService: vi.fn() };
});

describe('List storage files/folder for the selected project', () => {
  it('should show storage list with public gateway', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });

    await expect(
      listStorageAction({ sdk: fakeSdk, args: {} }),
    ).resolves.toBeUndefined();

    expect(fakeSdk.storage().list).toHaveBeenCalledWith();
    expect(output.log).not.toHaveBeenCalled();
    expect(output.table).toHaveBeenCalledWith([
      {
        filename: 'index.html',
        cid: 'bafybeifylyzjlrpec75l66kggycx65yuouyavweaaqxmf22jvbtnmmaqru',
        'filecoin id': '58027558',
        'arweave id': '',
        link: 'https://bafybeifylyzjlrpec75l66kggycx65yuouyavweaaqxmf22jvbtnmmaqru.ipfs.flk-ipfs.xyz',
      },
      {
        filename: 'basic.car',
        cid: 'bafkreieasoapp3osmpdt2lwdqy6oqx75nhdsxgkoswyjuwy2675eyhvcg4',
        'filecoin id': '61342544',
        'arweave id': '',
        link: 'https://bafkreieasoapp3osmpdt2lwdqy6oqx75nhdsxgkoswyjuwy2675eyhvcg4.ipfs.flk-ipfs.xyz',
      },
    ]);
  });

  it('should show storage list with private gateway', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });
    (fakeSdk.privateGateways().list as Mock).mockResolvedValueOnce([
      { zone: { id: 'clsba7n4z000008lb0loefpnn' } },
      { zone: { id: 'clsba858j000108lb2euyfk6u' } },
    ]);

    await expect(
      listStorageAction({ sdk: fakeSdk, args: {} }),
    ).resolves.toBeUndefined();

    expect(fakeSdk.storage().list).toHaveBeenCalledWith();
    expect(output.log).not.toHaveBeenCalled();
    expect(output.table).toHaveBeenCalledWith([
      {
        filename: 'index.html',
        cid: 'bafybeifylyzjlrpec75l66kggycx65yuouyavweaaqxmf22jvbtnmmaqru',
        'filecoin id': '58027558',
        'arweave id': '',
        link: 'https://cli-test.alternatefutures.ai/ipfs/bafybeifylyzjlrpec75l66kggycx65yuouyavweaaqxmf22jvbtnmmaqru',
      },
      {
        filename: 'index.html',
        cid: 'bafybeifylyzjlrpec75l66kggycx65yuouyavweaaqxmf22jvbtnmmaqru',
        'filecoin id': '58027558',
        'arweave id': '',
        link: 'https://cli-test-storage.alternatefutures.ai/ipfs/bafybeifylyzjlrpec75l66kggycx65yuouyavweaaqxmf22jvbtnmmaqru',
      },
      {
        filename: 'basic.car',
        cid: 'bafkreieasoapp3osmpdt2lwdqy6oqx75nhdsxgkoswyjuwy2675eyhvcg4',
        'filecoin id': '61342544',
        'arweave id': '',
        link: 'https://cli-test.alternatefutures.ai/ipfs/bafkreieasoapp3osmpdt2lwdqy6oqx75nhdsxgkoswyjuwy2675eyhvcg4',
      },
      {
        filename: 'basic.car',
        cid: 'bafkreieasoapp3osmpdt2lwdqy6oqx75nhdsxgkoswyjuwy2675eyhvcg4',
        'filecoin id': '61342544',
        'arweave id': '',
        link: 'https://cli-test-storage.alternatefutures.ai/ipfs/bafkreieasoapp3osmpdt2lwdqy6oqx75nhdsxgkoswyjuwy2675eyhvcg4',
      },
    ]);
  });

  it('should show message that no storage exist', async () => {
    const accessTokenService = new PersonalAccessTokenService({
      personalAccessToken: '',
    });
    const fakeSdk = new AlternateFuturesSdk({ accessTokenService });
    (fakeSdk.storage().list as Mock).mockResolvedValueOnce([]);

    await expect(
      listStorageAction({ sdk: fakeSdk, args: {} }),
    ).resolves.toBeUndefined();

    expect(fakeSdk.storage().list).toHaveBeenCalledWith();
    expect(fakeSdk.privateGateways().list).not.toHaveBeenCalled();
    expect(output.warn).toHaveBeenCalledWith(t('storageListNotFound'));
    expect(output.log).toHaveBeenCalledWith(t('storageAddSuggestion'));
    expect(output.log).toHaveBeenCalledWith('af storage add <file_path>');
    expect(output.table).not.toHaveBeenCalled();
  });
});
