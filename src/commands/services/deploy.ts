import chalk from 'chalk';

import { output } from '../../cli';
import { graphqlFetch } from '../../graphql/client';
import {
  CLOSE_AKASH_DEPLOYMENT,
  DEPLOY_TO_AKASH,
  STOP_PHALA_DEPLOYMENT,
} from '../../graphql/operations';
import { confirmPrompt } from '../../prompts/confirmPrompt';
import { ensureProject } from './helpers/ensureProject';
import { pickService } from './helpers/pickService';
import { pollDeploymentStatus } from './helpers/pollDeployment';

type DeploymentResult = {
  id: string;
  status: string;
  serviceId: string;
};

export const deployServiceActionHandler = async (
  serviceId?: string,
  projectFlag?: string,
) => {
  try {
    const projectId = await ensureProject(projectFlag);
    const service = await pickService(projectId, serviceId);

    if (!service) return;

    const activeAkash = service.activeAkashDeployment;
    const activePhala = service.activePhalaDeployment;
    const isRunning = activeAkash || activePhala;

    if (isRunning) {
      output.printNewLine();
      output.warn(
        `"${service.name}" is currently running. Redeploying will close the current deployment first.`,
      );
      output.printNewLine();

      const confirmed = await confirmPrompt({
        message: 'Continue with redeploy?',
        initial: true,
      });

      if (!confirmed) {
        output.log('Cancelled.');
        return;
      }

      output.spinner('Closing current deployment...');

      if (activeAkash) {
        await graphqlFetch(CLOSE_AKASH_DEPLOYMENT, { id: activeAkash.id });
      } else if (activePhala) {
        await graphqlFetch(STOP_PHALA_DEPLOYMENT, { id: activePhala.id });
      }

      output.success('Previous deployment closed.');
      output.printNewLine();
    }

    output.spinner('Creating new deployment...');

    const { data } = await graphqlFetch<{
      deployToAkash: DeploymentResult;
    }>(DEPLOY_TO_AKASH, {
      input: { serviceId: service.id },
    });

    const result = data?.deployToAkash;
    if (!result) {
      output.error('Deployment failed — no response from server.');
      return;
    }

    output.printNewLine();
    output.log(
      `Deploying ${chalk.bold(service.name)} ${chalk.dim(`(${result.id})`)}`,
    );
    output.printNewLine();

    await pollDeploymentStatus(result.id);
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to deploy service',
    );
    process.exit(1);
  }
};
