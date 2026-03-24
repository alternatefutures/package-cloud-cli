import type { Command } from 'commander';

import { output } from '../../cli';
import { loginGuard } from '../../guards/loginGuard';
import { graphqlFetch } from '../../graphql/client';
import {
  DELETE_PHALA_DEPLOYMENT,
  LIST_PHALA_DEPLOYMENTS,
  STOP_PHALA_DEPLOYMENT,
} from '../../graphql/operations';
import { confirmPrompt } from '../../prompts/confirmPrompt';

export default (program: Command): Command => {
  const cmd = program
    .command('phala')
    .description('Manage Phala TEE deployments');

  cmd
    .command('list')
    .description('List all Phala deployments')
    .action(async () => {
      try {
        await loginGuard();

        const { data } = await graphqlFetch(LIST_PHALA_DEPLOYMENTS);
        const deployments = data?.phalaDeployments;

        if (!deployments?.length) {
          output.log('No Phala deployments found.');
          return;
        }

        output.table(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          deployments.map((d: any) => ({
            ID: d.id,
            Status: d.status,
            'App ID': d.appId || 'N/A',
            'CVM Size': d.cvmSize || 'N/A',
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
    .command('stop <deploymentId>')
    .description('Stop a Phala CVM')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (deploymentId: string, options: { yes?: boolean }) => {
      try {
        await loginGuard();

        if (!options.yes) {
          const confirmed = await confirmPrompt({
            message: `Are you sure you want to stop CVM ${deploymentId}?`,
            initial: false,
          });

          if (!confirmed) {
            output.log('Cancelled.');
            return;
          }
        }

        const { data } = await graphqlFetch(STOP_PHALA_DEPLOYMENT, {
          id: deploymentId,
        });

        output.success(
          `CVM ${deploymentId} stopped. Status: ${data?.stopPhalaDeployment?.status}`,
        );
      } catch (error) {
        output.error(
          error instanceof Error ? error.message : 'Failed to stop CVM',
        );
        process.exit(1);
      }
    });

  cmd
    .command('delete <deploymentId>')
    .description('Permanently delete a Phala CVM')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (deploymentId: string, options: { yes?: boolean }) => {
      try {
        await loginGuard();

        if (!options.yes) {
          output.warn(
            'This will permanently delete the CVM and all associated data.',
          );
          output.printNewLine();

          const confirmed = await confirmPrompt({
            message: `Are you sure you want to permanently delete CVM ${deploymentId}?`,
            initial: false,
          });

          if (!confirmed) {
            output.log('Cancelled.');
            return;
          }
        }

        const { data } = await graphqlFetch(DELETE_PHALA_DEPLOYMENT, {
          id: deploymentId,
        });

        output.success(
          `CVM ${deploymentId} deleted. Status: ${data?.deletePhalaDeployment?.status}`,
        );
      } catch (error) {
        output.error(
          error instanceof Error ? error.message : 'Failed to delete CVM',
        );
        process.exit(1);
      }
    });

  return cmd;
};
