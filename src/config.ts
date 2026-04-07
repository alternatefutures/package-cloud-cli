import Conf from 'conf';

import { secrets } from './secrets';

type ConfSchema = {
  personalAccessToken: string | undefined;
  projectId: string | undefined;
  organizationId: string | undefined;
};

const schema = {
  personalAccessToken: { type: 'string' },
  projectId: { type: 'string' },
  organizationId: { type: 'string' },
} as const;

const conf = new Conf<ConfSchema>({
  schema,
  projectName: 'alternate-futures',
  configName: 'global',
});

export const config = {
  personalAccessToken: {
    get: () => secrets.AF_TOKEN ?? conf.get('personalAccessToken'),
    set: (value: string) => conf.set('personalAccessToken', value),
    clear: () => conf.delete('personalAccessToken'),
  },
  projectId: {
    get: () => secrets.AF_PROJECT_ID ?? conf.get('projectId'),
    set: (value: string) => conf.set('projectId', value),
    clear: () => conf.delete('projectId'),
  },
  organizationId: {
    get: () => secrets.AF_ORG_ID ?? conf.get('organizationId'),
    set: (value: string) => conf.set('organizationId', value),
    clear: () => conf.delete('organizationId'),
  },
  clear: () => conf.clear(),
};
