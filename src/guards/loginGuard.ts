import { MissingExpectedDataError } from '@alternatefutures/errors';

import { output } from '../cli';
import { loginActionHandler } from '../commands/auth/login';
import { config } from '../config';
import { getDefined } from '../defined';
import { t } from '../utils/translation';

export const loginGuard = async () => {
  const authServiceUrl =
    getDefined('SDK__AUTH_SERVICE_URL') || getDefined('AUTH__API_URL');

  if (!authServiceUrl) {
    throw new MissingExpectedDataError();
  }

  const accessToken = config.personalAccessToken.get();

  if (accessToken) {
    return;
  }

  output.warn(t('authReqStartLogginFlow'));
  output.printNewLine();

  await loginActionHandler({
    authServiceUrl,
  });
};
