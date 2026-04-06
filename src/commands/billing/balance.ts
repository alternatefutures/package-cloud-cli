import chalk from 'chalk';

import { output } from '../../cli';
import { authFetch } from '../../graphql/authClient';
import { loginGuard } from '../../guards/loginGuard';

type OrgRecord = { id: string; name: string; slug: string; role: string };

type BalanceResponse = {
  orgId: string;
  orgBillingId: string;
  balanceCents: number;
  balanceUsd: string;
  updatedAt: string;
};

export const balanceActionHandler = async () => {
  try {
    await loginGuard();

    const orgsRes = await authFetch('/organizations');
    if (!orgsRes.ok) {
      throw new Error(
        `Failed to fetch organizations: ${orgsRes.status} ${orgsRes.statusText}`,
      );
    }

    const { organizations } = (await orgsRes.json()) as {
      organizations: OrgRecord[];
    };

    if (!organizations?.length) {
      output.error('No organization found. Create a project first.');
      process.exit(1);
    }

    const org = organizations[0];

    const balRes = await authFetch(`/billing/credits/org/${org.id}/balance`);
    if (!balRes.ok) {
      throw new Error(
        `Failed to fetch balance: ${balRes.status} ${balRes.statusText}`,
      );
    }

    const data = (await balRes.json()) as BalanceResponse;

    output.styledTable(
      ['Organization', 'Available Credits', 'Last Updated'],
      [
        [
          chalk.white(org.name),
          chalk.green(`$${data.balanceUsd}`),
          data.updatedAt
            ? chalk.gray(new Date(data.updatedAt).toLocaleString())
            : chalk.dim('N/A'),
        ],
      ],
    );
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to fetch balance',
    );
    process.exit(1);
  }
};
