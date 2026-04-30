import chalk from 'chalk';

import { output } from '../../cli';
import { graphqlFetch } from '../../graphql/client';
import {
  CLOSE_AKASH_DEPLOYMENT,
  DEPLOY_TO_AKASH,
  REGIONS_QUERY,
  STOP_PHALA_DEPLOYMENT,
} from '../../graphql/operations';
import { confirmPrompt } from '../../prompts/confirmPrompt';
import { ensureProject } from './helpers/ensureProject';
import { pickService } from './helpers/pickService';
import { pollDeploymentStatus } from './helpers/pollDeployment';

type DeploymentResult = {
  id: string;
  status: string;
  serviceId: string;
  region?: string | null;
};

// Phase 46 — curated region buckets the CLI accepts. Mirrors the
// server-side `isRegionId()` check; we validate locally first so a typo
// fails fast with a useful message instead of round-tripping to the API.
const VALID_REGIONS: ReadonlyArray<string> = [
  'us-east',
  'us-west',
  'eu',
  'asia',
];

interface RegionAvailabilityRow {
  id: string;
  label: string;
  available: boolean;
  verifiedCount: number;
  recentBidCount: number;
}

/**
 * Fetch the regions list (Akash) for the soft-fail interstitial. Returns
 * an empty array on any error — the user-facing copy degrades gracefully
 * to "try a different region or omit --region" without blocking on a
 * network call.
 */
async function fetchRegionAlternatives(
  excludeId: string,
): Promise<RegionAvailabilityRow[]> {
  try {
    const { data } = await graphqlFetch<{ regions: RegionAvailabilityRow[] }>(
      REGIONS_QUERY,
      { provider: 'AKASH' },
    );
    const all = data?.regions ?? [];
    return all
      .filter((r) => r.id !== excludeId && r.available)
      .sort((a, b) => b.verifiedCount - a.verifiedCount);
  } catch {
    return [];
  }
}

export const deployServiceActionHandler = async (
  serviceId?: string,
  projectFlag?: string,
  options?: { region?: string },
) => {
  try {
    const projectId = await ensureProject(projectFlag);
    const service = await pickService(projectId, serviceId);

    if (!service) return;

    // Validate --region locally before doing anything else. Empty/null
    // means "Any (cheapest globally)" — the legacy default behavior.
    let region: string | undefined;
    if (options?.region) {
      const lower = options.region.toLowerCase();
      if (!VALID_REGIONS.includes(lower)) {
        output.error(
          `Invalid --region "${options.region}". Allowed: ${VALID_REGIONS.join(', ')}.`,
        );
        process.exit(1);
      }
      region = lower;
    }

    const activeAkash = service.activeAkashDeployment;
    const activePhala = service.activePhalaDeployment;
    const isRunning = activeAkash || activePhala;

    if (isRunning) {
      output.printNewLine();
      output.warn(
        `"${service.name}" is currently running. Redeploying will close the current deployment first.`,
      );
      output.printNewLine();

      const confirmed = await confirmPrompt({
        message: 'Continue with redeploy?',
        initial: true,
      });

      if (!confirmed) {
        output.log('Cancelled.');
        return;
      }

      output.spinner('Closing current deployment...');

      if (activeAkash) {
        await graphqlFetch(CLOSE_AKASH_DEPLOYMENT, { id: activeAkash.id });
      } else if (activePhala) {
        await graphqlFetch(STOP_PHALA_DEPLOYMENT, { id: activePhala.id });
      }

      output.success('Previous deployment closed.');
      output.printNewLine();
    }

    output.spinner(
      region
        ? `Creating new deployment in ${chalk.bold(region)}...`
        : 'Creating new deployment...',
    );

    const deployInput: Record<string, unknown> = { serviceId: service.id };
    if (region) deployInput.region = region;

    const { data } = await graphqlFetch<{
      deployToAkash: DeploymentResult;
    }>(DEPLOY_TO_AKASH, { input: deployInput });

    const result = data?.deployToAkash;
    if (!result) {
      output.error('Deployment failed — no response from server.');
      return;
    }

    output.printNewLine();
    output.log(
      `Deploying ${chalk.bold(service.name)} ${chalk.dim(`(${result.id})`)}${region ? chalk.dim(` in ${region}`) : ''}`,
    );
    output.printNewLine();

    const finalStatus = await pollDeploymentStatus(result.id);

    // Phase 46 — soft-fail interstitial. Strict region selection that
    // returned no bids ends in AWAITING_REGION_RESPONSE (NOT FAILED).
    // Surface alternatives + the exact retry commands so the user
    // doesn't have to re-discover them from docs.
    if (finalStatus === 'AWAITING_REGION_RESPONSE' && region) {
      output.printNewLine();
      output.warn(
        `No providers in ${chalk.bold(region)} responded with a bid in the polling window.`,
      );
      output.log(
        chalk.dim(
          'This is not a deployment failure — providers in this region may be at capacity.',
        ),
      );
      output.printNewLine();

      const alternatives = await fetchRegionAlternatives(region);
      if (alternatives.length > 0) {
        output.log(chalk.bold('Available alternatives:'));
        for (const alt of alternatives.slice(0, 3)) {
          output.log(
            `  ${chalk.green('•')} ${chalk.bold(alt.label)} — ` +
              `${alt.verifiedCount} verified, ${alt.recentBidCount} recent bids`,
          );
          output.log(
            chalk.dim(
              `      af services deploy ${service.id} --region ${alt.id}`,
            ),
          );
        }
        output.printNewLine();
      }

      output.log(
        chalk.dim(
          'Or skip the region constraint entirely (cheapest globally):',
        ),
      );
      output.log(chalk.dim(`      af services deploy ${service.id}`));
      output.printNewLine();
      output.log(
        chalk.dim(
          'The original deployment row will be auto-cancelled after 5 minutes.',
        ),
      );
      // Non-zero exit so scripts can detect the soft-fail state and react.
      process.exit(2);
    }
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to deploy service',
    );
    process.exit(1);
  }
};
