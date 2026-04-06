import { output } from '../../cli';
import { loginGuard } from '../../guards/loginGuard';
import { authFetch } from '../../graphql/authClient';

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

    output.printNewLine();
    output.log('Credit Balance:');
    output.printNewLine();

    output.table([
      {
        Field: 'Organization',
        Value: org.name,
      },
      {
        Field: 'Available Credits',
        Value: `$${data.balanceUsd}`,
      },
      {
        Field: 'Last Updated',
        Value: data.updatedAt
          ? new Date(data.updatedAt).toLocaleString()
          : 'N/A',
      },
    ]);
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to fetch balance',
    );
    process.exit(1);
  }
};
