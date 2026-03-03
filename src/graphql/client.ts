import { config } from '../config.js';

const CLOUD_API_URL = process.env.AF_API_URL || 'https://api.alternatefutures.ai';

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

export async function graphqlFetch<T = any>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<T>> {
  const token = config.personalAccessToken.get();

  if (!token) {
    throw new Error('Not authenticated. Run `af login` first.');
  }

  const res = await fetch(`${CLOUD_API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(`GraphQL error: ${json.errors[0].message}`);
  }

  return json;
}
