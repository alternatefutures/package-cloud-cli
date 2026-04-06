import chalk from 'chalk';

import { output } from '../../cli';
import { graphqlFetch } from '../../graphql/client';
import { UPDATE_PROJECT } from '../../graphql/operations';
import { loginGuard } from '../../guards/loginGuard';
import { confirmPrompt } from '../../prompts/confirmPrompt';
import { textPrompt } from '../../prompts/textPrompt';
import { getProjectOrPrompt } from './prompts/getProjectOrPrompt';

type UpdateProjectResponse = {
  updateProject: { id: string; name: string; slug: string };
};

export const updateProjectActionHandler = async (id?: string) => {
  try {
    await loginGuard();

    const project = await getProjectOrPrompt({ id });

    if (!project) {
      output.error(
        'No projects found. Create one first with `af projects create`.',
      );
      process.exit(1);
    }

    output.printNewLine();
    output.log(`Current name: ${chalk.bold(project.name)}`);
    output.printNewLine();

    const newName = await textPrompt({
      message: 'New project name:',
      initial: project.name,
    });

    if (newName === project.name) {
      output.log('Name unchanged. Nothing to update.');
      return;
    }

    const confirmed = await confirmPrompt({
      message: `Rename "${project.name}" to "${newName}"?`,
      initial: true,
    });

    if (!confirmed) {
      output.log('Cancelled.');
      return;
    }

    output.spinner('Updating project...');

    const { data } = await graphqlFetch<UpdateProjectResponse>(UPDATE_PROJECT, {
      id: project.id,
      data: { name: newName },
    });

    const updated = data?.updateProject;
    if (!updated) {
      output.error('Failed to update project.');
      process.exit(1);
    }

    output.printNewLine();
    output.success(`Project renamed to "${updated.name}".`);
    output.printNewLine();
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to update project',
    );
    process.exit(1);
  }
};
