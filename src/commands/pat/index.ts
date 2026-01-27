import { MissingExpectedDataError } from '@alternatefutures/errors';
import type { Command } from 'commander';

import { getDefined } from '../../defined';
import { t } from '../../utils/translation';
import { createPersonalAccessTokenActionHandler } from './create';
import { deletePersonalAccessTokenActionHandler } from './delete';
import { listPersonalAccessTokensActionHandler } from './list';

export default (program: Command): Command => {
  const cmd = program.command('pat').description(t('patDescription'));

  cmd
    .command('list')
    .description(t('patListDesc'))
    .action(listPersonalAccessTokensActionHandler);

  cmd
    .command('create')
    .description(t('createNewPat'))
    .option('-n, --name <name>', t('patName'))
    .action(async (args) => {
      const authServiceUrl =
        getDefined('SDK__AUTH_SERVICE_URL') || getDefined('AUTH__API_URL');

      if (!authServiceUrl) {
        throw new MissingExpectedDataError();
      }

      await createPersonalAccessTokenActionHandler({
        authServiceUrl,
        ...args,
      });
    });

  cmd
    .command('delete')
    .description(t('patDelete'))
    .argument(
      '<personalAccessTokenId>',
      t('commonNameOfSubjectToAction', {
        name: t('id'),
        subject: t('personalAccessToken'),
        action: t('delete'),
      }),
    )
    .action((personalAccessTokenId: string) =>
      deletePersonalAccessTokenActionHandler({ personalAccessTokenId }),
    );

  return cmd;
};
