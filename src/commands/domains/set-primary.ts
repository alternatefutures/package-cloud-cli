// @ts-nocheck
import type { SdkGuardedFunction } from '../../guards/types';
import { output } from '../../cli';
import { t } from '../../utils/translation';
import { withGuards } from '../../guards';
import { promptForDomainSelection } from './prompts/promptForDomainSelection';
import { promptForSiteSelection } from '../sites/prompts';

type Args = {
  siteId?: string;
  siteSlug?: string;
  domainId?: string;
  hostname?: string;
};

const action: SdkGuardedFunction<Args> = async ({ sdk, args }) => {
  let siteId = args.siteId;
  let domainId = args.domainId;

  // Get site ID if not provided
  if (!siteId && !args.siteSlug) {
    output.log(t('selectSiteForPrimaryDomain'));
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

  // Get domain ID if not provided
  if (!domainId && !args.hostname) {
    output.log(t('selectDomainToSetAsPrimary'));

    // List domains for this site
    const domains = await sdk.domains().listDomainsForSite({ siteId });

    if (domains.length === 0) {
      output.error(t('noDomainsFoundForSite'));
      process.exit(1);
    }

    // Filter to only verified domains
    const verifiedDomains = domains.filter((d: any) => d.verified);

    if (verifiedDomains.length === 0) {
      output.error(t('noVerifiedDomainsFound'));
      output.warn(t('verifyDomainFirst'));
      process.exit(1);
    }

    const selected = await promptForDomainSelection(verifiedDomains);
    domainId = selected.id;
  }

  // Get domain by hostname if provided
  if (args.hostname && !domainId) {
    const domain = await sdk
      .domains()
      .getByHostname({ hostname: args.hostname });
    domainId = domain.id;
  }

  if (!domainId) {
    output.error(t('domainIdRequired'));
    process.exit(1);
  }

  output.spinner(t('settingPrimaryDomain'));

  try {
    const result = await sdk.domains().setPrimaryDomain({
      siteId,
      domainId,
    });

    output.success(t('primaryDomainSet'));

    if (result.primaryDomain) {
      output.log(t('primaryDomain') + ': ' + result.primaryDomain.hostname);
    }

    return result;
  } catch (error: any) {
    output.error(t('setPrimaryDomainFailed') + ': ' + error.message);

    if (error.message.includes('verified')) {
      output.warn(t('onlyVerifiedDomainsCanBePrimary'));
    }

    if (error.message.includes('does not belong')) {
      output.warn(t('domainDoesNotBelongToSite'));
    }

    process.exit(1);
  }
};

export const setPrimaryDomainActionHandler = withGuards(action, {
  scopes: {
    authenticated: true,
    project: true,
    site: false,
  },
});
