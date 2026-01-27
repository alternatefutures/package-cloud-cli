import type { Output } from '../../output/Output';

import { t } from '../../utils/translation';

type ShowVerificationSessionLinkArgs = {
  output: Output;
  url: string;
};

export const showVerificationSessionLink = ({
  output,
  url,
}: ShowVerificationSessionLinkArgs) => {
  output.spinner(url);
  output.chore(t('followLinkToLogin'));
  output.link(url);
  output.printNewLine();
};
