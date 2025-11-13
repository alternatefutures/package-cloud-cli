import type { AlternateFuturesSdk } from '@alternatefutures/sdk/node';
import { getFleekDefaultGatewayBySlug } from '@alternatefutures/utils-gateways';

import type { Output } from '../../../output/Output';
import { checkPeriodicallyUntil } from '../../../utils/checkPeriodicallyUntil';
import { t } from '../../../utils/translation';
import { returnDeploymentWhenFinished } from './returnDeploymentWhenFinished';

type WaitUntilDeploymentFinishedAndInformUserArgs = {
  sdk: AlternateFuturesSdk;
  deploymentId: string;
  siteId: string;
  slug: string;
  hostname?: string;
  hash: string;
  output: Output;
};

export const waitUntilDeploymentFinishedAndInformUser = async ({
  sdk,
  siteId,
  slug,
  hostname,
  deploymentId,
  hash,
  output,
}: WaitUntilDeploymentFinishedAndInformUserArgs) => {
  const deploymentStatus = await checkPeriodicallyUntil({
    conditionFn: returnDeploymentWhenFinished({ sdk, deploymentId }),
    period: 6_000,
    tries: 30,
  });

  if (!deploymentStatus) {
    output.warn(
      t('warnSubjectProcessIsLong', { subject: t('processOfDeployment') }),
    );
    output.printNewLine();

    output.log(
      `${t('commonWaitAndCheckStatusViaCmd', { subject: t('deploymentStatus') })}`,
    );
    output.log(output.textColor(`af sites deployments --id ${siteId}`, 'cyan'));

    return;
  }

  if (deploymentStatus === 'RELEASE_FAILED') {
    output.error(t('deployNotFinishTryAgain'));
    output.printNewLine();
    process.exit(1);
  }

  output.success(`${t('deployed')}!`);
  output.printNewLine();
  output.log(t('siteIPFSCid', { hash }));

  output.hint(`${t('visitViaGateway')}:`);
  output.link(
    hostname ? `https://${hostname}` : getFleekDefaultGatewayBySlug({ slug }),
  );
};
