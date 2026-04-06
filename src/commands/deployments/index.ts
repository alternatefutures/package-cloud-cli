import type { Command } from 'commander';

import chalk from 'chalk';

import { output } from '../../cli';
import { loginGuard } from '../../guards/loginGuard';
import { graphqlFetch } from '../../graphql/client';
import {
  ALL_DEPLOYMENTS,
  CLOSE_AKASH_DEPLOYMENT,
  DELETE_PHALA_DEPLOYMENT,
  GET_SERVICE_LOGS,
  STOP_PHALA_DEPLOYMENT,
} from '../../graphql/operations';
import { confirmPrompt } from '../../prompts/confirmPrompt';

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

const fetchDeployments = async (
  projectId?: string,
  limit?: number,
): Promise<UnifiedDeployment[]> => {
  const vars: Record<string, unknown> = {};
  if (projectId) vars.projectId = projectId;
  if (limit) vars.limit = limit;

  const { data } = await graphqlFetch<{
    allDeployments: UnifiedDeployment[];
  }>(ALL_DEPLOYMENTS, vars);

  return data?.allDeployments ?? [];
};

const findDeploymentByIdOrShortId = (
  deployments: UnifiedDeployment[],
  idOrShortId: string,
): UnifiedDeployment | undefined => {
  return deployments.find(
    (d) => d.id === idOrShortId || d.shortId === idOrShortId,
  );
};

export default (program: Command): Command => {
  const cmd = program
    .command('deployments')
    .description('Manage deployments');

  cmd
    .command('list')
    .description('List all deployments')
    .option('-p, --project <projectId>', 'Filter by project ID')
    .option('-l, --limit <n>', 'Max number of deployments to show', '50')
    .action(
      async (options: { project?: string; limit?: string }) => {
        try {
          await loginGuard();

          const limit = parseInt(options.limit || '50', 10);
          const deployments = await fetchDeployments(options.project, limit);

          if (!deployments.length) {
            output.log('No deployments found.');
            return;
          }

          const statusColor = (s: string) => {
            if (s === 'ACTIVE') return chalk.green(s);
            if (s === 'STOPPED' || s === 'REMOVED') return chalk.dim(s);
            return chalk.yellow(s);
          };

          const rows = deployments.map((d) => [
            chalk.white(d.shortId || d.id.slice(0, 8)),
            chalk.white(KIND_LABELS[d.kind] || d.kind),
            statusColor(d.status),
            chalk.white(d.serviceName),
            chalk.gray(d.projectName || 'N/A'),
            chalk.gray(new Date(d.createdAt).toLocaleDateString()),
          ]);

          output.styledTable(
            ['ID', 'Type', 'Status', 'Service', 'Project', 'Created'],
            rows,
          );
        } catch (error) {
          output.error(
            error instanceof Error
              ? error.message
              : 'Failed to list deployments',
          );
          process.exit(1);
        }
      },
    );

  cmd
    .command('logs <serviceId>')
    .description('Fetch logs for a service')
    .option('--tail <n>', 'Number of log lines to fetch', '50')
    .action(async (serviceId: string, options: { tail?: string }) => {
      try {
        await loginGuard();

        const tail = parseInt(options.tail || '50', 10);
        const { data } = await graphqlFetch(GET_SERVICE_LOGS, {
          serviceId,
          tail,
        });

        const result = data?.serviceLogs;
        if (!result?.logs) {
          output.log('No logs available for this service.');
          return;
        }

        output.printNewLine();
        output.log(`Logs for service ${serviceId}:`);
        output.printNewLine();
        output.raw(result.logs);
        output.printNewLine();
      } catch (error) {
        output.error(
          error instanceof Error ? error.message : 'Failed to fetch logs',
        );
        process.exit(1);
      }
    });

  cmd
    .command('close <deploymentId>')
    .description('Close/stop a deployment')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (deploymentId: string, options: { yes?: boolean }) => {
      try {
        await loginGuard();

        const deployments = await fetchDeployments(undefined, 200);
        const deployment = findDeploymentByIdOrShortId(
          deployments,
          deploymentId,
        );

        if (!deployment) {
          output.error(
            `Deployment "${deploymentId}" not found. Run \`af deployments list\` to see available deployments.`,
          );
          return;
        }

        const typeLabel = KIND_LABELS[deployment.kind] || deployment.kind;

        if (!options.yes) {
          const confirmed = await confirmPrompt({
            message: `Close ${typeLabel.toLowerCase()} deployment "${deployment.serviceName}" (${deployment.shortId})?`,
            initial: false,
          });

          if (!confirmed) {
            output.log('Cancelled.');
            return;
          }
        }

        if (deployment.kind === 'PHALA') {
          const { data } = await graphqlFetch(STOP_PHALA_DEPLOYMENT, {
            id: deployment.id,
          });
          output.success(
            `Deployment closed. Status: ${data?.stopPhalaDeployment?.status}`,
          );
        } else if (deployment.kind === 'AKASH') {
          const { data } = await graphqlFetch(CLOSE_AKASH_DEPLOYMENT, {
            id: deployment.id,
          });
          output.success(
            `Deployment closed. Status: ${data?.closeAkashDeployment?.status}`,
          );
        } else {
          output.error(
            `Cannot close a ${typeLabel} deployment via this command.`,
          );
        }
      } catch (error) {
        output.error(
          error instanceof Error
            ? error.message
            : 'Failed to close deployment',
        );
        process.exit(1);
      }
    });

  cmd
    .command('delete <deploymentId>')
    .description('Permanently delete a confidential deployment')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (deploymentId: string, options: { yes?: boolean }) => {
      try {
        await loginGuard();

        const deployments = await fetchDeployments(undefined, 200);
        const deployment = findDeploymentByIdOrShortId(
          deployments,
          deploymentId,
        );

        if (!deployment) {
          output.error(
            `Deployment "${deploymentId}" not found. Run \`af deployments list\` to see available deployments.`,
          );
          return;
        }

        if (deployment.kind !== 'PHALA') {
          output.error(
            'Delete is only available for confidential deployments. Use `af deployments close` for standard deployments.',
          );
          return;
        }

        if (!options.yes) {
          output.warn(
            'This will permanently delete the deployment and all associated data.',
          );
          output.printNewLine();

          const confirmed = await confirmPrompt({
            message: `Permanently delete deployment "${deployment.serviceName}" (${deployment.shortId})?`,
            initial: false,
          });

          if (!confirmed) {
            output.log('Cancelled.');
            return;
          }
        }

        const { data } = await graphqlFetch(DELETE_PHALA_DEPLOYMENT, {
          id: deployment.id,
        });

        output.success(
          `Deployment deleted. Status: ${data?.deletePhalaDeployment?.status}`,
        );
      } catch (error) {
        output.error(
          error instanceof Error
            ? error.message
            : 'Failed to delete deployment',
        );
        process.exit(1);
      }
    });

  return cmd;
};
