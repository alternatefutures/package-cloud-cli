import { AlternateFuturesSiteConfigFormats } from './configuration';

export const isValidAlternateFuturesConfigFormat = (
  format: AlternateFuturesSiteConfigFormats,
) => Object.values(AlternateFuturesSiteConfigFormats).includes(format);
