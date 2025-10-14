import { AFFunctionStatusNotValidError } from '@alternatefutures/errors';
import type { AFFunctionStatus } from '@alternatefutures/sdk/node';
import { isFunctionStatusValid } from '@alternatefutures/utils-validation';

type GetFunctionStatusOrPromptArgs = {
  status?: string;
};

export const getFunctionStatusOrPrompt = async ({
  status,
}: GetFunctionStatusOrPromptArgs): Promise<AFFunctionStatus> => {
  if (status && isFunctionStatusValid({ status })) {
    return status as AFFunctionStatus;
  }

  throw new AFFunctionStatusNotValidError({});
};
