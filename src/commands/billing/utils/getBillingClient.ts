import { output } from '../../../cli';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySdk = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBillingClient = any;

export const getBillingClient = (sdk: AnySdk): AnyBillingClient | null => {
  // Check if SDK has billing support (newer SDK versions)
  if (typeof sdk.billing !== 'function') {
    output.error('Billing is not available in the current SDK version.');
    output.hint('Please update @alternatefutures/sdk to the latest version.');
    return null;
  }

  try {
    return sdk.billing();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('SDK__AUTH_SERVICE_URL')
    ) {
      output.error('Billing requires SDK__AUTH_SERVICE_URL to be configured.');
      output.hint(
        'Add SDK__AUTH_SERVICE_URL to your environment configuration.',
      );
      return null;
    }
    throw error;
  }
};
