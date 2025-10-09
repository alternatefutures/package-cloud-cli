import type { EnsRecord, AlternateFuturesSdk } from '@alternatefutures/sdk/node';

import { checkPeriodicallyUntil } from '../../../utils/checkPeriodicallyUntil';

type WaitUntilEnsRecordDeletedArgs = {
  ensRecord: EnsRecord;
  sdk: AlternateFuturesSdk;
};

export const waitUntilEnsRecordDeleted = async ({
  ensRecord,
  sdk,
}: WaitUntilEnsRecordDeletedArgs): Promise<boolean> => {
  return checkPeriodicallyUntil({
    conditionFn: async () =>
      sdk
        .ens()
        .get({ id: ensRecord.id })
        .then(() => false)
        .catch(() => true),
    period: 6_000,
    tries: 10,
  });
};
