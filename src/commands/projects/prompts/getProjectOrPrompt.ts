import { graphqlFetch } from '../../../graphql/client';
import { LIST_PROJECTS } from '../../../graphql/operations';
import { selectPrompt } from '../../../prompts/selectPrompt';
import { t } from '../../../utils/translation';

type Project = { id: string; name: string; slug: string };

type GetProjectOrPromptArgs = {
  id?: string;
};

export const getProjectOrPrompt = async ({
  id,
}: GetProjectOrPromptArgs): Promise<Project | undefined> => {
  const { data } = await graphqlFetch<{
    projects: { data: Project[] };
  }>(LIST_PROJECTS);

  const projects = data?.projects?.data || [];

  if (id) {
    return projects.find((p) => p.id === id);
  }

  if (projects.length === 0) {
    return undefined;
  }

  const projectId = await selectPrompt({
    message: `${t('commonSelectXFromList', { subject: t('aProject') })}:`,
    choices: projects.map((project) => ({
      title: project.name,
      value: project.id,
    })),
  });

  return projects.find((project) => project.id === projectId);
};
