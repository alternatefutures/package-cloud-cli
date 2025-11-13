// @ts-nocheck
import type { Command } from 'commander';

import { customerActionHandler } from './customer';
import { invoicesActionHandler } from './invoices';
import { paymentMethodsActionHandler } from './paymentMethods';
import { subscriptionsActionHandler } from './subscriptions';
import { usageActionHandler } from './usage';

export default (program: Command): Command => {
  const cmd = program
    .command('billing')
    .description('Manage billing and subscriptions');

  cmd
    .command('customer')
    .description('View customer information')
    .action(() => customerActionHandler());

  cmd
    .command('subscriptions')
    .description('List subscriptions')
    .action(() => subscriptionsActionHandler());

  cmd
    .command('invoices')
    .description('List invoices')
    .option(
      '--status <status>',
      'Filter by invoice status (DRAFT, OPEN, PAID, VOID)',
    )
    .option('--limit <number>', 'Limit number of results', '50')
    .action((options: { status?: string; limit?: string }) =>
      invoicesActionHandler(options),
    );

  cmd
    .command('usage')
    .description('View current usage metrics')
    .action(() => usageActionHandler());

  cmd
    .command('payment-methods')
    .description('List payment methods')
    .action(() => paymentMethodsActionHandler());

  return cmd;
};
