import type { Command } from 'commander';

import { createProjectActionHandler } from './create';
import { deleteProjectActionHandler } from './delete';
import { listProjectsActionHandler } from './list';
import { switchProjectActionHandler } from './switch';
import { updateProjectActionHandler } from './update';

export default (program: Command): Command => {
  const cmd = program
    .command('projects')
    .description('Manage your projects')
    .action(() => listProjectsActionHandler());

  cmd
    .command('list')
    .description('List all projects')
    .action(() => listProjectsActionHandler());

  cmd
    .command('create')
    .description('Create a new project')
    .option('--name <string>', 'Project name')
    .action((options: { name?: string }) => createProjectActionHandler(options));

  cmd
    .command('update [id]')
    .description('Rename a project')
    .action((id?: string) => updateProjectActionHandler(id));

  cmd
    .command('switch [id]')
    .description('Switch to a different project')
    .action((id?: string) => switchProjectActionHandler({ id }));

  cmd
    .command('delete [id]')
    .description('Delete a project and all its services')
    .action((id?: string) => deleteProjectActionHandler(id));

  return cmd;
};
