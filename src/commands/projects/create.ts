import { output } from '../../cli';
import { config } from '../../config';
import { loginGuard } from '../../guards/loginGuard';
import { graphqlFetch } from '../../graphql/client';
import { CREATE_PROJECT } from '../../graphql/operations';
import { t } from '../../utils/translation';
import { getProjectNameOrPrompt } from './prompts/getProjectNameOrPrompt';

type CreateProjectActionArgs = {
  name?: string;
};

type CreateProjectResponse = {
  createProject: { id: string; name: string; slug: string };
};

export const createProjectActionHandler = async (
  args: CreateProjectActionArgs = {},
) => {
  try {
    await loginGuard();

    const name = await getProjectNameOrPrompt({ name: args.name });

    output.spinner(`${t('projectCreating')}...`);

    const { data } = await graphqlFetch<CreateProjectResponse>(CREATE_PROJECT, {
      data: { name },
    });

    const project = data?.createProject;
    if (!project) {
      output.error('Failed to create project.');
      process.exit(1);
    }

    config.projectId.set(project.id);

    output.printNewLine();
    output.success(
      t('projectCreatedAndSwitched', { name, projectId: project.id }),
    );
    output.printNewLine();
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to create project',
    );
    process.exit(1);
  }
};
