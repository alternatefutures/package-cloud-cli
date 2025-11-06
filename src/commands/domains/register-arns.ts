import type { SdkGuardedFunction } from '../../guards/types';
import { output } from '../../cli';
import { t } from '../../utils/translation';
import { withGuards } from '../../guards';
import { promptForSiteSelection } from '../sites/prompts';
import prompts from 'prompts';

type Args = {
  siteId?: string;
  siteSlug?: string;
  arnsName?: string;
};

const action: SdkGuardedFunction<Args> = async ({ sdk, args }) => {
  let siteId = args.siteId;
  let arnsName = args.arnsName;

  // Get site
  if (!siteId && !args.siteSlug) {
    output.log(t('selectSiteForArns'));
    const sites = await sdk.sites().list();

    if (sites.length === 0) {
      output.error(t('noSitesFound'));
      process.exit(1);
    }

    const selected = await promptForSiteSelection(sites);
    siteId = selected.id;
  }

  // Get site by slug if provided
  if (args.siteSlug && !siteId) {
    const site = await sdk.sites().getBySlug({ slug: args.siteSlug });
    siteId = site.id;
  }

  if (!siteId) {
    output.error(t('siteIdRequired'));
    process.exit(1);
  }

  // Prompt for ArNS name
  if (!arnsName) {
    const response = await prompts({
      type: 'text',
      name: 'arnsName',
      message: 'Enter ArNS name (e.g., my-site):',
      validate: (value: string) => {
        if (!value || value.length < 3) {
          return 'ArNS name must be at least 3 characters';
        }
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'ArNS name can only contain lowercase letters, numbers, and hyphens';
        }
        return true;
      },
    });

    arnsName = response.arnsName;

    if (!arnsName) {
      output.error('ArNS name is required');
      process.exit(1);
    }
  }

  output.spinner('Registering ArNS domain on Arweave...');

  try {
    const domain = await sdk.domains().createCustomDomain({
      siteId,
      hostname: `${arnsName}.arweave.net`,
      verificationMethod: 'TXT',
      domainType: 'ARNS',
    });

    output.printNewLine();
    output.success(`ArNS domain "${arnsName}" registered successfully!`);
    output.printNewLine();

    output.log('Your site is now accessible at:');
    output.log(output.textColor(`https://${arnsName}.arweave.net`, 'cyan'));
    output.printNewLine();

    output.log('ArNS Details:');
    output.log(`  Domain ID: ${domain.id}`);
    if (domain.arnsName) {
      output.log(`  ArNS Name: ${domain.arnsName}`);
    }
    if (domain.arnsTransactionId) {
      output.log(`  Transaction ID: ${domain.arnsTransactionId}`);
      output.log(
        `  View on Arweave: https://viewblock.io/arweave/tx/${domain.arnsTransactionId}`,
      );
    }
    output.printNewLine();

    output.hint('Note: ArNS propagation may take a few minutes.');

    return domain;
  } catch (error: any) {
    output.error('ArNS registration failed: ' + error.message);

    if (error.message.includes('already taken')) {
      output.warn('This ArNS name is already registered. Try a different name.');
    }

    process.exit(1);
  }
};

export const registerArnsActionHandler = withGuards(action, {
  scopes: {
    authenticated: true,
    project: true,
    site: false,
  },
});
