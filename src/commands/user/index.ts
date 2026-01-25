import type { Command } from 'commander';

import { t } from '../../utils/translation';
import { meActionHandler } from './me';

export default (program: Command): Command => {
  const cmd = program.command('user').description(t('userDescription'));

  // Default: show current user
  cmd.action(() => meActionHandler({}));

  cmd
    .command('me')
    .description(t('userMeDescription'))
    .option('--json', 'Output raw JSON')
    .action((opts: { json?: boolean }) => meActionHandler(opts));

  return cmd;
};

