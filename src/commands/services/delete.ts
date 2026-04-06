import { output } from '../../cli';
import { graphqlFetch } from '../../graphql/client';
import {
  CLOSE_AKASH_DEPLOYMENT,
  DELETE_SERVICE,
  STOP_PHALA_DEPLOYMENT,
} from '../../graphql/operations';
import { confirmPrompt } from '../../prompts/confirmPrompt';
import { ensureProject } from './helpers/ensureProject';
import { pickService } from './helpers/pickService';

export const deleteServiceActionHandler = async (
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
        `"${service.name}" has a running deployment. It must be closed before the service can be deleted.`,
      );
      output.printNewLine();

      const closeFirst = await confirmPrompt({
        message: 'Close the deployment first?',
        initial: true,
      });

      if (!closeFirst) {
        output.log('Cancelled.');
        return;
      }

      output.spinner('Closing deployment...');

      if (activeAkash) {
        await graphqlFetch(CLOSE_AKASH_DEPLOYMENT, { id: activeAkash.id });
      } else if (activePhala) {
        await graphqlFetch(STOP_PHALA_DEPLOYMENT, { id: activePhala.id });
      }

      output.success('Deployment closed.');
      output.printNewLine();
    }

    const confirmed = await confirmPrompt({
      message: `Are you sure you want to delete "${service.name}"?`,
      initial: false,
    });

    if (!confirmed) {
      output.log('Cancelled.');
      return;
    }

    output.spinner('Deleting service...');

    await graphqlFetch(DELETE_SERVICE, { id: service.id });

    output.printNewLine();
    output.success(`Service "${service.name}" deleted.`);
    output.printNewLine();
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to delete service',
    );
    process.exit(1);
  }
};
