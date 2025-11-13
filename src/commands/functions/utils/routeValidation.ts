import type { RouteConfig } from '../../../utils/configuration/types';

export type { RouteConfig };

/**
 * Validates a route configuration object
 * Matches validation logic from backend
 */
export function validateRoutes(routes: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!routes) {
    return { valid: true };
  }

  // Check if routes is an object
  if (typeof routes !== 'object' || Array.isArray(routes)) {
    return {
      valid: false,
      error: 'Routes must be an object mapping path patterns to target URLs',
    };
  }

  const entries = Object.entries(routes);

  if (entries.length === 0) {
    return {
      valid: false,
      error: 'Routes object cannot be empty',
    };
  }

  for (const [pathPattern, targetUrl] of entries) {
    // Validate path pattern
    if (typeof pathPattern !== 'string' || !pathPattern.startsWith('/')) {
      return {
        valid: false,
        error: `Invalid path pattern "${pathPattern}". Path patterns must start with "/"`,
      };
    }

    // Validate target URL
    if (typeof targetUrl !== 'string') {
      return {
        valid: false,
        error: `Invalid target URL for path "${pathPattern}". Target must be a string`,
      };
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch (error) {
      return {
        valid: false,
        error: `Invalid target URL "${targetUrl}" for path "${pathPattern}". Must be a valid URL`,
      };
    }

    // Ensure URL has http or https protocol
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return {
        valid: false,
        error: `Invalid target URL "${targetUrl}" for path "${pathPattern}". Must use http:// or https:// protocol`,
      };
    }
  }

  return { valid: true };
}

/**
 * Parse routes from JSON string or file path
 */
export async function parseRoutes(routesInput: string): Promise<RouteConfig> {
  // Try parsing as JSON string first
  try {
    const routes = JSON.parse(routesInput);
    return routes;
  } catch (jsonError) {
    // If not valid JSON, try reading as file path
    try {
      const fs = await import('node:fs/promises');
      const fileContent = await fs.readFile(routesInput, 'utf-8');
      return JSON.parse(fileContent);
    } catch (fileError) {
      throw new Error(
        `Failed to parse routes. Expected JSON string or path to JSON file.\nJSON parse error: ${jsonError instanceof Error ? jsonError.message : 'Unknown'}\nFile read error: ${fileError instanceof Error ? fileError.message : 'Unknown'}`,
      );
    }
  }
}
