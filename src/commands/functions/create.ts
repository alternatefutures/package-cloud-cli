// @ts-nocheck
import { output } from '../../cli';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';
import { t } from '../../utils/translation';
import { getFunctionNameOrPrompt } from './prompts/getFunctionNameOrPrompt';
import { isSiteIdValid } from './utils/isSiteIdValid';
import {
  type RouteConfig,
  parseRoutes,
  validateRoutes,
} from './utils/routeValidation';

type CreateFunctionArgs = {
  name?: string;
  siteId?: string;
  routes?: string;
};

const createAction: SdkGuardedFunction<CreateFunctionArgs> = async ({
  args,
  sdk,
}) => {
  const { name, siteId, routes: routesInput } = args;
  const functionName = await getFunctionNameOrPrompt({ name });

  if (siteId && !(await isSiteIdValid({ siteId: siteId as string, sdk }))) {
    output.error(t('siteNotFound'));
    return;
  }

  // Parse and validate routes if provided
  let routes: RouteConfig | undefined;
  if (routesInput) {
    try {
      routes = await parseRoutes(routesInput);
      const validation = validateRoutes(routes);
      if (!validation.valid) {
        output.error(`Invalid routes: ${validation.error}`);
        return;
      }
    } catch (error) {
      output.error(
        `Failed to parse routes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return;
    }
  }

  const newFunction = await sdk.functions().create({
    name: functionName,
    siteId: siteId as string,
    routes,
  });

  output.printNewLine();
  output.success(t('commonNameCreateSuccess', { name: 'function' }));
  output.printNewLine();

  if (routes) {
    output.log(
      `Function created with ${Object.keys(routes).length} route${Object.keys(routes).length === 1 ? '' : 's'}`,
    );
    output.printNewLine();
  }

  if (!newFunction.currentDeploymentId) {
    output.log(t('youCanDoXUsingFolCmd', { action: t('deployNewFunction') }));
    output.log('af functions deploy');
  }
};

export const createActionHandler = withGuards(createAction, {
  scopes: {
    authenticated: true,
    project: true,
    site: false,
  },
});
