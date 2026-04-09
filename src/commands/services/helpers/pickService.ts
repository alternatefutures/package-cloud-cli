import chalk from 'chalk';

import { output } from '../../../cli';
import { graphqlFetch } from '../../../graphql/client';
import { GET_SERVICE_REGISTRY } from '../../../graphql/operations';
import { selectPrompt } from '../../../prompts/selectPrompt';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceRecord = Record<string, any>;

export const fetchServices = async (
  projectId: string,
): Promise<ServiceRecord[]> => {
  const { data } = await graphqlFetch(GET_SERVICE_REGISTRY, { projectId });
  return data?.serviceRegistry || [];
};

/**
 * If `serviceId` is given, find and return it.
 * Otherwise show a numbered pick list.
 */
export const pickService = async (
  projectId: string,
  serviceId?: string,
): Promise<ServiceRecord | null> => {
  const services = await fetchServices(projectId);

  if (services.length === 0) {
    output.log('No services in this project.');
    return null;
  }

  if (serviceId) {
    const match = services.find(
      (s) =>
        s.id === serviceId ||
        s.id.startsWith(serviceId) ||
        s.name === serviceId ||
        s.slug === serviceId,
    );
    if (!match) {
      output.error(`Service "${serviceId}" not found.`);
      return null;
    }
    return match;
  }

  const selectedId = await selectPrompt<string>({
    message: 'Select a service:',
    choices: services.map((s) => {
      const dep = s.activeAkashDeployment || s.activePhalaDeployment;
      const status = dep ? chalk.green(' (running)') : '';
      return {
        title: `${s.name}${status}`,
        value: s.id,
      };
    }),
  });

  return services.find((s) => s.id === selectedId) || null;
};
