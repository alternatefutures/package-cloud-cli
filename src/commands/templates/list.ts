import { output } from '../../cli';
import { graphqlFetch } from '../../graphql';
import { LIST_TEMPLATES } from '../../graphql/operations';

type ListTemplatesArgs = {
  category?: string;
};

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  dockerImage: string;
  serviceType: string;
};

type ListTemplatesResponse = {
  templates: Template[];
};

const listTemplatesAction = async ({ category }: ListTemplatesArgs) => {
  output.spinner('Fetching templates...');

  const variables: Record<string, unknown> = {};
  if (category) {
    variables.category = category;
  }

  const { data } = await graphqlFetch<ListTemplatesResponse>(
    LIST_TEMPLATES,
    variables,
  );

  if (!data?.templates?.length) {
    output.log(
      category
        ? `No templates found for category "${category}".`
        : 'No templates available.',
    );
    return;
  }

  output.table(
    data.templates.map((tmpl) => ({
      ID: tmpl.id,
      Name: tmpl.name,
      Category: tmpl.category,
      Description:
        tmpl.description.length > 50
          ? `${tmpl.description.slice(0, 47)}...`
          : tmpl.description,
    })),
  );
};

export const listTemplatesActionHandler = async (args: ListTemplatesArgs) => {
  try {
    await listTemplatesAction(args);
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to list templates',
    );
  }
};
