import chalk from 'chalk';

import { output } from '../../cli';
import { graphqlFetch } from '../../graphql';
import {
  GET_TEMPLATE,
  DEPLOY_FROM_TEMPLATE,
  DEPLOY_TO_PHALA,
  LIST_PROJECTS,
} from '../../graphql/operations';
import { selectPrompt } from '../../prompts/selectPrompt';
import { confirmPrompt } from '../../prompts/confirmPrompt';
import { textPrompt } from '../../prompts/textPrompt';
import { config } from '../../config';

type DeployTemplateArgs = {
  templateId: string;
  projectId?: string;
  provider: string;
  name?: string;
  env?: string[];
  gpu?: boolean;
};

type Project = {
  id: string;
  name: string;
  slug: string;
};

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  dockerImage: string;
  resources: {
    cpu: number;
    memory: number;
    storage: number;
    gpu?: { units: number; vendor: string; model: string };
  };
  envVars: { key: string; defaultValue: string | null; required: boolean }[];
  ports: { containerPort: number; protocol: string }[];
};

type DeploymentResult = {
  id: string;
  status: string;
  serviceId: string;
};

const parseEnvOverrides = (
  envArgs?: string[],
): { key: string; value: string }[] => {
  if (!envArgs?.length) return [];
  return envArgs
    .map((pair) => {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) return null;
      return { key: pair.slice(0, eqIdx), value: pair.slice(eqIdx + 1) };
    })
    .filter((e): e is { key: string; value: string } => e !== null);
};

const resolveProjectId = async (
  projectIdArg?: string,
): Promise<string | null> => {
  if (projectIdArg) return projectIdArg;

  const savedProjectId = config.projectId.get();
  if (savedProjectId) {
    const useSaved = await confirmPrompt({
      message: `Use current project (${savedProjectId})?`,
      initial: true,
    });
    if (useSaved) return savedProjectId;
  }

  output.spinner('Loading projects...');
  const { data } = await graphqlFetch<{ projects: Project[] }>(LIST_PROJECTS);

  if (!data?.projects?.length) {
    output.error('No projects found. Create a project first with `af projects create`.');
    return null;
  }

  return selectPrompt<string>({
    message: 'Select a project to deploy into:',
    choices: data.projects.map((p) => ({
      title: `${p.name} (${p.id})`,
      value: p.id,
    })),
  });
};

const deployTemplateAction = async (args: DeployTemplateArgs) => {
  output.spinner('Fetching template details...');

  const { data: templateData } = await graphqlFetch<{ template: Template }>(
    GET_TEMPLATE,
    { id: args.templateId },
  );

  if (!templateData?.template) {
    output.error(`Template "${args.templateId}" not found.`);
    return;
  }

  const tmpl = templateData.template;

  output.printNewLine();
  output.print(chalk.bold(`Deploying: ${tmpl.name}`));
  output.printNewLine();
  output.log(`Image:    ${tmpl.dockerImage}`);
  output.log(`Provider: ${args.provider}`);
  output.log(
    `Resources: ${tmpl.resources.cpu} vCPU, ${tmpl.resources.memory} Mi RAM, ${tmpl.resources.storage} Mi storage`,
  );
  if (tmpl.resources.gpu) {
    output.log(
      `GPU: ${tmpl.resources.gpu.units}x ${tmpl.resources.gpu.vendor} ${tmpl.resources.gpu.model}`,
    );
  }
  output.printNewLine();

  const projectId = await resolveProjectId(args.projectId);
  if (!projectId) return;

  const serviceName =
    args.name ??
    (await textPrompt({
      message: 'Service name:',
      initial: tmpl.name.toLowerCase().replace(/\s+/g, '-'),
    }));

  const confirmed = await confirmPrompt({
    message: `Deploy "${tmpl.name}" as "${serviceName}" via ${args.provider}?`,
    initial: true,
  });

  if (!confirmed) {
    output.log('Deployment cancelled.');
    return;
  }

  const envOverrides = parseEnvOverrides(args.env);

  output.spinner('Creating deployment...');

  if (args.provider === 'phala') {
    const { data } = await graphqlFetch<{
      deployFromTemplateToPhala: DeploymentResult;
    }>(DEPLOY_TO_PHALA, {
      templateId: args.templateId,
      projectId,
      name: serviceName,
    });

    const result = data?.deployFromTemplateToPhala;
    if (!result) {
      output.error('Deployment failed — no response from server.');
      return;
    }

    output.success(`Phala deployment created!`);
    output.log(`Deployment ID: ${result.id}`);
    output.log(`Status:        ${result.status}`);
    output.printNewLine();
    output.hint('Monitor with: af phala deployments');
  } else {
    const variables: Record<string, unknown> = {
      templateId: args.templateId,
      projectId,
      name: serviceName,
    };

    if (envOverrides.length) {
      variables.envOverrides = envOverrides;
    }

    if (args.gpu) {
      variables.resourceOverrides = { gpu: true };
    }

    const { data } = await graphqlFetch<{
      deployFromTemplate: DeploymentResult;
    }>(DEPLOY_FROM_TEMPLATE, variables);

    const result = data?.deployFromTemplate;
    if (!result) {
      output.error('Deployment failed — no response from server.');
      return;
    }

    output.success(`Akash deployment created!`);
    output.log(`Deployment ID: ${result.id}`);
    output.log(`Status:        ${result.status}`);
    output.printNewLine();
    output.hint('Monitor with: af akash deployments');
  }
};

export const deployTemplateActionHandler = async (
  args: DeployTemplateArgs,
) => {
  try {
    await deployTemplateAction(args);
  } catch (error) {
    output.error(
      error instanceof Error
        ? error.message
        : 'Failed to deploy from template',
    );
  }
};
