import { AFFunctionsNotFoundError } from '@alternatefutures/errors';
import type {
  AFFunction,
  AlternateFuturesSdk,
} from '@alternatefutures/sdk/node';

import { selectPrompt } from '../../../prompts/selectPrompt';
import { t } from '../../../utils/translation';

type GetFunctionOrPromptArgs = {
  name?: string;
  sdk: AlternateFuturesSdk;
};

export const getFunctionOrPrompt = async ({
  name,
  sdk,
}: GetFunctionOrPromptArgs): Promise<AFFunction | undefined> => {
  if (name) {
    return sdk.functions().get({ name });
  }

  const functions = await sdk.functions().list();

  if (!functions.length) {
    throw new AFFunctionsNotFoundError({});
  }

  const selectedFunctionId = await selectPrompt({
    message: t('commonSelectXFromList', { subject: t('function') }),
    choices: functions.map((f) => ({ title: f.name, value: f.id })),
  });

  const fnMatch = functions.find((f) => f.id === selectedFunctionId);

  if (!fnMatch) return;

  return fnMatch;
};
