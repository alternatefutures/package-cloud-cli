import chalk from 'chalk';

import { output } from '../../cli';
import { ensureProject } from './helpers/ensureProject';
import { pickService } from './helpers/pickService';

export const infoServiceActionHandler = async (
  serviceId?: string,
  projectFlag?: string,
) => {
  try {
    const projectId = await ensureProject(projectFlag);
    const service = await pickService(projectId, serviceId);

    if (!service) return;

    const dep = service.activeAkashDeployment || service.activePhalaDeployment;
    const statusText = dep ? chalk.green('running') : chalk.dim('stopped');
    const kind = service.activePhalaDeployment
      ? 'Confidential'
      : service.activeAkashDeployment
        ? 'Standard'
        : '–';

    output.printNewLine();
    output.styledTable(
      ['Field', 'Value'],
      [
        [chalk.cyan('Name'), chalk.white(service.name)],
        [chalk.cyan('ID'), chalk.gray(service.id)],
        [chalk.cyan('Type'), chalk.white(service.type || '–')],
        [chalk.cyan('Slug'), chalk.gray(service.slug || '–')],
        [chalk.cyan('Compute'), chalk.white(kind)],
        [chalk.cyan('Status'), statusText],
        [chalk.cyan('Image'), chalk.gray(service.dockerImage || '–')],
        [
          chalk.cyan('Port'),
          service.containerPort
            ? chalk.white(String(service.containerPort))
            : chalk.dim('–'),
        ],
        [chalk.cyan('Template'), chalk.gray(service.templateId || '–')],
      ],
    );
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to get service info',
    );
    process.exit(1);
  }
};
