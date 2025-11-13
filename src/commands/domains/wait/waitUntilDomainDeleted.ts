import type { AlternateFuturesSdk, Domain } from '@alternatefutures/sdk/node';

import { checkPeriodicallyUntil } from '../../../utils/checkPeriodicallyUntil';

type WaitUntilDomainDeletedArgs = {
  domain: Domain;
  sdk: AlternateFuturesSdk;
};

export const waitUntilDomainDeleted = async ({
  domain,
  sdk,
}: WaitUntilDomainDeletedArgs): Promise<boolean> => {
  return checkPeriodicallyUntil({
    conditionFn: async () =>
      sdk
        .domains()
        .get({ domainId: domain.id })
        .then(() => false)
        .catch(() => true),
    period: 6_000,
    tries: 10,
  });
};
