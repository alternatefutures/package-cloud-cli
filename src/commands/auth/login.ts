import { output } from '../../cli';
import { config } from '../../config';
import { showVerificationSessionLink } from '../../utils/token/showVerificationSessionLink';
import { t } from '../../utils/translation';

type LoginActionHandlerArgs = {
  uiAppUrl: string;
  authApiUrl: string;
};

type StartResponse = {
  success: boolean;
  verificationSessionId: string;
  pollSecret: string;
  verificationUrl: string;
  expiresIn: number;
};

type PollResponse =
  | { status: 'pending' }
  | { success: true; token: string }
  | { error: string };

export const loginActionHandler = async ({
  uiAppUrl,
  authApiUrl,
}: LoginActionHandlerArgs) => {
  const startRes = await fetch(`${authApiUrl}/auth/cli/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'CLI Login' }),
  });

  if (!startRes.ok) {
    output.error(t('unexpectedError'));
    output.printNewLine();
    return;
  }

  const { verificationSessionId, pollSecret } =
    (await startRes.json()) as StartResponse;

  showVerificationSessionLink({ output, uiAppUrl, verificationSessionId });

  const personalAccessToken = await pollForToken({
    authApiUrl,
    verificationSessionId,
    pollSecret,
  });

  if (!personalAccessToken) {
    output.error(t('timeoutPATfetch'));
    output.printNewLine();
    return;
  }

  config.personalAccessToken.set(personalAccessToken);
  config.projectId.clear();

  // Fetch user's org so all subsequent requests include X-Organization-Id
  try {
    const meRes = await fetch(`${authApiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${personalAccessToken}` },
    });
    if (meRes.ok) {
      const me = (await meRes.json()) as { organizations?: { id: string }[] };
      const orgId = me.organizations?.[0]?.id;
      if (orgId) {
        config.organizationId.set(orgId);
      }
    }
  } catch {
    // Non-fatal — org will still be resolved from PAT on the server
  }

  output.success(t('logged', { status: t('loggedInTo') }));
  output.printNewLine();
};

async function pollForToken({
  authApiUrl,
  verificationSessionId,
  pollSecret,
  tries = 300,
  interval = 2_000,
}: {
  authApiUrl: string;
  verificationSessionId: string;
  pollSecret: string;
  tries?: number;
  interval?: number;
}): Promise<string | null> {
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, interval));

    try {
      const res = await fetch(`${authApiUrl}/auth/cli/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationSessionId, pollSecret }),
      });

      if (res.status === 202) continue; // pending

      const data = (await res.json()) as PollResponse;
      if ('token' in data && data.token) return data.token;
      if ('error' in data) return null;
    } catch {
      // network error, retry
    }
  }

  return null;
}
