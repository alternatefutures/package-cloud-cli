import chalk from 'chalk';

import { output } from '../../cli';
import { config } from '../../config';
import { graphqlFetch } from '../../graphql/client';
import { sdkGuard } from '../../guards/sdkGuard';
import type { SdkGuardedFunction } from '../../guards/types';
import { Icons } from '../../output/Output';
import { t } from '../../utils/translation';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const formatDate = (dateStr: string | Date) => {
  const d = new Date(
    typeof dateStr === 'string' ? dateStr : dateStr.toISOString(),
  );
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${day} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const SERVICE_COUNT_QUERY = `
  query ServiceRegistry($projectId: ID) {
    serviceRegistry(projectId: $projectId) {
      id
      activeAkashDeployment { id }
      activePhalaDeployment { id }
    }
  }
`;

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
    }>(SERVICE_COUNT_QUERY, { projectId });
    const services = data?.serviceRegistry || [];
    const active = services.filter(
      (s) => s.activeAkashDeployment || s.activePhalaDeployment,
    ).length;
    return { total: services.length, active };
  } catch {
    return { total: 0, active: 0 };
  }
};

export const listProjectsAction: SdkGuardedFunction<
  Record<string, never>
> = async ({ sdk }) => {
  const projects = await sdk.projects().list();

  if (projects.length === 0) {
    output.log(t('noYYet', { name: t('projects') }));

    return;
  }

  const currentProjectId = config.projectId.get();

  const serviceCounts = await Promise.all(
    projects.map((p) => fetchServiceCounts(p.id)),
  );

  const rows = projects.map(({ id, name, createdAt }, i) => {
    const isCurrent = currentProjectId === id;
    const { total, active } = serviceCounts[i];
    const servicesText =
      total === 0
        ? chalk.dim('–')
        : `${chalk.white(String(total))} total, ${chalk.green(String(active))} active`;

    return [
      isCurrent ? chalk.bold.white(name) : chalk.white(name),
      chalk.gray(id),
      servicesText,
      chalk.cyan(formatDate(createdAt)),
      isCurrent ? Icons.Checkmark : '',
    ];
  });

  output.styledTable(
    ['Project Name', 'ID', 'Services', 'Created', 'Selected'],
    rows,
  );

  output.hint(`Run ${chalk.cyan('af projects switch')} to select a project`);
};

export const listProjectsActionHandler = sdkGuard(listProjectsAction);
