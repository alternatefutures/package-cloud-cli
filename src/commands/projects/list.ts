import chalk from 'chalk';

import { output } from '../../cli';
import { config } from '../../config';
import { graphqlFetch } from '../../graphql/client';
import { GET_SERVICE_REGISTRY, LIST_PROJECTS } from '../../graphql/operations';
import { loginGuard } from '../../guards/loginGuard';
import { Icons } from '../../output/Output';
import { t } from '../../utils/translation';

type ProjectRecord = { id: string; name: string; slug: string };

type ServiceRecord = {
  id: string;
  activeAkashDeployment: { id: string } | null;
  activePhalaDeployment: { id: string } | null;
};

const fetchServiceCounts = async (
  projectId: string,
): Promise<{ total: number; active: number }> => {
  try {
    const { data } = await graphqlFetch<{
      serviceRegistry: ServiceRecord[];
    }>(GET_SERVICE_REGISTRY, { projectId });
    const services = data?.serviceRegistry || [];
    const active = services.filter(
      (s) => s.activeAkashDeployment || s.activePhalaDeployment,
    ).length;
    return { total: services.length, active };
  } catch {
    return { total: 0, active: 0 };
  }
};

export const listProjectsActionHandler = async () => {
  try {
    await loginGuard();

    const { data } = await graphqlFetch<{
      projects: { data: ProjectRecord[] };
    }>(LIST_PROJECTS);

    const projects = data?.projects?.data || [];

    if (projects.length === 0) {
      output.log(t('noYYet', { name: t('projects') }));
      return;
    }

    const currentProjectId = config.projectId.get();

    const serviceCounts = await Promise.all(
      projects.map((p) => fetchServiceCounts(p.id)),
    );

    const rows = projects.map((project, i) => {
      const isCurrent = currentProjectId === project.id;
      const { total, active } = serviceCounts[i];
      const servicesText =
        total === 0
          ? chalk.dim('–')
          : `${chalk.white(String(total))} total, ${chalk.green(String(active))} active`;

      return [
        isCurrent ? chalk.bold.white(project.name) : chalk.white(project.name),
        chalk.gray(project.id),
        servicesText,
        isCurrent ? Icons.Checkmark : '',
      ];
    });

    output.styledTable(['Project Name', 'ID', 'Services', 'Selected'], rows);

    output.hint(`Run ${chalk.cyan('af projects switch')} to select a project`);
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to list projects',
    );
    process.exit(1);
  }
};
