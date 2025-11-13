// @ts-nocheck
import { output } from '../../cli';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';

const paymentMethodsAction: SdkGuardedFunction = async ({ sdk }) => {
  const methods = await sdk.billing().listPaymentMethods();

  if (!methods || methods.length === 0) {
    output.warn('No payment methods found');
    output.log('Add a payment method through the dashboard or API');
    return;
  }

  output.printNewLine();
  output.log('Payment Methods:');
  output.printNewLine();

  const tableData = methods.map((method) => {
    if (method.type === 'CARD') {
      return {
        Type: 'Card',
        Details: `${method.cardBrand} •••• ${method.cardLast4}`,
        Expiry: `${method.cardExpMonth}/${method.cardExpYear}`,
        Default: method.isDefault ? '✓' : '',
        Created: new Date(method.createdAt).toLocaleDateString(),
      };
    }
    return {
      Type: 'Crypto',
      Details: `${method.blockchain}: ${method.walletAddress?.substring(0, 10)}...${method.walletAddress?.substring(method.walletAddress.length - 8)}`,
      Expiry: 'N/A',
      Default: method.isDefault ? '✓' : '',
      Created: new Date(method.createdAt).toLocaleDateString(),
    };
  });

  output.table(tableData);
};

export const paymentMethodsActionHandler = withGuards(paymentMethodsAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});
