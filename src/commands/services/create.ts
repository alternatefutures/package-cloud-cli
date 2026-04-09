import chalk from 'chalk';

import { output } from '../../cli';
import { graphqlFetch } from '../../graphql';
import {
  DEPLOY_FROM_TEMPLATE,
  DEPLOY_TO_CONFIDENTIAL,
  GET_TEMPLATE,
  LIST_TEMPLATES,
} from '../../graphql/operations';
import { confirmPrompt } from '../../prompts/confirmPrompt';
import { selectPrompt } from '../../prompts/selectPrompt';
import { textPrompt } from '../../prompts/textPrompt';
import { ensureProject } from './helpers/ensureProject';
import { pollDeploymentStatus } from './helpers/pollDeployment';

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  dockerImage: string;
  serviceType: string;
  resources: {
    cpu: number;
    memory: string;
    storage: string;
    gpu?: { units: number; vendor: string; model: string };
  };
  envVars: { key: string; default: string | null; required: boolean }[];
  ports: { port: number; as: number; global: boolean }[];
};

type TemplateListItem = {
  id: string;
  name: string;
  description: string;
  category: string;
};

type DeploymentResult = {
  id: string;
  status: string;
  serviceId: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  AI_ML: '🤖 AI & Machine Learning',
  GAME_SERVER: '🎮 Game Servers',
  DATABASE: '🗄️  Databases',
  DEVTOOLS: '🛠️  Developer Tools',
  WEB_SERVER: '🌐 Web Servers',
};

const CATEGORY_ORDER = [
  'AI_ML',
  'WEB_SERVER',
  'GAME_SERVER',
  'DATABASE',
  'DEVTOOLS',
];

function formatTemplateChoices(templates: TemplateListItem[]) {
  const grouped: Record<string, TemplateListItem[]> = {};

  for (const t of templates) {
    const cat = t.category || 'OTHER';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  }

  const choices: { title: string; value: string; disabled?: boolean }[] = [];

  for (const cat of CATEGORY_ORDER) {
    const items = grouped[cat];
    if (!items?.length) continue;

    choices.push({
      title: chalk.dim(`── ${CATEGORY_LABELS[cat] || cat} ──`),
      value: `__header_${cat}`,
      disabled: true,
    });

    for (const t of items) {
      choices.push({
        title: `  ${t.name}`,
        value: t.id,
      });
    }
  }

  // Any remaining categories not in CATEGORY_ORDER
  for (const [cat, items] of Object.entries(grouped)) {
    if (CATEGORY_ORDER.includes(cat)) continue;
    choices.push({
      title: chalk.dim(`── ${CATEGORY_LABELS[cat] || cat} ──`),
      value: `__header_${cat}`,
      disabled: true,
    });
    for (const t of items) {
      choices.push({
        title: `  ${t.name}`,
        value: t.id,
      });
    }
  }

  return choices;
}

export const createServiceActionHandler = async (projectFlag?: string) => {
  try {
    const projectId = await ensureProject(projectFlag);

    // Step 1: What kind of service?
    output.printNewLine();
    const serviceKind = await selectPrompt<string>({
      message: 'What would you like to create?',
      choices: [
        {
          title: `📦 Template         ${chalk.dim('Deploy from a pre-built template')}`,
          value: 'template',
        },
        {
          title: `🐳 Docker Image     ${chalk.dim('Deploy any container image')}`,
          value: 'docker',
        },
        {
          title: `⚡ Function         ${chalk.dim('Serverless function (Bun + Hono)')}`,
          value: 'function',
        },
        {
          title: `🖥️  Server           ${chalk.dim('Full root access server')}`,
          value: 'server',
        },
      ],
    });

    if (serviceKind !== 'template') {
      output.printNewLine();
      output.log(
        `${chalk.yellow('Coming soon!')} ${serviceKind} services are not yet available via CLI.`,
      );
      output.hint(
        'Use the dashboard at https://alternatefutures.ai to create this service type.',
      );
      output.printNewLine();
      return;
    }

    // Step 2: Browse templates (grouped by category)
    output.spinner('Loading templates...');
    const { data: listData } = await graphqlFetch<{
      templates: TemplateListItem[];
    }>(LIST_TEMPLATES);

    const templates = listData?.templates;
    if (!templates?.length) {
      output.error('No templates available.');
      return;
    }

    const templateId = await selectPrompt<string>({
      message: 'Pick a template:',
      choices: formatTemplateChoices(templates),
    });

    // Step 3: Fetch full template details and show summary
    output.spinner('Loading template details...');
    const { data: tmplData } = await graphqlFetch<{ template: Template }>(
      GET_TEMPLATE,
      { id: templateId },
    );

    const tmpl = tmplData?.template;
    if (!tmpl) {
      output.error('Template not found.');
      return;
    }

    output.printNewLine();
    output.styledTable(
      ['', ''],
      [
        [chalk.cyan('Template'), chalk.white.bold(tmpl.name)],
        [chalk.cyan('Image'), chalk.dim(tmpl.dockerImage)],
        [
          chalk.cyan('Resources'),
          `${tmpl.resources.cpu} vCPU, ${tmpl.resources.memory} RAM, ${tmpl.resources.storage} disk`,
        ],
        ...(tmpl.resources.gpu
          ? [
              [
                chalk.cyan('GPU'),
                `${tmpl.resources.gpu.units}x ${tmpl.resources.gpu.vendor} ${tmpl.resources.gpu.model}`,
              ],
            ]
          : []),
      ],
    );

    // Step 4: Compute type
    const compute = await selectPrompt<string>({
      message: 'Compute type:',
      choices: [
        {
          title: `Standard            ${chalk.dim('Akash Network')}`,
          value: 'standard',
        },
        {
          title: `Confidential (TEE)  ${chalk.dim('Phala Network')}`,
          value: 'confidential',
        },
      ],
    });

    // Step 5: Service name
    const serviceName = await textPrompt({
      message: 'Service name:',
      initial: tmpl.name.toLowerCase().replace(/\s+/g, '-'),
    });

    // Step 6: Confirm
    const computeLabel =
      compute === 'confidential' ? 'Confidential' : 'Standard';
    output.printNewLine();
    const confirmed = await confirmPrompt({
      message: `Deploy "${chalk.bold(tmpl.name)}" as "${chalk.bold(serviceName)}" (${computeLabel})?`,
      initial: true,
    });

    if (!confirmed) {
      output.log('Cancelled.');
      return;
    }

    // Step 7: Deploy
    output.spinner('Creating deployment...');

    if (compute === 'confidential') {
      const { data } = await graphqlFetch<{
        deployFromTemplateToPhala: DeploymentResult;
      }>(DEPLOY_TO_CONFIDENTIAL, {
        input: { templateId, projectId, serviceName },
      });

      const result = data?.deployFromTemplateToPhala;
      if (!result) {
        output.error('Deployment failed — no response from server.');
        return;
      }

      output.success('Service created! Deploying to confidential compute...');
      output.log(`Service ID:    ${result.serviceId}`);
      output.log(`Deployment ID: ${result.id}`);
      output.log(`Status:        ${result.status}`);
      output.printNewLine();
      output.hint('Monitor with: af services list');
    } else {
      const { data } = await graphqlFetch<{
        deployFromTemplate: DeploymentResult;
      }>(DEPLOY_FROM_TEMPLATE, {
        input: { templateId, projectId, serviceName },
      });

      const result = data?.deployFromTemplate;
      if (!result) {
        output.error('Deployment failed — no response from server.');
        return;
      }

      output.printNewLine();
      output.log(
        `Deploying ${chalk.bold(serviceName)} ${chalk.dim(`(${result.id})`)}`,
      );
      output.printNewLine();

      await pollDeploymentStatus(result.id);
    }
  } catch (error) {
    output.error(
      error instanceof Error ? error.message : 'Failed to create service',
    );
    process.exit(1);
  }
};
