import type { Command } from 'commander';

import { output } from '../../cli';
import { loginGuard } from '../../guards/loginGuard';
import { graphqlFetch } from '../../graphql/client';
import {
  CLOSE_AKASH_DEPLOYMENT,
  GET_SERVICE_LOGS,
  LIST_AKASH_DEPLOYMENTS,
} from '../../graphql/operations';
import { confirmPrompt } from '../../prompts/confirmPrompt';

export default (program: Command): Command => {
  const cmd = program
    .command('akash')
    .description('Manage Akash deployments');

  cmd
    .command('list')
    .description('List all Akash deployments')
    .action(async () => {
      try {
        await loginGuard();

        const { data } = await graphqlFetch(LIST_AKASH_DEPLOYMENTS);
        const deployments = data?.akashDeployments;

        if (!deployments?.length) {
          output.log('No Akash deployments found.');
          return;
        }

        output.table(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          deployments.map((d: any) => ({
            ID: d.id,
            Status: d.status,
            Service: d.service?.name || 'N/A',
            Provider: d.provider || 'N/A',
            'Cost/mo': d.costPerMonth
              ? `$${Number(d.costPerMonth).toFixed(2)}`
              : 'N/A',
            Created: new Date(d.createdAt).toLocaleDateString(),
          })),
        );
      } catch (error) {
        output.error(
          error instanceof Error ? error.message : 'Failed to list deployments',
        );
        process.exit(1);
      }
    });

  cmd
    .command('logs <serviceId>')
    .description('Fetch logs for a service (use the service ID, not the deployment ID)')
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
    .description('Close an Akash deployment')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (deploymentId: string, options: { yes?: boolean }) => {
      try {
        await loginGuard();

        if (!options.yes) {
          const confirmed = await confirmPrompt({
            message: `Are you sure you want to close deployment ${deploymentId}?`,
            initial: false,
          });

          if (!confirmed) {
            output.log('Cancelled.');
            return;
          }
        }

        const { data } = await graphqlFetch(CLOSE_AKASH_DEPLOYMENT, {
          id: deploymentId,
        });

        output.success(
          `Deployment ${deploymentId} closed. Status: ${data?.closeAkashDeployment?.status}`,
        );
      } catch (error) {
        output.error(
          error instanceof Error
            ? error.message
            : 'Failed to close deployment',
        );
        process.exit(1);
      }
    });

  return cmd;
};
