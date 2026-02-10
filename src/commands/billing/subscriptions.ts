import { output } from '../../cli';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';
import { getBillingClient } from './utils/getBillingClient';

const subscriptionsAction: SdkGuardedFunction = async ({ sdk }) => {
  const billingClient = getBillingClient(sdk);
  if (!billingClient) return;

  const subscriptions = await billingClient.listSubscriptions();

  if (!subscriptions || subscriptions.length === 0) {
    output.warn('No subscriptions found');
    output.log('Create a subscription with: af billing subscribe');
    return;
  }

  output.printNewLine();
  output.log('Subscriptions:');
  output.printNewLine();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableData = subscriptions.map((sub: any) => ({
    Plan: sub.plan,
    Billing: sub.billingInterval || 'MONTHLY',
    Status: sub.status,
    Seats: sub.seats,
    'Price/Seat': `$${(sub.basePricePerSeat / 100).toFixed(2)}/mo`,
    'Usage Markup': `${(sub.usageMarkup * 100).toFixed(0)}%`,
    'Current Period': `${new Date(sub.currentPeriodStart * 1000).toLocaleDateString()} - ${new Date(sub.currentPeriodEnd * 1000).toLocaleDateString()}`,
    'Cancel At': sub.cancelAt
      ? new Date(sub.cancelAt * 1000).toLocaleDateString()
      : 'N/A',
  }));

  output.table(tableData);
};

export const subscriptionsActionHandler = withGuards(subscriptionsAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});
