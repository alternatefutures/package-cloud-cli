import { output } from '../../../cli';
import { config } from '../../../config';
import { loginGuard } from '../../../guards/loginGuard';
import { graphqlFetch } from '../../../graphql/client';
import { LIST_PROJECTS } from '../../../graphql/operations';
import { selectPrompt } from '../../../prompts/selectPrompt';
import { createProjectActionHandler } from '../../projects/create';

type Project = { id: string; name: string; slug: string };

/**
 * Resolve which project to operate on.
 * Priority: explicit -p flag > saved project ID > interactive prompt.
 */
export const ensureProject = async (
  projectFlag?: string,
): Promise<string> => {
  await loginGuard();

  if (projectFlag) {
    const { data } = await graphqlFetch<{
      projects: { data: Project[] };
    }>(LIST_PROJECTS);
    const projects = data?.projects?.data || [];
    const match = projects.find(
      (p) => p.id === projectFlag || p.name === projectFlag || p.slug === projectFlag,
    );
    if (!match) {
      output.error(`Project "${projectFlag}" not found.`);
      process.exit(1);
    }
    return match.id;
  }

  const savedId = config.projectId.get();
  if (savedId) return savedId;

  const { data } = await graphqlFetch<{
    projects: { data: Project[] };
  }>(LIST_PROJECTS);
  const projects = data?.projects?.data || [];

  if (projects.length === 0) {
    output.log('No projects yet. Let\'s create one.');
    output.printNewLine();
    await createProjectActionHandler();
    const newId = config.projectId.get();
    if (!newId) {
      output.error('No project selected.');
      process.exit(1);
    }
    return newId;
  }

  const projectId = await selectPrompt<string>({
    message: 'Select a project:',
    choices: projects.map((p) => ({
      title: p.name,
      value: p.id,
    })),
  });

  config.projectId.set(projectId);
  return projectId;
};
