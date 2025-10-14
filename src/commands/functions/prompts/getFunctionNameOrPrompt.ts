import { AFFunctionNameNotValidError } from '@alternatefutures/errors';
import { isFunctionNameValid } from '@alternatefutures/utils-validation';

import { enterFunctionNamePrompt } from './enterFunctionNamePrompt';

type GetFunctionNameOrPromptArgs = {
  name?: string;
};

export const getFunctionNameOrPrompt = async ({
  name,
}: GetFunctionNameOrPromptArgs): Promise<string> => {
  if (name && isFunctionNameValid({ name })) {
    return name;
  }

  if (name && !isFunctionNameValid({ name })) {
    throw new AFFunctionNameNotValidError({ name });
  }

  return enterFunctionNamePrompt();
};
