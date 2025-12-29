import type { Command } from 'commander';

import { logsActionHandler } from './logs';
import { servicesActionHandler } from './services';
import { settingsActionHandler, updateSettingsActionHandler } from './settings';
import { traceActionHandler, tracesActionHandler } from './traces';
import { usageActionHandler } from './usage';

export default (program: Command): Command => {
  const cmd = program
    .command('observability')
    .alias('obs')
    .description('Query and manage APM observability data (traces, logs, metrics)');

  cmd
    .command('traces')
    .description('List recent traces')
    .option('--service <name>', 'Filter by service name')
    .option('--status <code>', 'Filter by status (OK, ERROR, UNSET)')
    .option('--min-duration <ms>', 'Minimum duration in milliseconds')
    .option('--hours <number>', 'Look back N hours (default: 1)', '1')
    .option('--limit <number>', 'Maximum number of traces to return', '20')
    .action(
      (options: {
        service?: string;
        status?: string;
        minDuration?: string;
        hours?: string;
        limit?: string;
      }) => tracesActionHandler(options),
    );

  cmd
    .command('trace <traceId>')
    .description('Get details of a specific trace')
    .action((traceId: string) => traceActionHandler({ traceId }));

  cmd
    .command('logs')
    .description('Query logs')
    .option('--service <name>', 'Filter by service name')
    .option('--severity <level>', 'Filter by severity (DEBUG, INFO, WARN, ERROR)')
    .option('--search <text>', 'Search in log body')
    .option('--hours <number>', 'Look back N hours (default: 1)', '1')
    .option('--limit <number>', 'Maximum number of logs to return', '50')
    .action(
      (options: {
        service?: string;
        severity?: string;
        search?: string;
        hours?: string;
        limit?: string;
      }) => logsActionHandler(options),
    );

  cmd
    .command('services')
    .description('List services with performance statistics')
    .option('--hours <number>', 'Look back N hours (default: 24)', '24')
    .action((options: { hours?: string }) => servicesActionHandler(options));

  cmd
    .command('usage')
    .description('Show telemetry usage and cost for current billing period')
    .option('--days <number>', 'Look back N days (default: 30)', '30')
    .action((options: { days?: string }) => usageActionHandler(options));

  cmd
    .command('settings')
    .description('View observability settings for current project')
    .action(() => settingsActionHandler());

  cmd
    .command('settings:update')
    .description('Update observability settings')
    .option('--traces <boolean>', 'Enable or disable traces')
    .option('--metrics <boolean>', 'Enable or disable metrics')
    .option('--logs <boolean>', 'Enable or disable logs')
    .option('--sample-rate <rate>', 'Set sampling rate (0.0 to 1.0)')
    .option('--trace-retention <days>', 'Set trace retention in days')
    .option('--log-retention <days>', 'Set log retention in days')
    .action(
      (options: {
        traces?: string;
        metrics?: string;
        logs?: string;
        sampleRate?: string;
        traceRetention?: string;
        logRetention?: string;
      }) => updateSettingsActionHandler(options),
    );

  return cmd;
};
