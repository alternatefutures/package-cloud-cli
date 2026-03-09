import { output } from '../../cli';
import { getPersonalAccessTokenNameOrPrompt } from '../../utils/prompts/getPersonalAccessTokenNameOrPrompt';
import { showVerificationSessionLink } from '../../utils/token/showVerificationSessionLink';
import { t } from '../../utils/translation';
import { checkPeriodicallyUntil } from '../../utils/checkPeriodicallyUntil';

type CreatePersonalAccessTokenActionHandlerArgs = {
  name?: string;
  uiAppUrl: string;
  authApiUrl: string;
};

export const createPersonalAccessTokenActionHandler = async ({
  uiAppUrl,
  authApiUrl,
  ...args
}: CreatePersonalAccessTokenActionHandlerArgs) => {
  const name = await getPersonalAccessTokenNameOrPrompt({
    name: args?.name,
  });

  const startRes = await fetch(`${authApiUrl}/auth/cli/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!startRes.ok) {
    output.error(t('unexpectedError'));
    return;
  }

  const { verificationSessionId, pollSecret } = (await startRes.json()) as {
    verificationSessionId: string;
    pollSecret: string;
  };

  output.printNewLine();
  showVerificationSessionLink({ output, uiAppUrl, verificationSessionId });

  const personalAccessToken = await checkPeriodicallyUntil({
    conditionFn: async () => {
      try {
        const res = await fetch(`${authApiUrl}/auth/cli/poll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verificationSessionId, pollSecret }),
        });
        if (res.status === 202) return null;
        const data = (await res.json()) as { token?: string };
        return data.token ?? null;
      } catch {
        return null;
      }
    },
    period: 2_000,
    tries: 300,
  });

  if (!personalAccessToken) {
    output.error(t('patFetchTimeout'));
    return;
  }

  output.success(
    t('newPatIs', { pat: output.textColor(personalAccessToken, 'redBright') }),
  );
};
