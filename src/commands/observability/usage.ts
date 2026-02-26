import { output } from '../../cli';
import { config } from '../../config';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';

type UsageActionArgs = {
  days?: string;
};

interface TelemetryUsage {
  projectId: string;
  bytesIngested: string;
  bytesFormatted: string;
  spansCount: number;
  metricsCount: number;
  logsCount: number;
  costCents: number;
  costFormatted: string;
}

const usageAction: SdkGuardedFunction<UsageActionArgs> = async ({
  sdk,
  args,
}) => {
  const projectId = config.projectId.get();

  if (!projectId) {
    output.error(
      'No project selected. Use `af projects switch` to select a project.',
    );
    return;
  }

  const days = Number.parseInt(args.days || '30', 10);

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  output.spinner(`Fetching telemetry usage for the last ${days} day(s)...`);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usage = (await (sdk as any)
      .observability()
      .getUsage(projectId, startDate, endDate)) as TelemetryUsage;

    output.stopSpinner();

    output.printNewLine();
    output.log('Telemetry Usage Summary:');
    output.printNewLine();

    output.log(
      `  Period:         ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    );
    output.log(`  Project ID:     ${projectId}`);
    output.printNewLine();

    const tableData = [
      {
        Metric: 'Spans Ingested',
        Value: usage.spansCount.toLocaleString(),
      },
      {
        Metric: 'Metrics Ingested',
        Value: usage.metricsCount.toLocaleString(),
      },
      {
        Metric: 'Logs Ingested',
        Value: usage.logsCount.toLocaleString(),
      },
      {
        Metric: 'Total Data Ingested',
        Value: usage.bytesFormatted,
      },
      {
        Metric: 'Estimated Cost',
        Value: usage.costFormatted,
      },
    ];

    output.table(tableData);
    output.printNewLine();

    // Show pricing info
    output.log('Pricing: $0.35 per GB ingested');
    output.log(
      'View detailed billing at: https://app.alternatefutures.ai/billing',
    );
    output.printNewLine();
  } catch (error) {
    output.stopSpinner();
    throw error;
  }
};

export const usageActionHandler = withGuards(usageAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});
