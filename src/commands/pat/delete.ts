import { output } from '../../cli';
import { authFetch } from '../../graphql/authClient';
import { loginGuard } from '../../guards/loginGuard';

type DeletePersonalAccessTokenArgs = {
  personalAccessTokenId: string;
};

export const deletePersonalAccessTokenActionHandler = async ({
  personalAccessTokenId,
}: DeletePersonalAccessTokenArgs) => {
  try {
    await loginGuard();

    const res = await authFetch(`/tokens/${personalAccessTokenId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        body.error || `Failed to delete token: ${res.status} ${res.statusText}`,
      );
    }

    output.success(`Token ${personalAccessTokenId} deleted.`);
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to delete token',
    );
    process.exit(1);
  }
};
