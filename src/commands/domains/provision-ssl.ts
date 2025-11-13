// @ts-nocheck
import type { SdkGuardedFunction } from '../../guards/types';
import { output } from '../../cli';
import { t } from '../../utils/translation';
import { withGuards } from '../../guards/withGuards';
import { promptForDomainSelection } from './prompts/promptDomainSelection';
import prompts from 'prompts';

type Args = {
  id?: string;
  hostname?: string;
  email?: string;
};

const action: SdkGuardedFunction<Args> = async ({ sdk, args }) => {
  let domainId = args.id;
  let email = args.email;

  // If no domain ID provided, let user select from list
  if (!domainId && !args.hostname) {
    output.log(t('selectDomainForSslProvisioning'));
    const domains = await sdk.domains().list();

    if (domains.length === 0) {
      output.error(t('noDomainsFound'));
      process.exit(1);
    }

    const selected = await promptForDomainSelection(domains);
    domainId = selected.id;
  }

  // If hostname provided, get domain by hostname
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

  // Prompt for email if not provided
  if (!email) {
    const response = await prompts({
      type: 'text',
      name: 'email',
      message: t('enterEmailForLetsEncrypt'),
      validate: (value: string) => {
        if (!value || !value.includes('@')) {
          return t('validEmailRequired');
        }
        return true;
      },
    });

    email = response.email;

    if (!email) {
      output.error(t('emailRequired'));
      process.exit(1);
    }
  }

  output.spinner(t('provisioningSslCertificate'));

  try {
    const result = await sdk.domains().provisionSsl({
      domainId,
      email,
    });

    output.success(t('sslProvisioningInitiated'));
    output.log(t('sslStatus') + ': ' + result.sslStatus);

    if (result.sslStatus === 'PENDING') {
      output.warn(t('sslProvisioningTakesTime'));
      output.log(t('checkSslStatusLater'));
    }

    if (result.sslStatus === 'ACTIVE') {
      output.success(t('sslCertificateActive'));
      if (result.sslExpiresAt) {
        output.log(
          t('expiresAt') +
            ': ' +
            new Date(result.sslExpiresAt).toLocaleDateString(),
        );
      }
    }

    return result;
  } catch (error: any) {
    output.error(t('sslProvisioningFailed') + ': ' + error.message);

    if (error.message.includes('verified')) {
      output.warn(t('domainMustBeVerifiedFirst'));
      output.log(
        t('runVerifyCommand') + ': af domains verify --id ' + domainId,
      );
    }

    process.exit(1);
  }
};

export const provisionSslActionHandler = withGuards(action, {
  scopes: {
    authenticated: true,
    project: true,
    site: false,
  },
});
