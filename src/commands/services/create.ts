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

export const createServiceActionHandler = async (projectFlag?: string) => {
  try {
    const projectId = await ensureProject(projectFlag);

    // 1. Browse templates
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
      choices: templates.map((t) => ({
        title: `${t.name} — ${t.description || t.category}`,
        value: t.id,
      })),
    });

    // 2. Fetch full template details
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
    output.print(chalk.bold(tmpl.name));
    output.printNewLine();
    output.log(`Image:     ${tmpl.dockerImage}`);
    output.log(
      `Resources: ${tmpl.resources.cpu} vCPU, ${tmpl.resources.memory} RAM, ${tmpl.resources.storage} storage`,
    );
    if (tmpl.resources.gpu) {
      output.log(
        `GPU:       ${tmpl.resources.gpu.units}x ${tmpl.resources.gpu.vendor} ${tmpl.resources.gpu.model}`,
      );
    }
    output.printNewLine();

    // 3. Choose compute type
    const compute = await selectPrompt<string>({
      message: 'Compute type:',
      choices: [
        { title: 'Standard', value: 'standard' },
        { title: 'Confidential (TEE)', value: 'confidential' },
      ],
    });

    // 4. Service name
    const serviceName = await textPrompt({
      message: 'Service name:',
      initial: tmpl.name.toLowerCase().replace(/\s+/g, '-'),
    });

    // 5. Confirm
    const computeLabel =
      compute === 'confidential' ? 'Confidential' : 'Standard';
    const confirmed = await confirmPrompt({
      message: `Deploy "${tmpl.name}" as "${serviceName}" (${computeLabel})?`,
      initial: true,
    });

    if (!confirmed) {
      output.log('Cancelled.');
      return;
    }

    // 6. Deploy
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
