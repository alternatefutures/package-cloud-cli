import { output } from '../../cli';
import { getPersonalAccessTokenNameOrPrompt } from '../../utils/prompts/getPersonalAccessTokenNameOrPrompt';
import { showVerificationSessionLink } from '../../utils/token/showVerificationSessionLink';
import { waitForPersonalAccessTokenFromCliSession } from '../../utils/token/waitForPersonalAccessTokenFromCliSession';
import { t } from '../../utils/translation';

type CreatePersonalAccessTokenActionHandlerArgs = {
  name?: string;
  authServiceUrl: string;
};

export const createPersonalAccessTokenActionHandler = async ({
  authServiceUrl,
  ...args
}: CreatePersonalAccessTokenActionHandlerArgs) => {
  const name = await getPersonalAccessTokenNameOrPrompt({
    name: args?.name,
  });
  output.printNewLine();

  const startResponse = await fetch(`${authServiceUrl}/auth/cli/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).catch((): null => null);

  if (!startResponse || !startResponse.ok) {
    output.error(t('patFetchTimeout'));
    return;
  }

  const startData = (await startResponse.json().catch((): null => null)) as {
    verificationSessionId: string;
    pollSecret: string;
    verificationUrl: string;
  } | null;

  if (
    !startData?.verificationSessionId ||
    !startData.pollSecret ||
    !startData.verificationUrl
  ) {
    output.error(t('patFetchTimeout'));
    return;
  }

  showVerificationSessionLink({ output, url: startData.verificationUrl });

  const personalAccessToken = await waitForPersonalAccessTokenFromCliSession({
    authServiceUrl,
    verificationSessionId: startData.verificationSessionId,
    pollSecret: startData.pollSecret,
  });

  if (!personalAccessToken) {
    output.error(t('patFetchTimeout'));

    return;
  }

  output.success(
    t('newPatIs', { pat: output.textColor(personalAccessToken, 'redBright') }),
  );
};
