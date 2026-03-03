import { output } from '../../cli';
import { config } from '../../config';
import { loginGuard } from '../../guards/loginGuard';

const AUTH_API_URL =
  process.env.AF_AUTH_API_URL || 'https://auth.alternatefutures.ai';

export const balanceActionHandler = async () => {
  try {
    await loginGuard();

    const token = config.personalAccessToken.get();
    if (!token) {
      output.error('Not authenticated. Run `af login` first.');
      process.exit(1);
    }

    const res = await fetch(`${AUTH_API_URL}/api/billing/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch balance: ${res.status} ${res.statusText}`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    output.printNewLine();
    output.log('Credit Balance:');
    output.printNewLine();

    const tableData = [
      {
        Field: 'Available Credits',
        Value: `$${((data.balance ?? data.credits ?? 0) / 100).toFixed(2)}`,
      },
    ];

    if (data.pendingCharges !== undefined) {
      tableData.push({
        Field: 'Pending Charges',
        Value: `$${(data.pendingCharges / 100).toFixed(2)}`,
      });
    }

    if (data.effectiveBalance !== undefined) {
      tableData.push({
        Field: 'Effective Balance',
        Value: `$${(data.effectiveBalance / 100).toFixed(2)}`,
      });
    }

    output.table(tableData);
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to fetch balance',
    );
    process.exit(1);
  }
};
