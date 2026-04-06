import { output } from '../../cli';
import { graphqlFetch } from '../../graphql/client';
import {
  CLOSE_AKASH_DEPLOYMENT,
  STOP_PHALA_DEPLOYMENT,
} from '../../graphql/operations';
import { confirmPrompt } from '../../prompts/confirmPrompt';
import { ensureProject } from './helpers/ensureProject';
import { pickService } from './helpers/pickService';

export const closeServiceActionHandler = async (
  serviceId?: string,
  projectFlag?: string,
) => {
  try {
    const projectId = await ensureProject(projectFlag);
    const service = await pickService(projectId, serviceId);

    if (!service) return;

    const activeAkash = service.activeAkashDeployment;
    const activePhala = service.activePhalaDeployment;

    if (!activeAkash && !activePhala) {
      output.log(`"${service.name}" has no active deployment to close.`);
      return;
    }

    const confirmed = await confirmPrompt({
      message: `Close the deployment for "${service.name}"?`,
      initial: false,
    });

    if (!confirmed) {
      output.log('Cancelled.');
      return;
    }

    output.spinner('Closing deployment...');

    if (activeAkash) {
      const { data } = await graphqlFetch(CLOSE_AKASH_DEPLOYMENT, {
        id: activeAkash.id,
      });
      output.success(
        `Deployment closed. Status: ${data?.closeAkashDeployment?.status}`,
      );
    } else if (activePhala) {
      const { data } = await graphqlFetch(STOP_PHALA_DEPLOYMENT, {
        id: activePhala.id,
      });
      output.success(
        `Deployment closed. Status: ${data?.stopPhalaDeployment?.status}`,
      );
    }
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to close deployment',
    );
    process.exit(1);
  }
};
