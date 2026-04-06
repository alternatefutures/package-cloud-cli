import { config } from '../config.js';
import { getDefined } from '../defined.js';

export const AUTH_API_URL =
  process.env.AF_AUTH_API_URL ||
  getDefined('AUTH__API_URL') ||
  getDefined('SDK__AUTH_SERVICE_URL') ||
  'https://auth.alternatefutures.ai';

export async function authFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const token = config.personalAccessToken.get();

  if (!token) {
    throw new Error('Not authenticated. Run `af login` first.');
  }

  return fetch(`${AUTH_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}
