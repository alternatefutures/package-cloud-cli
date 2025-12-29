import { output } from '../../cli';
import { config } from '../../config';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';

type TracesActionArgs = {
  service?: string;
  status?: string;
  minDuration?: string;
  hours?: string;
  limit?: string;
};

interface Trace {
  traceId: string;
  serviceName: string;
  durationMs: number;
  spanCount: number;
  hasError: boolean;
  startTime: string | Date;
  endTime: string | Date;
  spans: Span[];
}

interface Span {
  spanName: string;
  spanKind: string;
  durationMs: number;
  statusCode: string;
  serviceName: string;
}

const tracesAction: SdkGuardedFunction<TracesActionArgs> = async ({
  sdk,
  args,
}) => {
  const projectId = config.projectId.get();

  if (!projectId) {
    output.error('No project selected. Use `af projects switch` to select a project.');
    return;
  }

  const hours = Number.parseInt(args.hours || '1', 10);
  const limit = Number.parseInt(args.limit || '20', 10);
  const minDurationMs = args.minDuration
    ? Number.parseFloat(args.minDuration)
    : undefined;

  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

  output.spinner(`Fetching traces from the last ${hours} hour(s)...`);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traces = await (sdk as any).observability().queryTraces({
      projectId,
      startTime,
      endTime,
      serviceName: args.service,
      statusCode: args.status,
      minDurationMs,
      limit,
    }) as Trace[];

    output.stopSpinner();

    if (!traces || traces.length === 0) {
      output.warn('No traces found for the specified criteria');
      return;
    }

    output.printNewLine();
    output.log(`Found ${traces.length} trace(s):`);
    output.printNewLine();

    const tableData = traces.map((trace: Trace) => ({
      'Trace ID': trace.traceId.substring(0, 16) + '...',
      Service: trace.serviceName,
      Duration: `${trace.durationMs.toFixed(2)}ms`,
      Spans: trace.spanCount,
      Status: trace.hasError ? 'ERROR' : 'OK',
      Time: new Date(trace.startTime).toLocaleString(),
    }));

    output.table(tableData);
    output.printNewLine();
    output.log('Use `af observability trace <traceId>` to view trace details');
    output.printNewLine();
  } catch (error) {
    output.stopSpinner();
    throw error;
  }
};

type TraceActionArgs = {
  traceId: string;
};

const traceAction: SdkGuardedFunction<TraceActionArgs> = async ({
  sdk,
  args,
}) => {
  const projectId = config.projectId.get();

  if (!projectId) {
    output.error('No project selected. Use `af projects switch` to select a project.');
    return;
  }

  output.spinner(`Fetching trace ${args.traceId}...`);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trace = await (sdk as any).observability().getTrace(projectId, args.traceId) as Trace | null;

    output.stopSpinner();

    if (!trace) {
      output.warn(`Trace ${args.traceId} not found`);
      return;
    }

    output.printNewLine();
    output.log('Trace Details:');
    output.printNewLine();

    output.log(`  Trace ID:    ${trace.traceId}`);
    output.log(`  Service:     ${trace.serviceName}`);
    output.log(`  Duration:    ${trace.durationMs.toFixed(2)}ms`);
    output.log(`  Span Count:  ${trace.spanCount}`);
    output.log(`  Has Error:   ${trace.hasError ? 'Yes' : 'No'}`);
    output.log(`  Start Time:  ${new Date(trace.startTime).toLocaleString()}`);
    output.log(`  End Time:    ${new Date(trace.endTime).toLocaleString()}`);

    output.printNewLine();
    output.log('Spans:');
    output.printNewLine();

    const spanTableData = trace.spans.map((span: Span) => ({
      'Span Name': span.spanName.substring(0, 30),
      Kind: span.spanKind,
      Duration: `${span.durationMs.toFixed(2)}ms`,
      Status: span.statusCode,
      Service: span.serviceName,
    }));

    output.table(spanTableData);
    output.printNewLine();
  } catch (error) {
    output.stopSpinner();
    throw error;
  }
};

export const tracesActionHandler = withGuards(tracesAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});

export const traceActionHandler = withGuards(traceAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});
