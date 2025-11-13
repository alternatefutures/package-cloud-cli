import prompts from 'prompts';
import { output } from '../../cli';
// @ts-nocheck
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';
import { t } from '../../utils/translation';
import { promptForSiteSelection } from '../sites/prompts/promptSiteSelection';

type Args = {
  siteId?: string;
  siteSlug?: string;
  ensName?: string;
};

const action: SdkGuardedFunction<Args> = async ({ sdk, args }) => {
  let siteId = args.siteId;
  let ensName = args.ensName;

  // Get site
  if (!siteId && !args.siteSlug) {
    output.log('Select site to link to ENS domain:');
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

  // Prompt for ENS name
  if (!ensName) {
    const response = await prompts({
      type: 'text',
      name: 'ensName',
      message: 'Enter ENS domain (e.g., mysite.eth):',
      validate: (value: string) => {
        if (!value || !value.endsWith('.eth')) {
          return 'ENS domain must end with .eth';
        }
        if (value.length < 8) {
          // min: "xxx.eth"
          return 'ENS domain is too short';
        }
        return true;
      },
    });

    ensName = response.ensName;

    if (!ensName) {
      output.error('ENS name is required');
      process.exit(1);
    }
  }

  output.spinner('Linking ENS domain...');

  try {
    const domain = await sdk.domains().createCustomDomain({
      siteId,
      hostname: ensName,
      verificationMethod: 'TXT',
      domainType: 'ENS',
    });

    output.printNewLine();
    output.success(`ENS domain "${ensName}" linked successfully!`);
    output.printNewLine();

    output.log('Next steps:');
    output.log('1. Go to your ENS manager (e.g., app.ens.domains)');
    output.log('2. Set the content hash for your ENS domain');
    output.log("3. Point it to your site's IPFS CID");
    output.printNewLine();

    output.log('ENS Details:');
    output.log(`  Domain ID: ${domain.id}`);
    output.log(`  ENS Name: ${ensName}`);
    output.printNewLine();

    output.hint(
      'Access your site via ENS-compatible browsers (e.g., Brave, Opera)',
    );
    output.log(output.textColor(`ens://${ensName}`, 'cyan'));

    return domain;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    output.error(`ENS linking failed: ${errorMessage}`);

    if (errorMessage.includes('not owned')) {
      output.warn('You must own this ENS domain to link it.');
      output.log('Register an ENS domain at: https://app.ens.domains');
    }

    process.exit(1);
  }
};

export const registerEnsActionHandler = withGuards(action, {
  scopes: {
    authenticated: true,
    project: true,
    site: false,
  },
});
