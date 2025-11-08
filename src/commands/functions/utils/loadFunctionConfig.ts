import { loadConfiguration } from '../../../utils/configuration/loadConfiguration';
import type {
  AlternateFuturesFunctionConfig,
  RouteConfig,
} from '../../../utils/configuration/types';

type LoadFunctionConfigResult = {
  routes?: RouteConfig;
  functionConfig?: AlternateFuturesFunctionConfig;
};

/**
 * Loads function configuration from af.config.js/ts/json file
 * @param functionName - Optional function name to match in config
 * @returns Function config with routes if found
 */
export async function loadFunctionConfig(
  functionName?: string,
): Promise<LoadFunctionConfigResult> {
  try {
    const config = await loadConfiguration({});

    if (!config.functions || config.functions.length === 0) {
      return {};
    }

    // If function name provided, find matching function config
    if (functionName) {
      const functionConfig = config.functions.find(
        (fn) => fn.name === functionName,
      );

      if (functionConfig) {
        return {
          routes: functionConfig.routes,
          functionConfig,
        };
      }
    }

    // Otherwise, return the first function config if only one exists
    if (config.functions.length === 1) {
      const functionConfig = config.functions[0];
      return {
        routes: functionConfig.routes,
        functionConfig,
      };
    }

    // Multiple functions but no name specified
    return {};
  } catch (error) {
    // Config file not found or invalid - this is OK, routes are optional
    return {};
  }
}
