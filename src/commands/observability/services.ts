import { output } from '../../cli';
import { config } from '../../config';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';

type ServicesActionArgs = {
  hours?: string;
};

interface ServiceStats {
  serviceName: string;
  traceCount: number;
  spanCount: number;
  errorCount: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
}

const servicesAction: SdkGuardedFunction<ServicesActionArgs> = async ({
  sdk,
  args,
}) => {
  const projectId = config.projectId.get();

  if (!projectId) {
    output.error('No project selected. Use `af projects switch` to select a project.');
    return;
  }

  const hours = Number.parseInt(args.hours || '24', 10);

  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

  output.spinner(`Fetching service statistics for the last ${hours} hour(s)...`);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const services = await (sdk as any)
      .observability()
      .getServices(projectId, startTime, endTime) as ServiceStats[];

    output.stopSpinner();

    if (!services || services.length === 0) {
      output.warn('No services found with telemetry data');
      output.printNewLine();
      output.log('Make sure your application is sending traces to AlternateFutures.');
      output.log('See: https://docs.alternatefutures.ai/observability/setup');
      return;
    }

    output.printNewLine();
    output.log(`Found ${services.length} service(s) with telemetry data:`);
    output.printNewLine();

    const tableData = services.map((service: ServiceStats) => ({
      Service: service.serviceName,
      Traces: service.traceCount.toLocaleString(),
      Spans: service.spanCount.toLocaleString(),
      Errors: service.errorCount.toLocaleString(),
      'Error Rate': `${((service.errorCount / service.spanCount) * 100).toFixed(1)}%`,
      'Avg (ms)': service.avgDurationMs.toFixed(2),
      'P50 (ms)': service.p50DurationMs.toFixed(2),
      'P95 (ms)': service.p95DurationMs.toFixed(2),
      'P99 (ms)': service.p99DurationMs.toFixed(2),
    }));

    output.table(tableData);
    output.printNewLine();

    // Calculate totals
    const totalSpans = services.reduce((sum: number, s: ServiceStats) => sum + s.spanCount, 0);
    const totalErrors = services.reduce((sum: number, s: ServiceStats) => sum + s.errorCount, 0);
    const totalTraces = services.reduce((sum: number, s: ServiceStats) => sum + s.traceCount, 0);

    output.log('Totals:');
    output.log(`  Services: ${services.length}`);
    output.log(`  Traces:   ${totalTraces.toLocaleString()}`);
    output.log(`  Spans:    ${totalSpans.toLocaleString()}`);
    output.log(`  Errors:   ${totalErrors.toLocaleString()}`);
    if (totalSpans > 0) {
      output.log(
        `  Error Rate: ${((totalErrors / totalSpans) * 100).toFixed(2)}%`,
      );
    }
    output.printNewLine();
  } catch (error) {
    output.stopSpinner();
    throw error;
  }
};

export const servicesActionHandler = withGuards(servicesAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});
