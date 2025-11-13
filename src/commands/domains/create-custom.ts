// @ts-nocheck
import { output } from '../../cli';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';
import { t } from '../../utils/translation';
import { getHostnameOrPrompt } from './prompts/getHostnameOrPrompt';
import { promptForSiteSelection } from '../sites/prompts/promptSiteSelection';
import prompts from 'prompts';

export type CreateCustomDomainActionArgs = {
  siteId?: string;
  siteSlug?: string;
  hostname?: string;
  verificationMethod?: 'TXT' | 'CNAME' | 'A';
  domainType?: 'WEB2' | 'ARNS' | 'ENS' | 'IPNS';
};

export const createCustomDomainAction: SdkGuardedFunction<
  CreateCustomDomainActionArgs
> = async ({ sdk, args }) => {
  // Get site
  let siteId = args.siteId;

  if (!siteId && !args.siteSlug) {
    output.log(t('selectSiteForDomain'));
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

  // Get hostname
  const hostname = await getHostnameOrPrompt({ hostname: args.hostname });

  // Get verification method
  let verificationMethod = args.verificationMethod;

  if (!verificationMethod) {
    const response = await prompts({
      type: 'select',
      name: 'verificationMethod',
      message: t('selectVerificationMethod'),
      choices: [
        {
          title: 'TXT Record (Recommended - works with root domains)',
          value: 'TXT',
        },
        {
          title: 'CNAME Record (subdomains only)',
          value: 'CNAME',
        },
        {
          title: 'A Record (points to platform IP)',
          value: 'A',
        },
      ],
      initial: 0,
    });

    verificationMethod = response.verificationMethod;

    if (!verificationMethod) {
      output.error(t('verificationMethodRequired'));
      process.exit(1);
    }
  }

  output.spinner(t('creatingCustomDomain'));

  try {
    // Create zone for the site first
    const zone = await sdk.domains().createZoneForSite({ siteId });

    // Then create the domain with the zone
    const domain = await sdk.domains().createDomain({
      zoneId: zone.id,
      hostname,
    });

    output.printNewLine();
    output.success(
      t('commonItemActionSuccess', {
        subject: `${t('domain')} ${output.quoted(hostname)}`,
        action: t('created'),
      }),
    );
    output.printNewLine();

    // Display verification instructions
    output.log(t('domainCreatedNowVerify'));
    output.printNewLine();

    // Display DNS configs from the created domain
    if (domain.dnsConfigs && domain.dnsConfigs.length > 0) {
      output.log('Add these DNS records:');
      for (const config of domain.dnsConfigs) {
        output.log(output.textColor(`Type: ${config.type}`, 'cyan'));
        output.log(output.textColor(`Name: ${config.name}`, 'cyan'));
        output.log(output.textColor(`Value: ${config.value}`, 'cyan'));
        output.log(output.textColor('TTL: 3600', 'cyan'));
        output.printNewLine();
      }
    }

    output.log(t('afterAddingDnsRecordsRunVerify') + ':');
    output.log(output.textColor(`af domains verify --id ${domain.id}`, 'cyan'));
    output.printNewLine();

    return domain;
  } catch (error: any) {
    output.error(t('createDomainFailure') + ': ' + error.message);

    if (error.message.includes('already registered')) {
      output.warn(t('domainAlreadyExists'));
    }

    process.exit(1);
  }
};

export const createCustomDomainActionHandler = withGuards(
  createCustomDomainAction,
  {
    scopes: {
      authenticated: true,
      project: true,
      site: false,
    },
  },
);
