import chalk from 'chalk';

import { output } from '../../cli';
import { ensureProject } from './helpers/ensureProject';
import { fetchServices } from './helpers/pickService';

export const listServicesActionHandler = async (projectFlag?: string) => {
  try {
    const projectId = await ensureProject(projectFlag);
    const services = await fetchServices(projectId);

    if (!services.length) {
      output.log(
        'No services in this project. Create one with `af services create`.',
      );
      return;
    }

    const rows = services.map((s) => {
      const dep = s.activeAkashDeployment || s.activePhalaDeployment;
      const statusText = dep
        ? chalk.green('● running')
        : chalk.dim('○ stopped');
      const kind = s.activePhalaDeployment
        ? 'Confidential'
        : s.activeAkashDeployment
          ? 'Standard'
          : chalk.dim('–');

      return [
        chalk.white(s.name),
        chalk.gray(s.type || '–'),
        kind,
        statusText,
        chalk.gray(s.id.slice(0, 8)),
      ];
    });

    output.styledTable(['Name', 'Type', 'Compute', 'Status', 'ID'], rows);
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to list services',
    );
    process.exit(1);
  }
};
