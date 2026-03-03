import chalk from 'chalk';

import { output } from '../../cli';
import { graphqlFetch } from '../../graphql';
import { GET_TEMPLATE } from '../../graphql/operations';

type InfoTemplateArgs = {
  templateId: string;
};

type EnvVar = {
  key: string;
  defaultValue: string | null;
  description: string | null;
  required: boolean;
};

type Port = {
  containerPort: number;
  protocol: string;
};

type GpuSpec = {
  units: number;
  vendor: string;
  model: string;
};

type Resources = {
  cpu: number;
  memory: number;
  storage: number;
  gpu?: GpuSpec;
};

type PersistentStorage = {
  name: string;
  mountPath: string;
  size: string;
};

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  dockerImage: string;
  serviceType: string;
  resources: Resources;
  ports: Port[];
  envVars: EnvVar[];
  persistentStorage: PersistentStorage[] | null;
};

type GetTemplateResponse = {
  template: Template;
};

const infoTemplateAction = async ({ templateId }: InfoTemplateArgs) => {
  output.spinner('Fetching template details...');

  const { data } = await graphqlFetch<GetTemplateResponse>(GET_TEMPLATE, {
    id: templateId,
  });

  if (!data?.template) {
    output.error(`Template "${templateId}" not found.`);
    return;
  }

  const tmpl = data.template;

  output.printNewLine();
  output.print(chalk.bold(tmpl.name));
  output.printNewLine();
  output.log(tmpl.description);
  output.printNewLine();

  output.log(`Category:     ${tmpl.category}`);
  output.log(`Docker Image: ${tmpl.dockerImage}`);
  if (tmpl.tags?.length) {
    output.log(`Tags:         ${tmpl.tags.join(', ')}`);
  }

  output.printNewLine();
  output.print(chalk.bold('Resources'));
  output.printNewLine();
  output.log(`  CPU:     ${tmpl.resources.cpu} vCPU`);
  output.log(`  Memory:  ${tmpl.resources.memory} Mi`);
  output.log(`  Storage: ${tmpl.resources.storage} Mi`);
  if (tmpl.resources.gpu) {
    output.log(
      `  GPU:     ${tmpl.resources.gpu.units}x ${tmpl.resources.gpu.vendor} ${tmpl.resources.gpu.model}`,
    );
  }

  if (tmpl.ports?.length) {
    output.printNewLine();
    output.print(chalk.bold('Ports'));
    output.printNewLine();
    for (const port of tmpl.ports) {
      output.log(`  ${port.containerPort}/${port.protocol}`);
    }
  }

  if (tmpl.envVars?.length) {
    output.printNewLine();
    output.print(chalk.bold('Environment Variables'));
    output.printNewLine();
    output.table(
      tmpl.envVars.map((env) => ({
        Key: env.key,
        Default: env.defaultValue ?? '-',
        Required: env.required ? 'yes' : 'no',
        Description: env.description ?? '',
      })),
    );
  }

  if (tmpl.persistentStorage?.length) {
    output.printNewLine();
    output.print(chalk.bold('Persistent Storage'));
    output.printNewLine();
    output.table(
      tmpl.persistentStorage.map((vol) => ({
        Name: vol.name,
        'Mount Path': vol.mountPath,
        Size: vol.size,
      })),
    );
  }
};

export const infoTemplateActionHandler = async (args: InfoTemplateArgs) => {
  try {
    await infoTemplateAction(args);
  } catch (error) {
    output.error(
      error instanceof Error
        ? error.message
        : 'Failed to fetch template info',
    );
  }
};
