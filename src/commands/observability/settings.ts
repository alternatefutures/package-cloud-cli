import { output } from '../../cli';
import { config } from '../../config';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';

interface ObservabilitySettings {
  tracesEnabled: boolean;
  metricsEnabled: boolean;
  logsEnabled: boolean;
  sampleRate: number;
  traceRetention: number;
  metricRetention: number;
  logRetention: number;
  maxBytesPerHour?: string | null;
}

const settingsAction: SdkGuardedFunction = async ({ sdk }) => {
  const projectId = config.projectId.get();

  if (!projectId) {
    output.error('No project selected. Use `af projects switch` to select a project.');
    return;
  }

  output.spinner('Fetching observability settings...');

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = await (sdk as any).observability().getSettings(projectId) as ObservabilitySettings | null;

    output.stopSpinner();

    if (!settings) {
      output.warn('No observability settings found for this project');
      output.printNewLine();
      output.log('Observability will use default settings:');
      output.log('  - Traces: Enabled');
      output.log('  - Metrics: Enabled');
      output.log('  - Logs: Enabled');
      output.log('  - Sample Rate: 100%');
      output.log('  - Trace Retention: 7 days');
      output.log('  - Metric Retention: 30 days');
      output.log('  - Log Retention: 7 days');
      return;
    }

    output.printNewLine();
    output.log('Observability Settings:');
    output.printNewLine();

    const tableData = [
      {
        Setting: 'Traces Enabled',
        Value: settings.tracesEnabled ? 'Yes' : 'No',
      },
      {
        Setting: 'Metrics Enabled',
        Value: settings.metricsEnabled ? 'Yes' : 'No',
      },
      {
        Setting: 'Logs Enabled',
        Value: settings.logsEnabled ? 'Yes' : 'No',
      },
      {
        Setting: 'Sample Rate',
        Value: `${(settings.sampleRate * 100).toFixed(0)}%`,
      },
      {
        Setting: 'Trace Retention',
        Value: `${settings.traceRetention} days`,
      },
      {
        Setting: 'Metric Retention',
        Value: `${settings.metricRetention} days`,
      },
      {
        Setting: 'Log Retention',
        Value: `${settings.logRetention} days`,
      },
      {
        Setting: 'Max Bytes/Hour',
        Value: settings.maxBytesPerHour || 'Unlimited',
      },
    ];

    output.table(tableData);
    output.printNewLine();

    output.log('Use `af observability settings:update` to modify these settings');
    output.printNewLine();
  } catch (error) {
    output.stopSpinner();
    throw error;
  }
};

type UpdateSettingsActionArgs = {
  traces?: string;
  metrics?: string;
  logs?: string;
  sampleRate?: string;
  traceRetention?: string;
  logRetention?: string;
};

const updateSettingsAction: SdkGuardedFunction<UpdateSettingsActionArgs> =
  async ({ sdk, args }) => {
    const projectId = config.projectId.get();

    if (!projectId) {
      output.error('No project selected. Use `af projects switch` to select a project.');
      return;
    }

    // Parse boolean strings
    const parseBoolean = (value: string | undefined): boolean | undefined => {
      if (value === undefined) return undefined;
      return value.toLowerCase() === 'true';
    };

    const updates: Record<string, boolean | number | undefined> = {};

    if (args.traces !== undefined) {
      updates.tracesEnabled = parseBoolean(args.traces);
    }
    if (args.metrics !== undefined) {
      updates.metricsEnabled = parseBoolean(args.metrics);
    }
    if (args.logs !== undefined) {
      updates.logsEnabled = parseBoolean(args.logs);
    }
    if (args.sampleRate !== undefined) {
      const rate = Number.parseFloat(args.sampleRate);
      if (rate < 0 || rate > 1) {
        output.error('Sample rate must be between 0.0 and 1.0');
        return;
      }
      updates.sampleRate = rate;
    }
    if (args.traceRetention !== undefined) {
      updates.traceRetention = Number.parseInt(args.traceRetention, 10);
    }
    if (args.logRetention !== undefined) {
      updates.logRetention = Number.parseInt(args.logRetention, 10);
    }

    if (Object.keys(updates).length === 0) {
      output.warn('No settings to update. Use --help to see available options.');
      return;
    }

    output.spinner('Updating observability settings...');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settings = await (sdk as any)
        .observability()
        .updateSettings(projectId, updates) as ObservabilitySettings;

      output.stopSpinner();

      output.printNewLine();
      output.success('Observability settings updated successfully!');
      output.printNewLine();

      output.log('New settings:');
      output.log(`  Traces Enabled:    ${settings.tracesEnabled ? 'Yes' : 'No'}`);
      output.log(`  Metrics Enabled:   ${settings.metricsEnabled ? 'Yes' : 'No'}`);
      output.log(`  Logs Enabled:      ${settings.logsEnabled ? 'Yes' : 'No'}`);
      output.log(`  Sample Rate:       ${(settings.sampleRate * 100).toFixed(0)}%`);
      output.log(`  Trace Retention:   ${settings.traceRetention} days`);
      output.log(`  Log Retention:     ${settings.logRetention} days`);
      output.printNewLine();
    } catch (error) {
      output.stopSpinner();
      throw error;
    }
  };

export const settingsActionHandler = withGuards(settingsAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});

export const updateSettingsActionHandler = withGuards(updateSettingsAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});
