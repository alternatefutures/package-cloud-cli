import chalk from 'chalk';

import { output } from '../../cli';
import { config } from '../../config';
import { loginGuard } from '../../guards/loginGuard';
import { graphqlFetch } from '../../graphql/client';
import { DELETE_PROJECT } from '../../graphql/operations';
import { confirmPrompt } from '../../prompts/confirmPrompt';
import { getProjectOrPrompt } from './prompts/getProjectOrPrompt';

export const deleteProjectActionHandler = async (id?: string) => {
  try {
    await loginGuard();

    const project = await getProjectOrPrompt({ id });

    if (!project) {
      output.error('No projects found.');
      process.exit(1);
    }

    output.printNewLine();
    output.warn(
      `You are about to delete ${chalk.bold(project.name)}. This will remove all services and deployments inside it.`,
    );
    output.printNewLine();

    const confirmed = await confirmPrompt({
      message: `Are you sure you want to delete "${project.name}"?`,
      initial: false,
    });

    if (!confirmed) {
      output.log('Cancelled.');
      return;
    }

    output.spinner('Deleting project...');

    await graphqlFetch(DELETE_PROJECT, { id: project.id });

    const currentProjectId = config.projectId.get();
    if (currentProjectId === project.id) {
      config.projectId.clear();
    }

    output.printNewLine();
    output.success(`Project "${project.name}" deleted.`);
    output.printNewLine();
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to delete project',
    );
    process.exit(1);
  }
};
