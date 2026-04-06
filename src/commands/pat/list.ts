import chalk from 'chalk';

import { output } from '../../cli';
import { loginGuard } from '../../guards/loginGuard';
import { authFetch } from '../../graphql/authClient';
import { t } from '../../utils/translation';

type TokenRecord = {
  id: string;
  name: string | null;
  organizationId: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

export const listPersonalAccessTokensActionHandler = async () => {
  try {
    await loginGuard();

    const res = await authFetch('/tokens');

    if (!res.ok) {
      throw new Error(`Failed to list tokens: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { tokens: TokenRecord[] };
    const tokens = data.tokens || [];

    if (tokens.length === 0) {
      output.warn(t('noYYet', { name: t('personalAccessToken') }));
      return;
    }

    const rows = tokens.map((tok) => [
      chalk.white(tok.id),
      chalk.white(tok.name ?? ''),
      chalk.gray(
        tok.createdAt ? new Date(tok.createdAt).toLocaleDateString() : '',
      ),
      chalk.gray(
        tok.lastUsedAt
          ? new Date(tok.lastUsedAt).toLocaleDateString()
          : 'Never',
      ),
    ]);

    output.styledTable(['ID', 'Name', 'Created', 'Last Used'], rows);
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to list tokens',
    );
    process.exit(1);
  }
};
