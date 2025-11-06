import type { Command } from 'commander';

import { t } from '../../utils/translation';
import { createDomainActionHandler } from './create';
import { createCustomDomainActionHandler } from './create-custom';
import { deleteDomainActionHandler } from './delete';
import { detailDomainActionHandler } from './detail';
import { listDomainsActionHandler } from './list';
import { verifyDomainActionHandler } from './verify';
import { provisionSslActionHandler } from './provision-ssl';
import { setPrimaryDomainActionHandler } from './set-primary';

export default (program: Command): Command => {
  const cmd = program.command('domains').description(t('domainsDesc'));

  cmd
    .command('list')
    .option('--siteId <string>', t('siteIDDomainAssignTo'))
    .description(t('listAllDomainsSelectProject'))
    .action((options: { siteId?: string }) =>
      listDomainsActionHandler(options),
    );

  cmd
    .command('detail')
    .option('--id <string>', t('idOfDomainForDetails'))
    .option('--hostname <string>', t('hostnameOfDomainForDetails'))
    .description(t('showDomainDetails'))
    .action((options: { id?: string; hostname?: string }) =>
      detailDomainActionHandler(options),
    );

  cmd
    .command('create')
    .option('--privateGatewayId <string>', t('idOfPvtGwToCreateDomainFor'))
    .option('--privateGatewaySlug <string>', t('slugOfPvtGwToCreateDomainFor'))
    .option('--siteId <string>', t('siteIdToCreateDomainFor'))
    .option('--siteSlug <string>', t('slugCreateDomainFor'))
    .option('--hostname <string>', t('hostnameCreateDomainFor'))
    .description(t('createDomainForSiteOrGw'))
    .action(
      (options: {
        privateGatewayName?: string;
        siteId?: string;
        siteSlug?: string;
        hostname?: string;
      }) => createDomainActionHandler(options),
    );

  cmd
    .command('delete')
    .option(
      '--id <string>',
      t('commonNameOfSubjectToAction', {
        name: t('id'),
        subject: t('domain'),
        action: t('delete'),
      }),
    )
    .option(
      '--hostname <string>',
      t('commonNameOfSubjectToAction', {
        name: t('hostname'),
        subject: t('ens'),
        action: t('delete'),
      }),
    )
    .description(t('deleteDomain'))
    .action((options: { hostname?: string }) =>
      deleteDomainActionHandler(options),
    );

  cmd
    .command('verify')
    .option('--id <string>', t('verifyDomainById'))
    .option('--hostname <string>', t('verifyDomainByHostname'))
    .description(t('verifyDomainConfig'))
    .action((options: { hostname?: string }) =>
      verifyDomainActionHandler(options),
    );

  // New custom domains commands
  cmd
    .command('create-custom')
    .option('--siteId <string>', t('siteIdToCreateDomainFor'))
    .option('--siteSlug <string>', t('slugCreateDomainFor'))
    .option('--hostname <string>', t('hostnameCreateDomainFor'))
    .option(
      '--verificationMethod <string>',
      'Verification method: TXT, CNAME, or A',
    )
    .option('--domainType <string>', 'Domain type: WEB2, ARNS, ENS, or IPNS')
    .description('Create custom domain with SSL support')
    .action(
      (options: {
        siteId?: string;
        siteSlug?: string;
        hostname?: string;
        verificationMethod?: 'TXT' | 'CNAME' | 'A';
        domainType?: 'WEB2' | 'ARNS' | 'ENS' | 'IPNS';
      }) => createCustomDomainActionHandler(options),
    );

  // SSL commands under 'domains ssl' subcommand
  const sslCmd = cmd.command('ssl').description('Manage SSL certificates');

  sslCmd
    .command('provision')
    .option('--id <string>', 'Domain ID to provision SSL for')
    .option('--hostname <string>', 'Domain hostname to provision SSL for')
    .option('--email <string>', 'Email for Let\'s Encrypt notifications')
    .description('Provision SSL certificate for domain')
    .action(
      (options: { id?: string; hostname?: string; email?: string }) =>
        provisionSslActionHandler(options),
    );

  cmd
    .command('set-primary')
    .option('--siteId <string>', 'Site ID')
    .option('--siteSlug <string>', 'Site slug')
    .option('--domainId <string>', 'Domain ID to set as primary')
    .option('--hostname <string>', 'Domain hostname to set as primary')
    .description('Set a domain as the primary domain for a site')
    .action(
      (options: {
        siteId?: string;
        siteSlug?: string;
        domainId?: string;
        hostname?: string;
      }) => setPrimaryDomainActionHandler(options),
    );

  return cmd;
};
