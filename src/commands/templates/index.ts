import type { Command } from 'commander';

import { listTemplatesActionHandler } from './list';
import { infoTemplateActionHandler } from './info';
import { deployTemplateActionHandler, deployCompositeActionHandler } from './deploy';

type ListOptions = {
  category?: string;
};

type DeployOptions = {
  project?: string;
  compute: string;
  name?: string;
  env?: string[];
  gpu?: boolean;
  gpuModels?: string;
  gpuUnits?: string;
  maxBudget?: string;
  maxMonthly?: string;
  runtime?: string;
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
      'Filter by category (AI_ML, WEB_SERVER, GAME_SERVER, DATABASE, DEVTOOLS, CUSTOM)',
    )
    .action((options: ListOptions) =>
      listTemplatesActionHandler({ category: options.category?.toUpperCase() }),
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
      '--compute <mode>',
      'Compute environment (standard or confidential)',
      'standard',
    )
    .option('-n, --name <name>', 'Service name')
    .option('-e, --env <KEY=VALUE...>', 'Environment variable overrides')
    .option('--gpu', 'Enable GPU resources')
    .option('--gpu-models <models>', 'Acceptable GPU models (comma-separated, e.g. h100,a100)')
    .option('--gpu-units <count>', 'Number of GPU units (1-8)')
    .option('--max-budget <usd>', 'Total budget cap in USD')
    .option('--max-monthly <usd>', 'Monthly budget cap in USD')
    .option('--runtime <duration>', 'Max runtime duration (e.g. 4h, 30d, 120m)')
    .action((templateId: string, options: DeployOptions) =>
      deployTemplateActionHandler({
        templateId,
        projectId: options.project,
        compute: options.compute,
        name: options.name,
        env: options.env,
        gpu: options.gpu,
        gpuModels: options.gpuModels,
        gpuUnits: options.gpuUnits ? Number(options.gpuUnits) : undefined,
        maxBudget: options.maxBudget ? Number(options.maxBudget) : undefined,
        maxMonthly: options.maxMonthly ? Number(options.maxMonthly) : undefined,
        runtime: options.runtime,
      }),
    );

  cmd
    .command('deploy-composite <templateId>')
    .description('Deploy a composite (multi-service) template')
    .option('-p, --project <projectId>', 'Project ID to deploy into')
    .option(
      '--mode <mode>',
      'Deployment mode: fullstack (single compute) or custom (per-component)',
      'fullstack',
    )
    .option(
      '--compute <mode>',
      'Compute environment for fullstack mode (standard or confidential)',
      'standard',
    )
    .option('-n, --name <name>', 'Service name')
    .action(
      (
        templateId: string,
        options: {
          project?: string;
          mode: string;
          compute?: string;
          name?: string;
        },
      ) =>
        deployCompositeActionHandler({
          templateId,
          projectId: options.project,
          mode: options.mode,
          compute: options.compute,
          name: options.name,
        }),
    );

  return cmd;
};
