import { output } from '../../cli';
import { config } from '../../config';
import { showVerificationSessionLink } from '../../utils/token/showVerificationSessionLink';
import { waitForPersonalAccessTokenFromCliSession } from '../../utils/token/waitForPersonalAccessTokenFromCliSession';
import { t } from '../../utils/translation';

type LoginActionHandlerArgs = {
  authServiceUrl: string;
};

export const loginActionHandler = async ({
  authServiceUrl,
}: LoginActionHandlerArgs) => {
  // Start a CLI login session on the auth service
  const startResponse = await fetch(`${authServiceUrl}/auth/cli/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'CLI Login' }),
  }).catch((): null => null);

  if (!startResponse || !startResponse.ok) {
    output.error(t('timeoutPATfetch'));
    output.printNewLine();
    return;
  }

  const startData = (await startResponse.json().catch((): null => null)) as
    | {
        verificationSessionId: string;
        pollSecret: string;
        verificationUrl: string;
      }
    | null;

  if (
    !startData?.verificationSessionId ||
    !startData.pollSecret ||
    !startData.verificationUrl
  ) {
    output.error(t('timeoutPATfetch'));
    output.printNewLine();
    return;
  }

  showVerificationSessionLink({ output, url: startData.verificationUrl });

  const personalAccessToken = await waitForPersonalAccessTokenFromCliSession({
    authServiceUrl,
    verificationSessionId: startData.verificationSessionId,
    pollSecret: startData.pollSecret,
  });

  if (!personalAccessToken) {
    output.error(t('timeoutPATfetch'));
    output.printNewLine();

    return;
  }

  config.personalAccessToken.set(personalAccessToken);
  config.projectId.clear();
  output.success(t('logged', { status: t('loggedInTo') }));
  output.printNewLine();
};
