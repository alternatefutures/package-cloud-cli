import { output } from '../../cli';
import { config } from '../../config';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';

type LogsActionArgs = {
  service?: string;
  severity?: string;
  search?: string;
  hours?: string;
  limit?: string;
};

interface LogEntry {
  timestamp: string | Date;
  severityText: string;
  body: string;
}

const severityColors: Record<string, (text: string) => string> = {
  DEBUG: (text: string) => `\x1b[90m${text}\x1b[0m`, // gray
  INFO: (text: string) => `\x1b[36m${text}\x1b[0m`, // cyan
  WARN: (text: string) => `\x1b[33m${text}\x1b[0m`, // yellow
  ERROR: (text: string) => `\x1b[31m${text}\x1b[0m`, // red
};

const logsAction: SdkGuardedFunction<LogsActionArgs> = async ({
  sdk,
  args,
}) => {
  const projectId = config.projectId.get();

  if (!projectId) {
    output.error('No project selected. Use `af projects switch` to select a project.');
    return;
  }

  const hours = Number.parseInt(args.hours || '1', 10);
  const limit = Number.parseInt(args.limit || '50', 10);

  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

  output.spinner(`Fetching logs from the last ${hours} hour(s)...`);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs = await (sdk as any).observability().queryLogs({
      projectId,
      startTime,
      endTime,
      serviceName: args.service,
      severityText: args.severity,
      bodyContains: args.search,
      limit,
    }) as LogEntry[];

    output.stopSpinner();

    if (!logs || logs.length === 0) {
      output.warn('No logs found for the specified criteria');
      return;
    }

    output.printNewLine();
    output.log(`Found ${logs.length} log(s):`);
    output.printNewLine();

    // Display logs in a more readable format
    for (const log of logs) {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const severity = log.severityText || 'INFO';
      const colorFn = severityColors[severity] || ((t: string) => t);

      const prefix = `[${timestamp}] ${colorFn(`[${severity.padEnd(5)}]`)}`;
      const body =
        log.body.length > 100 ? `${log.body.substring(0, 100)}...` : log.body;

      output.raw(`${prefix} ${body}`);
      output.printNewLine();
    }

    output.printNewLine();

    // Show summary
    const severityCounts: Record<string, number> = {};
    for (const log of logs) {
      const severity = log.severityText || 'UNKNOWN';
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    }

    output.log('Summary:');
    for (const [severity, count] of Object.entries(severityCounts)) {
      output.log(`  ${severity}: ${count}`);
    }
    output.printNewLine();
  } catch (error) {
    output.stopSpinner();
    throw error;
  }
};

export const logsActionHandler = withGuards(logsAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});
