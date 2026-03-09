import { MissingExpectedDataError } from '@alternatefutures/errors';

import { output } from '../cli';
import { loginActionHandler } from '../commands/auth/login';
import { config } from '../config';
import { getDefined } from '../defined';
import { t } from '../utils/translation';

export const loginGuard = async () => {
  const uiAppUrl = getDefined('UI__APP_URL');
  const authApiUrl =
    getDefined('AUTH__API_URL') || getDefined('SDK__AUTH_SERVICE_URL');

  if (!uiAppUrl || !authApiUrl) {
    throw new MissingExpectedDataError();
  }

  const accessToken = config.personalAccessToken.get();

  if (accessToken) {
    return;
  }

  output.warn(t('authReqStartLogginFlow'));
  output.printNewLine();

  await loginActionHandler({
    uiAppUrl,
    authApiUrl,
  });
};
