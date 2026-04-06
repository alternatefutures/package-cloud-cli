import type { Command } from 'commander';

import { closeServiceActionHandler } from './close';
import { createServiceActionHandler } from './create';
import { deleteServiceActionHandler } from './delete';
import { deployServiceActionHandler } from './deploy';
import { infoServiceActionHandler } from './info';
import { listServicesActionHandler } from './list';
import { logsServiceActionHandler } from './logs';

export default (program: Command): Command => {
  const cmd = program
    .command('services')
    .description('Manage services in the current (or selected) project')
    .option('-p, --project <id-or-name>', 'Use a specific project')
    .action((options: { project?: string }) =>
      listServicesActionHandler(options.project),
    );

  cmd
    .command('list')
    .description('List all services in the project')
    .action(() => {
      const projectFlag = cmd.opts().project;
      return listServicesActionHandler(projectFlag);
    });

  cmd
    .command('info [id]')
    .description('Show details for a service')
    .action((id?: string) => {
      const projectFlag = cmd.opts().project;
      return infoServiceActionHandler(id, projectFlag);
    });

  cmd
    .command('create')
    .description('Create a new service from a template')
    .action(() => {
      const projectFlag = cmd.opts().project;
      return createServiceActionHandler(projectFlag);
    });

  cmd
    .command('deploy [id]')
    .description('Deploy (or redeploy) a service')
    .action((id?: string) => {
      const projectFlag = cmd.opts().project;
      return deployServiceActionHandler(id, projectFlag);
    });

  cmd
    .command('logs [id]')
    .description('Fetch logs for a service')
    .option('--tail <n>', 'Number of log lines', '50')
    .action((id?: string, options?: { tail?: string }) => {
      const projectFlag = cmd.opts().project;
      const tail = Number.parseInt(options?.tail || '50', 10);
      return logsServiceActionHandler(id, projectFlag, tail);
    });

  cmd
    .command('close [id]')
    .description('Close the active deployment on a service')
    .action((id?: string) => {
      const projectFlag = cmd.opts().project;
      return closeServiceActionHandler(id, projectFlag);
    });

  cmd
    .command('delete [id]')
    .description('Delete a service (closes deployment first if running)')
    .action((id?: string) => {
      const projectFlag = cmd.opts().project;
      return deleteServiceActionHandler(id, projectFlag);
    });

  return cmd;
};
