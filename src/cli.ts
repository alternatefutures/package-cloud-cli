import { MissingExpectedDataError } from '@alternatefutures/errors';
import { Command, Help } from 'commander';

import cmdBilling from './commands/billing/index';
import cmdDeployments from './commands/deployments/index';
import cmdPAT from './commands/pat/index';
import cmdProjects from './commands/projects/index';
import cmdRegions from './commands/regions/index';
import cmdServices from './commands/services/index';
import cmdSSH from './commands/ssh/index';
import cmdTemplates from './commands/templates/index';

import { loginActionHandler } from './commands/auth/login';
import { emailLoginActionHandler } from './commands/auth/loginEmail';
import { logoutActionHandler } from './commands/auth/logout';
import { getDefined } from './defined';
import { Output } from './output/Output';
import { t } from './utils/translation';

export type { AlternateFuturesConfig } from './utils/configuration/types';

const isDebugging = process.argv.includes('--debug');
export const output = new Output({
  stream: process.stdout,
  debug: isDebugging,
});

type InitArgs = {
  version: string;
  parser: (program: Command) => void;
};

const logo = `
    ___    ____                        __       
   /   |  / / /____  _________  ____ _/ /____   
  / /| | / / __/ _ \\/ ___/ __ \\/ __ \`/ __/ _ \\  
 / ___ |/ / /_/  __/ /  / / / / /_/ / /_/  __/  
/_/  |_/_/\\__/\\___/_/  /_/ /_/\\__,_/\\__/\\___/   
    / ____/  __/ /___  __________  _____         
   / /_  / / / / __/ / / / ___/ _ \\/ ___/        
  / __/ / /_/ / /_/ /_/ / /  /  __(__  )         
 /_/    \\__,_/\\__/\\__,_/_/   \\___/____/          
`;

// ── Grouped help formatter ────────────────────────────────────────
// Produces the clean grouped layout with blank-line separators
// between logical command categories.
const COMMAND_GROUPS: string[][] = [
  ['login', 'logout'],
  ['projects', 'services', 'deployments', 'regions', 'ssh'],
  ['billing'],
];

class GroupedHelp extends Help {
  formatHelp(cmd: Command, helper: Help): string {
    const indent = '  ';

    // Usage line
    let out = `Usage: ${cmd.name()} [options] [command]\n`;

    // Options
    const opts = helper.visibleOptions(cmd);
    if (opts.length) {
      out += '\nOptions:\n';
      const termWidth = helper.padWidth(cmd, helper);
      const colWidth = Math.max(termWidth, 27) + 2;
      for (const opt of opts) {
        const term = helper.optionTerm(opt);
        const desc = helper.optionDescription(opt);
        out += `${indent}${term.padEnd(colWidth)}${desc}\n`;
      }
    }

    // Commands — grouped with separators
    const allCmds = helper.visibleCommands(cmd);
    if (allCmds.length) {
      out += '\nCommands:\n';

      const termWidth = helper.padWidth(cmd, helper);
      const colWidth = Math.max(termWidth, 27) + 2;
      const nameSet = new Set(allCmds.map((c) => c.name()));
      const rendered = new Set<string>();

      for (const group of COMMAND_GROUPS) {
        const groupCmds = group
          .filter((name) => nameSet.has(name))
          .map((name) => allCmds.find((c) => c.name() === name))
          .filter((c): c is NonNullable<typeof c> => c != null);

        for (const c of groupCmds) {
          const term = helper.subcommandTerm(c);
          const desc = helper.subcommandDescription(c);
          out += `${indent}${term.padEnd(colWidth)}${desc}\n`;
          rendered.add(c.name());
        }

        if (groupCmds.length) out += '\n';
      }

      // Anything not in a group (fallback)
      for (const c of allCmds) {
        if (rendered.has(c.name())) continue;
        const term = helper.subcommandTerm(c);
        const desc = helper.subcommandDescription(c);
        out += `${indent}${term.padEnd(colWidth)}${desc}\n`;
      }

      // Always show help at the bottom
      out += `${indent}${'help [command]'.padEnd(colWidth)}display help for command\n`;
    }

    return out;
  }
}

export const init = ({ version, parser }: InitArgs) => {
  const program: Command = new Command()
    .name('af')
    .option('--debug', t('enableDebugMode'))
    .action(() => program.outputHelp())
    .version(version);

  program.addHelpText('beforeAll', logo).showHelpAfterError();
  program.configureHelp({
    formatHelp: (cmd, helper) => new GroupedHelp().formatHelp(cmd, helper),
  });

  // ── Top-level: login / logout ───────────────────────────────────
  program
    .command('login')
    .description('Log in to Alternate Clouds (opens browser to web UI)')
    .option('-e, --email', 'Login via email verification (no browser required)')
    .option('--auth-url <url>', 'Override auth service URL')
    .action((options) => {
      if (options.email) {
        const authApiUrl =
          options.authUrl ||
          getDefined('AUTH__API_URL') ||
          'https://auth.alternatefutures.ai';
        return emailLoginActionHandler({ authApiUrl });
      }

      const uiAppUrl = getDefined('UI__APP_URL');
      const authApiUrl =
        options.authUrl ||
        getDefined('AUTH__API_URL') ||
        getDefined('SDK__AUTH_SERVICE_URL');

      if (!uiAppUrl || !authApiUrl) {
        throw new MissingExpectedDataError();
      }

      return loginActionHandler({ uiAppUrl, authApiUrl });
    });

  program
    .command('logout')
    .description('Log out of the CLI')
    .action(logoutActionHandler);

  // ── Register command groups (order matters for help) ────────────
  // Group 2: resource management
  cmdProjects(program);
  cmdServices(program);
  cmdDeployments(program);
  cmdRegions(program);

  // Group 3: utilities
  cmdBilling(program);
  cmdSSH(program);

  // ── Hidden commands (functional but not in top-level help) ──────
  const templatesCmd = cmdTemplates(program);
  if (templatesCmd) (templatesCmd as any)._hidden = true;

  const patCmd = cmdPAT(program);
  if (patCmd) (patCmd as any)._hidden = true;

  const versionCmd = program.command('version').action(() => {
    output.raw(version);
    output.printNewLine();
  });
  (versionCmd as any)._hidden = true;

  // Add help subcommand to all visible nested commands
  for (const sub of program.commands) {
    if (!(sub as any)._hidden) {
      for (const opt of sub.commands) {
        opt.addHelpCommand();
      }
    }
  }

  parser(program);

  return program;
};

// eslint-disable-next-line af-custom/valid-argument-types
export const asyncParser = async (program: Command) => {
  try {
    await program.parseAsync(process.argv);

    process.exit(0);
  } catch (err) {
    console.error((err as Error).message || err);

    if ((err as Error).stack) {
      console.error((err as Error).stack);
    }

    process.exit(1);
  }
};
