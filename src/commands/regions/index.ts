import type { Command } from 'commander';

import { regionsListActionHandler } from './list';

export default (program: Command): Command => {
  const cmd = program
    .command('regions')
    .description(
      'List curated deployment regions with live availability and pricing',
    )
    .option(
      '--provider <name>',
      'Filter by provider: akash | phala (default: akash)',
    )
    .option(
      '--gpu <model>',
      'Surface median price for a specific GPU model (e.g. h100, h200, a100, rtx4090)',
    )
    .action(regionsListActionHandler);

  return cmd;
};
