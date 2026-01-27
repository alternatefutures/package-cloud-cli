import { Command } from 'commander';
import cmdApplications from './commands/applications/index';
import cmdAuth from './commands/auth/index';
import cmdBilling from './commands/billing/index';
import cmdDomains from './commands/domains/index';
import cmdEns from './commands/ens/index';
import cmdFunctions from './commands/functions/index';
import cmdGateways from './commands/gateways/index';
import cmdIPFS from './commands/ipfs/index';
import cmdIPNS from './commands/ipns/index';
import cmdObservability from './commands/observability/index';
import cmdPAT from './commands/pat/index';
import cmdProjects from './commands/projects/index';
import cmdSites from './commands/sites/index';
import cmdStorage from './commands/storage/index';
import cmdUser from './commands/user/index';

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
▞▀▖▜▐              ▐             
▙▄▌▐▜▀ ▞▀▖▙▀▖▛▀▖▝▀▖▜▀ ▞▀▖      
▌ ▌▐▐ ▖▛▀ ▌  ▌ ▌▞▀▌▐ ▖▛▀         
▘ ▘ ▘▀ ▝▀▘▘  ▘ ▘▝▀▘ ▀ ▝▀▘        
             ▛▀▘  ▐              
             ▙▄▌ ▌▜▀ ▌ ▌▙▀▖▞▀▖▞▀▘
             ▌ ▌ ▌▐ ▖▌ ▌▌  ▛▀ ▝▀▖
             ▘ ▝▀▘ ▀ ▝▀▘▘  ▝▀▘▀▀ 

${t('aboutAlternateFutures')}
`;

export const init = ({ version, parser }: InitArgs) => {
  const program: Command = new Command()
    .name('af')
    .option('--debug', t('enableDebugMode'))
    .action(() => program.outputHelp())
    .version(version);

  // TODO: The ascii logo should only be displayed
  // on default command, or general help
  // a minimal version can be used instead
  program.addHelpText('beforeAll', logo).showHelpAfterError();

  type CmdVersionArgs = typeof program;

  const cmdVersion = (program: CmdVersionArgs) =>
    program.command('version').action(() => {
      output.raw(version);
      output.printNewLine();
    });

  // Initialise commands
  const commands = [
    cmdAuth,
    cmdApplications,
    cmdBilling,
    cmdDomains,
    cmdEns,
    cmdGateways,
    cmdIPFS,
    cmdIPNS,
    cmdObservability,
    cmdPAT,
    cmdProjects,
    cmdSites,
    cmdStorage,
    cmdFunctions,
    cmdUser,
    cmdVersion,
  ];

  for (const cmd of commands) {
    const subCmd = cmd(program);

    // Attach common subcommands
    if (subCmd) {
      // TODO: Identify common subcommands
      // refactor to handle them here
      for (const opt of subCmd.commands) {
        opt.addHelpCommand();
      }
    }
  }

  // Init parser (unawaited)
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
