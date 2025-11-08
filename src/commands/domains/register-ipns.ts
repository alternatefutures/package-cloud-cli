// @ts-nocheck
import type { SdkGuardedFunction } from '../../guards/types';
import { output } from '../../cli';
import { t } from '../../utils/translation';
import { withGuards } from '../../guards';
import { promptForSiteSelection } from '../sites/prompts';
import prompts from 'prompts';

type Args = {
  siteId?: string;
  siteSlug?: string;
  ipnsName?: string;
};

const action: SdkGuardedFunction<Args> = async ({ sdk, args }) => {
  let siteId = args.siteId;
  let ipnsName = args.ipnsName;

  // Get site
  if (!siteId && !args.siteSlug) {
    output.log('Select site to create IPNS name for:');
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

  // Prompt for IPNS name
  if (!ipnsName) {
    const response = await prompts({
      type: 'text',
      name: 'ipnsName',
      message: 'Enter IPNS name (optional, will auto-generate if empty):',
      validate: (value: string) => {
        if (value && value.length < 3) {
          return 'IPNS name must be at least 3 characters';
        }
        if (value && !/^[a-z0-9-_]+$/.test(value)) {
          return 'IPNS name can only contain lowercase letters, numbers, hyphens, and underscores';
        }
        return true;
      },
    });

    ipnsName = response.ipnsName || `site-${siteId.slice(0, 8)}`;
  }

  output.spinner('Creating IPNS name...');

  try {
    const domain = await sdk.domains().createCustomDomain({
      siteId,
      hostname: ipnsName,
      verificationMethod: 'TXT',
      domainType: 'IPNS',
    });

    output.printNewLine();
    output.success(`IPNS name "${ipnsName}" created successfully!`);
    output.printNewLine();

    output.log('Your site is now accessible via IPNS:');
    if (domain.ipnsHash) {
      output.log(output.textColor(`/ipns/${domain.ipnsHash}`, 'cyan'));
      output.log(
        output.textColor(`https://ipfs.io/ipns/${domain.ipnsHash}`, 'cyan'),
      );
    }
    output.printNewLine();

    output.log('IPNS Details:');
    output.log(`  Domain ID: ${domain.id}`);
    output.log(`  IPNS Name: ${ipnsName}`);
    if (domain.ipnsHash) {
      output.log(`  IPNS Hash: ${domain.ipnsHash}`);
    }
    output.printNewLine();

    output.log('Benefits of IPNS:');
    output.log('  ✓ Mutable pointer to your content');
    output.log('  ✓ Update content without changing the IPNS address');
    output.log('  ✓ Works with any IPFS gateway');
    output.printNewLine();

    output.hint(
      'IPNS records are automatically updated when you deploy new versions.',
    );

    return domain;
  } catch (error: any) {
    output.error('IPNS creation failed: ' + error.message);

    if (error.message.includes('already exists')) {
      output.warn('This IPNS name already exists. Try a different name.');
    }

    process.exit(1);
  }
};

export const registerIpnsActionHandler = withGuards(action, {
  scopes: {
    authenticated: true,
    project: true,
    site: false,
  },
});
