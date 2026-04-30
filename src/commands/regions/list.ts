/**
 * Phase 46 — `af regions` command.
 *
 * Lists curated region buckets (us-east, us-west, eu, asia) with live
 * verified/online provider counts, recent-bid count, and median USD/hr
 * price for the user's GPU of interest. Drives both the picker UX in the
 * CLI and a "what's available right now" sanity check before deploying
 * with --region.
 *
 * For Phala, the server returns a single sentinel row; we print the
 * explicit single-region message instead of a table so the UX matches
 * the web picker swap.
 *
 * Output is intentionally flat-table (the same shape `af services list`
 * uses) for grep-ability. JSON output is on the table for a follow-up;
 * for now `--json` is not implemented but the underlying query is the
 * same the dashboard will consume.
 */

import chalk from 'chalk';

import { output } from '../../cli';
import { graphqlFetch } from '../../graphql/client';
import { REGIONS_QUERY } from '../../graphql/operations';

type ProviderArg = 'akash' | 'phala';

const VALID_PROVIDERS: ReadonlyArray<ProviderArg> = ['akash', 'phala'];

interface RegionMedianPrices {
  cpu1Core: number | null;
  h100: number | null;
  h200: number | null;
  rtx4090: number | null;
  a100: number | null;
}

type ConfidenceLevel = 'GREEN' | 'YELLOW' | 'RED';

interface Region {
  id: string;
  label: string;
  available: boolean;
  verifiedCount: number;
  onlineCount: number;
  recentBidCount: number;
  confidence: ConfidenceLevel;
  medianPrices: RegionMedianPrices;
}

const CONFIDENCE_DOT: Record<ConfidenceLevel, string> = {
  GREEN: chalk.green('●'),
  YELLOW: chalk.yellow('◐'),
  RED: chalk.red('⊘'),
};

function formatPrice(usdPerHour: number | null): string {
  if (usdPerHour === null || usdPerHour === undefined) return chalk.dim('—');
  // Three decimals shows useful resolution for cheap CPU buckets ($0.012/hr)
  // and isn't noisy for premium GPUs ($0.045/hr). Rounding floor 0.001 so
  // anything sub-tenth-cent shows as "<$0.001" rather than "$0.000".
  if (usdPerHour < 0.001) return chalk.dim('<$0.001');
  return `$${usdPerHour.toFixed(3)}`;
}

function pickPriceForDisplay(
  prices: RegionMedianPrices,
  gpuFlag?: string,
): { label: string; value: number | null } {
  if (gpuFlag) {
    const lower = gpuFlag.toLowerCase();
    const value = (prices as Record<string, number | null>)[lower] ?? null;
    return { label: lower.toUpperCase(), value };
  }
  // No GPU hint — show the cheapest available premium GPU price as the
  // "headline" number (most users care about GPU pricing); fall back to
  // CPU baseline if no GPU bids in the region.
  const candidates: Array<[string, number | null]> = [
    ['H100', prices.h100],
    ['H200', prices.h200],
    ['A100', prices.a100],
    ['RTX4090', prices.rtx4090],
    ['CPU/core', prices.cpu1Core],
  ];
  const firstWithValue = candidates.find(
    ([, v]) => v !== null && v !== undefined,
  );
  return firstWithValue
    ? { label: firstWithValue[0], value: firstWithValue[1] }
    : { label: 'CPU/core', value: null };
}

export const regionsListActionHandler = async (opts: {
  provider?: string;
  gpu?: string;
}): Promise<void> => {
  // Validate --provider against the small allowed set so a typo doesn't
  // hit the API only to come back as "Unsupported provider type: xkash".
  let providerArg: ProviderArg | undefined;
  if (opts.provider) {
    const lower = opts.provider.toLowerCase() as ProviderArg;
    if (!VALID_PROVIDERS.includes(lower)) {
      output.error(
        `Invalid --provider "${opts.provider}". Allowed: ${VALID_PROVIDERS.join(', ')}.`,
      );
      process.exit(1);
    }
    providerArg = lower;
  }

  const variables: Record<string, unknown> = {};
  if (providerArg) variables.provider = providerArg.toUpperCase();
  if (opts.gpu) variables.gpuModelHint = opts.gpu.toLowerCase();

  let regions: Region[];
  try {
    const { data } = await graphqlFetch<{ regions: Region[] }>(
      REGIONS_QUERY,
      variables,
    );
    regions = data?.regions ?? [];
  } catch (err) {
    output.error(
      err instanceof Error ? err.message : 'Failed to fetch regions',
    );
    process.exit(1);
  }

  // Phala sentinel — single row, swap to explicit message.
  if (regions.length === 1 && regions[0].id === 'phala-single-region') {
    output.printNewLine();
    output.log(
      chalk.bold('Phala Cloud') +
        chalk.dim(
          " — currently single-region. Region selection isn't available.",
        ),
    );
    output.printNewLine();
    return;
  }

  if (regions.length === 0) {
    output.log('No regions reported by the server.');
    return;
  }

  const headerPriceCol = opts.gpu
    ? `${opts.gpu.toUpperCase()} ($/hr)`
    : 'Median ($/hr)';

  const rows = regions.map((r) => {
    const dot = CONFIDENCE_DOT[r.confidence] ?? chalk.dim('?');
    const status = r.available
      ? chalk.green('available')
      : chalk.dim('no capacity');
    const priceInfo = pickPriceForDisplay(r.medianPrices, opts.gpu);
    return [
      r.id,
      `${dot} ${status}`,
      String(r.verifiedCount),
      String(r.onlineCount),
      String(r.recentBidCount),
      formatPrice(priceInfo.value) +
        (opts.gpu ? '' : chalk.dim(` (${priceInfo.label})`)),
    ];
  });

  output.printNewLine();
  output.styledTable(
    ['Region', 'Status', 'Verified', 'Online', 'Bids/24h', headerPriceCol],
    rows,
  );
  output.printNewLine();
  output.log(
    chalk.dim(
      'Use `af services deploy <id> --region <region>` to deploy in a specific region.',
    ),
  );
  output.log(
    chalk.dim(
      'Omit --region for "Any (cheapest globally)" — today\'s default behavior.',
    ),
  );
};
