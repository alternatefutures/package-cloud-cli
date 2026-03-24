import type { Command } from 'commander';

import { listTemplatesActionHandler } from './list';
import { infoTemplateActionHandler } from './info';
import { deployTemplateActionHandler, deployCompositeActionHandler } from './deploy';

type ListOptions = {
  category?: string;
};

type DeployOptions = {
  project?: string;
  provider: string;
  name?: string;
  env?: string[];
  gpu?: boolean;
};

export default (program: Command): Command => {
  const cmd = program
    .command('templates')
    .description('Browse and deploy service templates');

  cmd
    .command('list')
    .description('List available deployment templates')
    .option(
      '-c, --category <category>',
      'Filter by category (ai-ml, web-servers, game-servers, databases, devtools)',
    )
    .action((options: ListOptions) =>
      listTemplatesActionHandler({ category: options.category }),
    );

  cmd
    .command('info <templateId>')
    .description('Show detailed template information')
    .action((templateId: string) =>
      infoTemplateActionHandler({ templateId }),
    );

  cmd
    .command('deploy <templateId>')
    .description('Deploy a service from a template')
    .option('-p, --project <projectId>', 'Project ID to deploy into')
    .option(
      '--provider <provider>',
      'Deployment provider (akash or phala)',
      'akash',
    )
    .option('-n, --name <name>', 'Service name')
    .option('-e, --env <KEY=VALUE...>', 'Environment variable overrides')
    .option('--gpu', 'Enable GPU resources')
    .action((templateId: string, options: DeployOptions) =>
      deployTemplateActionHandler({
        templateId,
        projectId: options.project,
        provider: options.provider,
        name: options.name,
        env: options.env,
        gpu: options.gpu,
      }),
    );

  cmd
    .command('deploy-composite <templateId>')
    .description('Deploy a composite (multi-service) template')
    .option('-p, --project <projectId>', 'Project ID to deploy into')
    .option(
      '--mode <mode>',
      'Deployment mode: fullstack (single provider) or custom (per-component)',
      'fullstack',
    )
    .option(
      '--provider <provider>',
      'Provider for fullstack mode (akash or phala)',
      'akash',
    )
    .option('-n, --name <name>', 'Service name')
    .action(
      (
        templateId: string,
        options: {
          project?: string;
          mode: string;
          provider?: string;
          name?: string;
        },
      ) =>
        deployCompositeActionHandler({
          templateId,
          projectId: options.project,
          mode: options.mode,
          provider: options.provider,
          name: options.name,
        }),
    );

  return cmd;
};
