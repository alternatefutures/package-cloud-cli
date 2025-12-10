import { output } from '../../cli';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';
import { getBillingClient } from './utils/getBillingClient';

const usageAction: SdkGuardedFunction = async ({ sdk }) => {
  const billingClient = getBillingClient(sdk);
  if (!billingClient) return;

  const usage = await billingClient.getCurrentUsage();

  if (!usage) {
    output.warn('No usage data found');
    return;
  }

  output.printNewLine();
  output.log('Current Usage Metrics:');
  output.printNewLine();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const tableData = [
    {
      Resource: 'Storage',
      Quantity: formatBytes(usage.storage.quantity),
      Cost: `$${(usage.storage.amount / 100).toFixed(2)}`,
    },
    {
      Resource: 'Bandwidth',
      Quantity: formatBytes(usage.bandwidth.quantity),
      Cost: `$${(usage.bandwidth.amount / 100).toFixed(2)}`,
    },
    {
      Resource: 'Compute',
      Quantity: `${usage.compute.quantity.toFixed(2)} hours`,
      Cost: `$${(usage.compute.amount / 100).toFixed(2)}`,
    },
    {
      Resource: 'Requests',
      Quantity: usage.requests.quantity.toLocaleString(),
      Cost: `$${(usage.requests.amount / 100).toFixed(2)}`,
    },
  ];

  output.table(tableData);

  output.printNewLine();
  output.log(`Total Usage Cost: $${(usage.total / 100).toFixed(2)}`);
  output.printNewLine();
};

export const usageActionHandler = withGuards(usageAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});
