import type { Site } from '@alternatefutures/sdk/node';

import { saveConfiguration } from '../../../utils/configuration/saveConfiguration';
import type { AlternateFuturesRootConfig } from '../../../utils/configuration/types';
import { isValidAlternateFuturesConfigFormat } from '../../../utils/formats';
import { fileExists } from '../../../utils/fs';
import { t } from '../../../utils/translation';
import { enterDirectoryPathPrompt } from '../prompts/enterDirectoryPathPrompt';
import { selectConfigurationFormatPrompt } from '../prompts/selectConfigurationFormatPrompt';
import { selectBuildCommandOrSkip } from './selectBuildCommandOrSkip';

type InitConfigurationArgs = {
  site: Site;
  onUnexpectedFormatError: (format: string) => void;
  onSaveConfigurationError: () => void;
};

export const initConfiguration = async ({
  site,
  onUnexpectedFormatError,
  onSaveConfigurationError,
}: InitConfigurationArgs) => {
  const distDir = await enterDirectoryPathPrompt({
    message: t('specifyDistDirToSiteUpl'),
  });

  const buildCommand = await selectBuildCommandOrSkip();

  const config: AlternateFuturesRootConfig = {
    sites: [{ slug: site.slug, distDir, buildCommand }],
  };

  const format = await selectConfigurationFormatPrompt();

  if (!isValidAlternateFuturesConfigFormat(format)) {
    onUnexpectedFormatError(format);
  }

  const configFile = await saveConfiguration({ config, format });

  if (!configFile) {
    onSaveConfigurationError();

    return;
  }

  const isFile = await fileExists(configFile);

  if (!isFile) {
    onSaveConfigurationError();

    return;
  }

  return config;
};
