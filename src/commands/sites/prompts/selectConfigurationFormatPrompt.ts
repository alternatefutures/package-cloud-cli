import { selectPrompt } from '../../../prompts/selectPrompt';
import { getConfigFileByTypeValue } from '../../../utils/configuration';
import { t } from '../../../utils/translation';

import { AlternateFuturesSiteConfigFormats } from '../../../utils/configuration/types';

const choices = Object.keys(AlternateFuturesSiteConfigFormats).map((name) => {
  const value =
    AlternateFuturesSiteConfigFormats[
      name as keyof typeof AlternateFuturesSiteConfigFormats
    ];

  const configFile = getConfigFileByTypeValue(value);

  return {
    title: `${name} (${configFile})`,
    value,
  };
});

export const selectConfigurationFormatPrompt = async () =>
  selectPrompt<(typeof choices)[number]['value']>({
    message: `${t('selectFormatForSiteConf')}:`,
    choices,
  });
