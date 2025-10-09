import { FleekFunctionSlugNotValidError } from '@alternatefutures/errors';
import { isFunctionSlugValid } from '@alternatefutures/utils-validation';

type GetFunctionSlugOrPromptArgs = {
  slug?: string;
};

export const getFunctionSlugOrPrompt = async ({
  slug,
}: GetFunctionSlugOrPromptArgs): Promise<string | undefined> => {
  if (slug && isFunctionSlugValid({ slug })) {
    return slug;
  }

  if (!slug) return;

  throw new FleekFunctionSlugNotValidError({ slug });
};
