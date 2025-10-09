// TODO: rename this filename, fix typoe congifuration -> configuration
import type { AlternateFuturesSdk } from '@alternatefutures/sdk/node';

import { saveConfiguration } from '../../../utils/configuration/saveConfiguration';
import type { AlternateFuturesRootConfig } from '../../../utils/configuration/types';
import { t } from '../../../utils/translation';
import { enterDirectoryPathPrompt } from '../prompts/enterDirectoryPathPrompt';
import { selectConfigurationFormatPrompt } from '../prompts/selectConfigurationFormatPrompt';
import { chooseOrCreateSite } from './chooseOrCreateSite';
import { selectBuildCommandOrSkip } from './selectBuildCommandOrSkip';

type InitConfigurationArgs = {
  sdk: AlternateFuturesSdk;
};

export const initConfiguration = async ({ sdk }: InitConfigurationArgs) => {
  const site = await chooseOrCreateSite({ sdk });

  if (!site) {
    // TODO: Revise the initConfiguration
    console.error('Unexpected error');

    return;
  }

  const distDir = await enterDirectoryPathPrompt({
    message: t('specifyDistDirToSiteUpl'),
  });

  const buildCommand = await selectBuildCommandOrSkip();

  const config = {
    sites: [{ slug: site.slug, distDir, buildCommand }],
  } satisfies AlternateFuturesRootConfig;

  const format = await selectConfigurationFormatPrompt();

  await saveConfiguration({ config, format });

  return config;
};
