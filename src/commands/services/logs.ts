import { output } from '../../cli';
import { graphqlFetch } from '../../graphql/client';
import { GET_SERVICE_LOGS } from '../../graphql/operations';
import { ensureProject } from './helpers/ensureProject';
import { pickService } from './helpers/pickService';

export const logsServiceActionHandler = async (
  serviceId?: string,
  projectFlag?: string,
  tail = 50,
) => {
  try {
    const projectId = await ensureProject(projectFlag);
    const service = await pickService(projectId, serviceId);

    if (!service) return;

    output.spinner('Fetching logs...');

    const { data } = await graphqlFetch(GET_SERVICE_LOGS, {
      serviceId: service.id,
      tail,
    });

    const result = data?.serviceLogs;
    if (!result?.logs) {
      output.log(`No logs available for "${service.name}".`);
      return;
    }

    output.printNewLine();
    output.log(`Logs for ${service.name}:`);
    output.printNewLine();
    output.raw(result.logs);
    output.printNewLine();
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to fetch logs',
    );
    process.exit(1);
  }
};
