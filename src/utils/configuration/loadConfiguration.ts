import { FleekConfigInvalidContentError } from '@alternatefutures/errors';
import { validateConfigurationWithResult } from '@alternatefutures/utils-validation';

import { readConfigurationFile } from './readConfigurationFile';
import type { AlternateFuturesRootConfig } from './types';

type LoadConfigurationArgs = {
  predefinedConfigPath?: string;
};

export const loadConfiguration = async ({
  predefinedConfigPath,
}: LoadConfigurationArgs): Promise<AlternateFuturesRootConfig> => {
  const { configuration, configPath } = await readConfigurationFile({
    predefinedConfigPath,
  });

  return validateConfigurationWithResult({ configuration }).catch(
    (error: Error) =>
      Promise.reject(
        new FleekConfigInvalidContentError({
          configPath,
          validationResult: error.message,
        }),
      ),
  );
};
