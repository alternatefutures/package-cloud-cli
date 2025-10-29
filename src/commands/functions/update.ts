import { output } from '../../cli';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';
import { t } from '../../utils/translation';
import { getFunctionNameOrPrompt } from './prompts/getFunctionNameOrPrompt';
import { getFunctionOrPrompt } from './prompts/getFunctionOrPrompt';
import { getFunctionSlugOrPrompt } from './prompts/getFunctionSlugOrPrompt';
import { getFunctionStatusOrPrompt } from './prompts/getFunctionStatusOrPrompt';
import { parseRoutes, validateRoutes } from './utils/routeValidation';

type UpdateFunctionArgs = {
  functionName?: string;
  name?: string;
  slug?: string;
  status?: string;
  routes?: string;
};

const updateAction: SdkGuardedFunction<UpdateFunctionArgs> = async ({
  args,
  sdk,
}) => {
  if (!args.name && !args.slug && !args.status && !args.routes) {
    output.error(
      t('functionUpdateArgsNotValid', {
        param1: 'name',
        param2: 'slug',
        param3: 'status',
      }) + ' or routes'
    );

    return;
  }

  const name = args.name
    ? await getFunctionNameOrPrompt({ name: args.name })
    : undefined;
  const slug = args.slug
    ? await getFunctionSlugOrPrompt({ slug: args.slug })
    : undefined;
  const status = args.status
    ? await getFunctionStatusOrPrompt({ status: args.status })
    : undefined;

  // Parse and validate routes if provided
  let routes;
  if (args.routes) {
    try {
      routes = await parseRoutes(args.routes);
      const validation = validateRoutes(routes);
      if (!validation.valid) {
        output.error(`Invalid routes: ${validation.error}`);
        return;
      }
    } catch (error) {
      output.error(
        `Failed to parse routes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return;
    }
  }

  const afFunction = await getFunctionOrPrompt({
    name: args.functionName,
    sdk,
  });

  if (!afFunction) {
    output.error(t('expectedNotFoundGeneric', { name: 'function' }));

    return;
  }

  await sdk.functions().update({
    id: afFunction.id,
    slug,
    status,
    name,
    routes
  });

  output.printNewLine();
  output.success(
    t('commonItemActionSuccess', {
      subject: t('function'),
      action: t('updated'),
    }),
  );

  if (routes) {
    output.log(
      `Function updated with ${Object.keys(routes).length} route${Object.keys(routes).length === 1 ? '' : 's'}`
    );
  }

  output.printNewLine();
};

export const updateActionHandler = withGuards(updateAction, {
  scopes: {
    authenticated: true,
    project: true,
    site: false,
  },
});
