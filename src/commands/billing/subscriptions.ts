import { output } from '../../cli';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';

const subscriptionsAction: SdkGuardedFunction = async ({ sdk }) => {
  const subscriptions = await sdk.billing().listSubscriptions();

  if (!subscriptions || subscriptions.length === 0) {
    output.warn('No subscriptions found');
    output.log('Create a subscription with: af billing subscribe');
    return;
  }

  output.printNewLine();
  output.log('Subscriptions:');
  output.printNewLine();

  const tableData = subscriptions.map((sub) => ({
    Plan: sub.plan,
    Status: sub.status,
    Seats: sub.seats,
    'Price/Seat': `$${(sub.basePricePerSeat / 100).toFixed(2)}`,
    'Usage Markup': `${(sub.usageMarkup * 100).toFixed(1)}%`,
    'Current Period': `${new Date(sub.currentPeriodStart).toLocaleDateString()} - ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`,
    'Cancel At': sub.cancelAt ? new Date(sub.cancelAt).toLocaleDateString() : 'N/A',
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
