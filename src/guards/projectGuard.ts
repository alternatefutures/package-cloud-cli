import { output } from '../cli';
import { switchProjectActionHandler } from '../commands/projects/switch';
import { config } from '../config';
import { t } from '../utils/translation';

export const projectGuard = async () => {
  const projectId = config.projectId.get();

  if (projectId) {
    return;
  }

  output.warn(t('projectSelectRequiredStarPrjFlow'));
  output.printNewLine();

  await switchProjectActionHandler();
};
