import type { Command } from 'commander';

import { listTemplatesActionHandler } from './list';
import { infoTemplateActionHandler } from './info';

type ListOptions = {
  category?: string;
};

export default (program: Command): Command => {
  const cmd = program
    .command('templates')
    .description('Browse available service templates')
    .action(() => listTemplatesActionHandler({}));

  cmd
    .command('list')
    .description('List available deployment templates')
    .option(
      '-c, --category <category>',
      'Filter by category (AI_ML, WEB_SERVER, GAME_SERVER, DATABASE, DEVTOOLS, CUSTOM)',
    )
    .action((options: ListOptions) =>
      listTemplatesActionHandler({ category: options.category?.toUpperCase() }),
    );

  cmd
    .command('info <templateId>')
    .description('Show detailed template information')
    .action((templateId: string) =>
      infoTemplateActionHandler({ templateId }),
    );

  return cmd;
};
