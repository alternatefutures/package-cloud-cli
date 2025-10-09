import { EnsRecordNotFoundError } from '@alternatefutures/errors';
import type { EnsRecord, AlternateFuturesSdk } from '@alternatefutures/sdk/node';

import { selectPrompt } from '../../../prompts/selectPrompt';
import { t } from '../../../utils/translation';

type GetEnsRecordOrPromptArgs = {
  id?: string;
  name?: string;
  sdk: AlternateFuturesSdk;
  choicesFilter?: (ens: EnsRecord) => boolean;
};

export const getEnsRecordOrPrompt = async ({
  id,
  name,
  sdk,
  choicesFilter,
}: GetEnsRecordOrPromptArgs) => {
  if (id) {
    return await sdk.ens().get({ id });
  }

  if (name) {
    return await sdk.ens().getByName({ name });
  }

  const allEnsRecords = await sdk.ens().list();

  const ensRecords = choicesFilter
    ? allEnsRecords.filter(choicesFilter)
    : allEnsRecords;

  if (ensRecords.length === 0) {
    throw new EnsRecordNotFoundError({ ensRecord: {} });
  }

  const selectedEnsRecordId = await selectPrompt({
    message: `${t('commonSelectXFromList', { subject: t('ensRecord') })}`,
    choices: ensRecords.map((ens) => ({ title: ens.name, value: ens.id })),
  });

  const record = ensRecords.find((ens) => ens.id === selectedEnsRecordId);

  return record;
};
