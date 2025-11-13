import type { AlternateFuturesSdk } from '@alternatefutures/sdk/node';
import { isValidFolder } from '@alternatefutures/utils-validation';
import { output } from '../../../cli';
import { t } from '../../../utils/translation';

export const uploadFunctionAssets = async ({
  sdk,
  assetsPath,
  functionName,
}: {
  sdk: AlternateFuturesSdk;
  functionName: string;
  assetsPath?: string;
}): Promise<string | undefined> => {
  if (!assetsPath) {
    return;
  }

  if (!(await isValidFolder(assetsPath))) {
    output.error(t('assetsPathIsNotAFolder'));
    return;
  }

  try {
    output.spinner(t('uploadingAssets'));
    const result = await sdk.storage().uploadDirectory({
      path: assetsPath,
      options: {
        functionName,
      },
    });
    output.success(t('assetsUploadSuccess'));
    return result.pin.cid;
  } catch (error) {
    output.error(t('uploadAssetsFailed'));
    throw error;
  }
};
