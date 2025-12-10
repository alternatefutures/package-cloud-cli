import { output } from '../../cli';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';
import { getBillingClient } from './utils/getBillingClient';

const customerAction: SdkGuardedFunction = async ({ sdk }) => {
  const billingClient = getBillingClient(sdk);
  if (!billingClient) return;

  const customer = await billingClient.getCustomer();

  if (!customer) {
    output.warn('No customer information found');
    output.log('You may need to create a subscription first.');
    return;
  }

  output.printNewLine();
  output.log('Customer Information:');
  output.printNewLine();

  const customerData = [
    { Field: 'ID', Value: customer.id },
    { Field: 'Email', Value: customer.email || 'N/A' },
    { Field: 'Name', Value: customer.name || 'N/A' },
    {
      Field: 'Created',
      Value: new Date(customer.createdAt * 1000).toLocaleDateString(),
    },
  ];

  output.table(customerData);
};

export const customerActionHandler = withGuards(customerAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});
