import { constants, promises as fs } from 'node:fs';
import { join as joinPath } from 'node:path';
import { FleekConfigMissingFileError } from '@alternatefutures/errors';
import {
  type AlternateFuturesSiteConfigFormatValue,
  AlternateFuturesSiteConfigFormats,
} from './types';

type GetConfigurationPathArgs = {
  predefinedConfigPath?: string;
};

export const getConfigurationPath = async ({
  predefinedConfigPath,
}: GetConfigurationPathArgs) => {
  if (predefinedConfigPath) {
    const absolutePath = joinPath(process.cwd(), predefinedConfigPath);

    return fs
      .access(absolutePath, constants.R_OK)
      .then(() => absolutePath)
      .catch(() =>
        Promise.reject(
          new FleekConfigMissingFileError({ configPath: predefinedConfigPath }),
        ),
      );
  }

  // Sorted by priority, we return only the first match
  const supposedFilenames = ['af.config.ts', 'af.config.js', 'af.config.json'];

  for (const supposedFilename of supposedFilenames) {
    const absolutePath = joinPath(process.cwd(), supposedFilename);

    const isSupposedFileAccessible = await fs
      .access(absolutePath, constants.R_OK)
      .then(() => true)
      .catch(() => false);

    if (isSupposedFileAccessible) {
      return absolutePath;
    }
  }

  throw new FleekConfigMissingFileError({});
};

const AF_CONFIG_BASENAME = 'af.config';
export const AF_CONFIG_TMPL_JSON_PLACEHOLDER = '$jsonContent';

export const getConfigFileByTypeName = (
  name: keyof typeof AlternateFuturesSiteConfigFormats,
) => `${AF_CONFIG_BASENAME}.${AlternateFuturesSiteConfigFormats[name]}`;

export const getConfigFileByTypeValue = (
  val: AlternateFuturesSiteConfigFormatValue,
) => `${AF_CONFIG_BASENAME}.${val}`;

export const getConfigTemplateByTypeName = (
  name: keyof typeof AlternateFuturesSiteConfigFormats,
) => `${getConfigFileByTypeName(name)}.tmpl`;
