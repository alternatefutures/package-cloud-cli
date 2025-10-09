import { FleekFunctionStatusNotValidError } from '@alternatefutures/errors';
import type { FleekFunctionStatus } from '@alternatefutures/sdk/node';
import { isFunctionStatusValid } from '@alternatefutures/utils-validation';

type GetFunctionStatusOrPromptArgs = {
  status?: string;
};

export const getFunctionStatusOrPrompt = async ({
  status,
}: GetFunctionStatusOrPromptArgs): Promise<FleekFunctionStatus> => {
  if (status && isFunctionStatusValid({ status })) {
    return status as FleekFunctionStatus;
  }

  throw new FleekFunctionStatusNotValidError({});
};
