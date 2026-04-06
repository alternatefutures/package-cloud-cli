import type { Command } from 'commander';

import { balanceActionHandler } from './balance';

export default (program: Command): Command => {
  const cmd = program
    .command('billing')
    .description('Manage billing and subscriptions');

  cmd
    .command('balance')
    .description('Show current credit balance')
    .action(() => balanceActionHandler());

  return cmd;
};
