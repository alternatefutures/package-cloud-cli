import type { Command } from 'commander';

import { output } from '../../cli';
import { openShell } from './openShell';

export default (program: Command): Command => {
  const cmd = program
    .command('ssh <serviceId>')
    .description('Open an interactive shell in a running deployment')
    .option('--service <name>', 'SDL service name (for multi-service deployments)')
    .option('--command <cmd>', 'Command to execute (default: /bin/bash)')
    .action(async (serviceId: string, opts: { service?: string; command?: string }) => {
      try {
        await openShell(serviceId, opts);
      } catch (error) {
        output.error(
          error instanceof Error ? error.message : 'Failed to open shell',
        );
        process.exit(1);
      }
    });

  return cmd;
};
