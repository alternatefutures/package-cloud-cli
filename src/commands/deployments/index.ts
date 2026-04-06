import type { Command } from 'commander';

import chalk from 'chalk';

import { output } from '../../cli';
import { loginGuard } from '../../guards/loginGuard';
import { graphqlFetch } from '../../graphql/client';
import { ALL_DEPLOYMENTS } from '../../graphql/operations';

const KIND_LABELS: Record<string, string> = {
  AKASH: 'Standard',
  PHALA: 'Confidential',
  FUNCTION: 'Function',
  SITE: 'Site',
};

type UnifiedDeployment = {
  id: string;
  shortId: string;
  status: string;
  kind: string;
  serviceName: string;
  serviceSlug: string | null;
  serviceType: string;
  projectId: string | null;
  projectName: string | null;
  source: string;
  image: string | null;
  statusMessage: string | null;
  createdAt: string;
  updatedAt: string | null;
};

type ListOptions = {
  project?: string;
  service?: string;
  status?: string;
  all?: boolean;
  limit?: string;
};

const ACTIVE_STATUSES = new Set([
  'ACTIVE', 'DEPLOYING', 'INITIALIZING', 'QUEUED', 'BUILDING',
]);

const listDeploymentsAction = async (options: ListOptions) => {
  try {
    await loginGuard();

    const limit = parseInt(options.limit || '50', 10);
    const vars: Record<string, unknown> = { limit };
    if (options.project) vars.projectId = options.project;

    const { data } = await graphqlFetch<{
      allDeployments: UnifiedDeployment[];
    }>(ALL_DEPLOYMENTS, vars);

    let deployments = data?.allDeployments ?? [];

    if (options.service) {
      const needle = options.service.toLowerCase();
      deployments = deployments.filter(
        (d) =>
          d.serviceName.toLowerCase().includes(needle) ||
          (d.serviceSlug && d.serviceSlug.toLowerCase().includes(needle)),
      );
    }

    if (options.status) {
      const needle = options.status.toUpperCase();
      deployments = deployments.filter((d) => d.status === needle);
    } else if (!options.all) {
      deployments = deployments.filter((d) => ACTIVE_STATUSES.has(d.status));
    }

    if (!deployments.length) {
      output.log('No deployments found.');
      if (!options.all) {
        output.hint('Use --all to include closed and old deployments.');
      }
      return;
    }

    const statusColor = (s: string) => {
      if (s === 'ACTIVE') return chalk.green(s);
      if (s === 'FAILED') return chalk.red(s);
      if (s === 'REMOVED' || s === 'STOPPED') return chalk.dim(s);
      return chalk.yellow(s);
    };

    const rows = deployments.map((d) => [
      chalk.white(d.projectName || '–'),
      chalk.white(d.serviceName),
      statusColor(d.status),
      chalk.gray(KIND_LABELS[d.kind] || d.kind),
      chalk.gray(new Date(d.createdAt).toLocaleDateString()),
      chalk.gray(d.shortId || d.id.slice(0, 8)),
    ]);

    output.styledTable(
      ['Project', 'Service', 'Status', 'Type', 'Started', 'ID'],
      rows,
    );
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to list deployments',
    );
    process.exit(1);
  }
};

export default (program: Command): Command => {
  const cmd = program
    .command('deployments')
    .description('List and view deployments (across all projects & services)')
    .option('--project <name-or-id>', 'Filter by project')
    .option('--service <name-or-id>', 'Filter by service')
    .option('--status <status>', 'Filter by status (active, failed, closed)')
    .option('--all', 'Include closed and old deployments')
    .option('-l, --limit <n>', 'Max deployments to show', '50')
    .action((options: ListOptions) => listDeploymentsAction(options));

  cmd
    .command('list')
    .description('List all deployments')
    .option('--project <name-or-id>', 'Filter by project')
    .option('--service <name-or-id>', 'Filter by service')
    .option('--status <status>', 'Filter by status')
    .option('--all', 'Include closed and old deployments')
    .option('-l, --limit <n>', 'Max deployments to show', '50')
    .action((options: ListOptions) => listDeploymentsAction(options));

  return cmd;
};
