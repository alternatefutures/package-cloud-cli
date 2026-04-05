import chalk from 'chalk';

import { output } from '../../cli';
import { graphqlFetch } from '../../graphql';
import {
  GET_TEMPLATE,
  DEPLOY_FROM_TEMPLATE,
  DEPLOY_TO_PHALA,
  DEPLOY_COMPOSITE_TEMPLATE,
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
  gpuModels?: string;
  gpuUnits?: number;
  maxBudget?: number;
  maxMonthly?: number;
  runtime?: string;
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
    memory: string;
    storage: string;
    gpu?: { units: number; vendor: string; model: string };
  };
  envVars: { key: string; default: string | null; required: boolean }[];
  ports: { port: number; as: number; global: boolean }[];
};

type DeploymentResult = {
  id: string;
  status: string;
  serviceId: string;
};

/**
 * Parse a duration string like "4h", "30d", "120m" into minutes.
 */
const parseRuntimeToMinutes = (runtime: string): number | null => {
  const match = runtime.trim().match(/^(\d+(?:\.\d+)?)\s*(h|d|m)$/i);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'h') return Math.round(value * 60);
  if (unit === 'd') return Math.round(value * 60 * 24);
  if (unit === 'm') return Math.round(value);
  return null;
};

const buildPolicyInput = (args: DeployTemplateArgs): Record<string, unknown> | undefined => {
  const policy: Record<string, unknown> = {};
  let hasPolicy = false;

  if (args.gpuModels) {
    policy.acceptableGpuModels = args.gpuModels.split(',').map(m => m.trim()).filter(Boolean);
    hasPolicy = true;
  }
  if (args.gpuUnits && args.gpuUnits > 1) {
    policy.gpuUnits = args.gpuUnits;
    hasPolicy = true;
  }
  if (args.maxBudget && args.maxBudget > 0) {
    policy.maxBudgetUsd = args.maxBudget;
    hasPolicy = true;
  }
  if (args.maxMonthly && args.maxMonthly > 0) {
    policy.maxMonthlyUsd = args.maxMonthly;
    hasPolicy = true;
  }
  if (args.runtime) {
    const minutes = parseRuntimeToMinutes(args.runtime);
    if (minutes && minutes > 0) {
      policy.runtimeMinutes = minutes;
      hasPolicy = true;
    }
  }

  return hasPolicy ? policy : undefined;
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
  const { data } = await graphqlFetch<{ projects: { data: Project[] } }>(LIST_PROJECTS);

  const projects = data?.projects?.data;
  if (!projects?.length) {
    output.error('No projects found. Create a project first with `af projects create`.');
    return null;
  }

  return selectPrompt<string>({
    message: 'Select a project to deploy into:',
    choices: projects.map((p) => ({
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
    `Resources: ${tmpl.resources.cpu} vCPU, ${tmpl.resources.memory} RAM, ${tmpl.resources.storage} storage`,
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
  const policyInput = buildPolicyInput(args);

  if (policyInput) {
    output.log(chalk.dim(`Policy: ${JSON.stringify(policyInput)}`));
  }

  output.spinner('Creating deployment...');

  if (args.provider === 'phala') {
    const phalaInput: Record<string, unknown> = {
      templateId: args.templateId,
      projectId,
      serviceName,
    };
    if (policyInput) phalaInput.policy = policyInput;

    const { data } = await graphqlFetch<{
      deployFromTemplateToPhala: DeploymentResult;
    }>(DEPLOY_TO_PHALA, {
      input: phalaInput,
    });

    const result = data?.deployFromTemplateToPhala;
    if (!result) {
      output.error('Deployment failed — no response from server.');
      return;
    }

    output.success('Phala deployment created!');
    output.log(`Deployment ID: ${result.id}`);
    output.log(`Status:        ${result.status}`);
    output.printNewLine();
    output.hint('Monitor with: af phala list');
  } else {
    const input: Record<string, unknown> = {
      templateId: args.templateId,
      projectId,
      serviceName,
    };

    if (envOverrides.length) {
      input.envOverrides = envOverrides;
    }

    if (args.gpu) {
      input.resourceOverrides = { gpu: { units: 1, vendor: 'nvidia' } };
    }

    if (policyInput) {
      input.policy = policyInput;
    }

    const { data } = await graphqlFetch<{
      deployFromTemplate: DeploymentResult;
    }>(DEPLOY_FROM_TEMPLATE, { input });

    const result = data?.deployFromTemplate;
    if (!result) {
      output.error('Deployment failed — no response from server.');
      return;
    }

    output.success('Akash deployment created!');
    output.log(`Deployment ID: ${result.id}`);
    output.log(`Status:        ${result.status}`);
    output.printNewLine();
    output.hint('Monitor with: af akash list');
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

// ── Composite deploy ────────────────────────────────────────────────

type DeployCompositeArgs = {
  templateId: string;
  projectId?: string;
  mode: string;
  provider?: string;
  name?: string;
};

const deployCompositeAction = async (args: DeployCompositeArgs) => {
  const projectId = await resolveProjectId(args.projectId);
  if (!projectId) return;

  const serviceName =
    args.name ??
    (await textPrompt({
      message: 'Service name:',
      initial: args.templateId.toLowerCase().replace(/\s+/g, '-'),
    }));

  const confirmed = await confirmPrompt({
    message: `Deploy composite template "${args.templateId}" in ${args.mode} mode?`,
    initial: true,
  });
  if (!confirmed) {
    output.log('Deployment cancelled.');
    return;
  }

  output.spinner('Creating composite deployment...');

  const input: Record<string, unknown> = {
    templateId: args.templateId,
    projectId,
    mode: args.mode,
    serviceName,
  };

  if (args.provider) {
    input.provider = args.provider;
  }

  const { data } = await graphqlFetch<{
    deployCompositeTemplate: { primaryServiceId: string };
  }>(DEPLOY_COMPOSITE_TEMPLATE, { input });

  const result = data?.deployCompositeTemplate;
  if (!result) {
    output.error('Composite deployment failed — no response from server.');
    return;
  }

  output.success('Composite deployment created!');
  output.log(`Primary Service ID: ${result.primaryServiceId}`);
  output.printNewLine();
  output.hint('Monitor with: af services list');
};

export const deployCompositeActionHandler = async (
  args: DeployCompositeArgs,
) => {
  try {
    await deployCompositeAction(args);
  } catch (error) {
    output.error(
      error instanceof Error
        ? error.message
        : 'Failed to deploy composite template',
    );
  }
};
