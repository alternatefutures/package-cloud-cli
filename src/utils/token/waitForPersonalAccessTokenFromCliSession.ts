import { checkPeriodicallyUntil } from '../checkPeriodicallyUntil';

type WaitForPersonalAccessTokenFromCliSessionArgs = {
  authServiceUrl: string;
  verificationSessionId: string;
  pollSecret: string;
};

export const waitForPersonalAccessTokenFromCliSession = async ({
  authServiceUrl,
  verificationSessionId,
  pollSecret,
}: WaitForPersonalAccessTokenFromCliSessionArgs): Promise<string | null> =>
  checkPeriodicallyUntil({
    conditionFn: async () => {
      const response = await fetch(`${authServiceUrl}/auth/cli/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationSessionId, pollSecret }),
      }).catch(() => null);

      if (!response) return null;

      // 202 means "pending"
      if (response.status === 202) return null;

      if (!response.ok) return null;

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        token?: string;
      } | null;

      return data?.token ?? null;
    },
    period: 2_000,
    tries: 500,
  });
