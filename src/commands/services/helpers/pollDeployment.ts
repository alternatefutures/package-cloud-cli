import chalk from 'chalk';

import { output } from '../../../cli';
import { graphqlFetch } from '../../../graphql/client';
import { GET_AKASH_DEPLOYMENT } from '../../../graphql/operations';

type AkashDeploymentPoll = {
  id: string;
  status: string;
  dseq: string;
  provider: string | null;
  serviceUrls: Record<string, unknown> | null;
  errorMessage: string | null;
  retryCount: number;
};

const STEP_ORDER = [
  'CREATING',
  'WAITING_BIDS',
  'SELECTING_BID',
  'CREATING_LEASE',
  'SENDING_MANIFEST',
  'DEPLOYING',
  'ACTIVE',
] as const;

const STEP_LABELS: Record<string, string> = {
  CREATING: 'Creating deployment transaction',
  WAITING_BIDS: 'Waiting for provider bids',
  SELECTING_BID: 'Selecting best bid',
  CREATING_LEASE: 'Creating lease with provider',
  SENDING_MANIFEST: 'Sending deployment manifest',
  DEPLOYING: 'Container starting up',
  ACTIVE: 'Deployment is live',
};

const TERMINAL_STATUSES = new Set([
  'ACTIVE',
  'FAILED',
  'PERMANENTLY_FAILED',
  'CLOSED',
  'SUSPENDED',
]);

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

function renderProgress(currentStatus: string, errorMessage?: string | null) {
  const currentIdx = STEP_ORDER.indexOf(
    currentStatus as (typeof STEP_ORDER)[number],
  );
  const lines: string[] = [];

  for (let i = 0; i < STEP_ORDER.length; i++) {
    const step = STEP_ORDER[i];
    const label = STEP_LABELS[step] || step;
    const num = `${i + 1}/${STEP_ORDER.length}`;

    if (i < currentIdx) {
      lines.push(
        `  ${chalk.green('✓')} ${chalk.dim(label)} ${chalk.dim(`(${num})`)}`,
      );
    } else if (i === currentIdx) {
      if (currentStatus === 'ACTIVE') {
        lines.push(
          `  ${chalk.green('✓')} ${chalk.green.bold(label)} ${chalk.dim(`(${num})`)}`,
        );
      } else {
        lines.push(
          `  ${chalk.yellow('⠋')} ${chalk.white.bold(label)} ${chalk.dim(`(${num})`)}`,
        );
      }
    } else {
      lines.push(
        `  ${chalk.dim('○')} ${chalk.dim(label)} ${chalk.dim(`(${num})`)}`,
      );
    }
  }

  if (errorMessage) {
    lines.push('');
    lines.push(`  ${chalk.red('✗')} ${chalk.red(errorMessage)}`);
  }

  return lines.join('\n');
}

export async function pollDeploymentStatus(
  deploymentId: string,
): Promise<void> {
  const start = Date.now();
  let lastRendered = '';

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const { data } = await graphqlFetch<{
      akashDeployment: AkashDeploymentPoll | null;
    }>(GET_AKASH_DEPLOYMENT, { id: deploymentId });

    const dep = data?.akashDeployment;
    if (!dep) {
      output.error('Deployment not found during status check.');
      return;
    }

    const rendered = renderProgress(dep.status, dep.errorMessage);

    if (rendered !== lastRendered) {
      if (lastRendered) {
        const lineCount = lastRendered.split('\n').length;
        process.stdout.write(`\x1b[${lineCount}A\x1b[0J`);
      }
      process.stdout.write(rendered + '\n');
      lastRendered = rendered;
    }

    if (TERMINAL_STATUSES.has(dep.status)) {
      output.printNewLine();

      if (dep.status === 'ACTIVE') {
        output.success('Deployment is live!');

        if (dep.provider) {
          output.log(`Provider: ${dep.provider}`);
        }

        if (dep.serviceUrls) {
          const urls = Object.values(dep.serviceUrls).flat();
          if (urls.length > 0) {
            output.printNewLine();
            for (const url of urls) {
              if (typeof url === 'string') output.link(url);
            }
          }
        }
      } else if (
        dep.status === 'FAILED' ||
        dep.status === 'PERMANENTLY_FAILED'
      ) {
        output.error(
          `Deployment failed${dep.errorMessage ? `: ${dep.errorMessage}` : '.'}`,
        );

        if (dep.retryCount > 0) {
          output.log(`Retried ${dep.retryCount} time(s) before failing.`);
        }
      } else {
        output.log(`Deployment ended with status: ${dep.status}`);
      }

      output.printNewLine();
      output.log(`Deployment ID: ${dep.id}`);
      if (dep.dseq && dep.dseq !== '0') {
        output.log(`DSEQ:          ${dep.dseq}`);
      }
      return;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  output.printNewLine();
  output.warn(
    'Timed out waiting for deployment to complete. It may still be in progress.',
  );
  output.hint('Check status with: af services list');
}
