import type { Command } from 'commander';

import { output } from '../../cli';
import { config } from '../../config';
import { loginGuard } from '../../guards/loginGuard';
import { projectGuard } from '../../guards/projectGuard';
import { graphqlFetch } from '../../graphql/client';
import {
  DELETE_SERVICE_ENV_VAR,
  GET_SERVICE_REGISTRY,
  LINK_SERVICES,
  SET_SERVICE_ENV_VAR,
  UNLINK_SERVICES,
} from '../../graphql/operations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceRecord = Record<string, any>;

const ensureProjectContext = async (): Promise<string> => {
  await loginGuard();
  await projectGuard();

  const projectId = config.projectId.get();
  if (!projectId) {
    output.error('No project selected. Run `af projects switch` first.');
    process.exit(1);
  }

  return projectId;
};

const fetchServices = async (projectId: string): Promise<ServiceRecord[]> => {
  const { data } = await graphqlFetch(GET_SERVICE_REGISTRY, { projectId });
  return data?.serviceRegistry || [];
};

const findService = async (
  projectId: string,
  serviceId: string,
): Promise<ServiceRecord | null> => {
  const services = await fetchServices(projectId);
  return services.find((s: ServiceRecord) => s.id === serviceId) || null;
};

export default (program: Command): Command => {
  const cmd = program
    .command('services')
    .description('Manage services in the current project');

  cmd
    .command('list')
    .description('List all services in the current project')
    .action(async () => {
      try {
        const projectId = await ensureProjectContext();
        const services = await fetchServices(projectId);

        if (!services.length) {
          output.log('No services found in this project.');
          return;
        }

        output.table(
          services.map((s: ServiceRecord) => ({
            ID: s.id,
            Name: s.name,
            Type: s.type || 'N/A',
            Image: s.dockerImage || 'N/A',
            Port: s.containerPort || 'N/A',
            Slug: s.slug || 'N/A',
          })),
        );
      } catch (error) {
        output.error(
          error instanceof Error ? error.message : 'Failed to list services',
        );
        process.exit(1);
      }
    });

  cmd
    .command('info <serviceId>')
    .description('Show full detail for a service')
    .action(async (serviceId: string) => {
      try {
        const projectId = await ensureProjectContext();
        const service = await findService(projectId, serviceId);

        if (!service) {
          output.error(`Service ${serviceId} not found.`);
          process.exit(1);
        }

        output.printNewLine();
        output.log('Service Detail:');
        output.table([
          { Field: 'ID', Value: service.id },
          { Field: 'Name', Value: service.name },
          { Field: 'Type', Value: service.type || 'N/A' },
          { Field: 'Slug', Value: service.slug || 'N/A' },
          { Field: 'Docker Image', Value: service.dockerImage || 'N/A' },
          { Field: 'Container Port', Value: service.containerPort || 'N/A' },
          { Field: 'Template ID', Value: service.templateId || 'N/A' },
        ]);

        if (service.ports?.length) {
          output.log('Ports:');
          output.table(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            service.ports.map((p: any) => ({
              'Container Port': p.containerPort,
              'Public Port': p.publicPort || 'N/A',
              Protocol: p.protocol || 'TCP',
            })),
          );
        }

        if (service.linksFrom?.length || service.linksTo?.length) {
          output.log('Links:');
          const links = [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(service.linksFrom || []).map((l: any) => ({
              Direction: 'outgoing',
              'Linked Service': l.targetServiceId,
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(service.linksTo || []).map((l: any) => ({
              Direction: 'incoming',
              'Linked Service': l.sourceServiceId,
            })),
          ];
          output.table(links);
        }
      } catch (error) {
        output.error(
          error instanceof Error
            ? error.message
            : 'Failed to fetch service info',
        );
        process.exit(1);
      }
    });

  // --- env subcommands ---
  const envCmd = cmd
    .command('env')
    .description('Manage environment variables for a service');

  envCmd
    .command('list <serviceId>')
    .description('List environment variables for a service')
    .action(async (serviceId: string) => {
      try {
        const projectId = await ensureProjectContext();
        const service = await findService(projectId, serviceId);

        if (!service) {
          output.error(`Service ${serviceId} not found.`);
          process.exit(1);
        }

        const envVars = service.envVars || [];
        if (!envVars.length) {
          output.log(`No environment variables set for service ${serviceId}.`);
          return;
        }

        output.table(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          envVars.map((v: any) => ({
            Key: v.key,
            Value: v.value,
          })),
        );
      } catch (error) {
        output.error(
          error instanceof Error
            ? error.message
            : 'Failed to list env vars',
        );
        process.exit(1);
      }
    });

  envCmd
    .command('set <serviceId> <keyValue>')
    .description('Set an environment variable (KEY=VALUE)')
    .action(async (serviceId: string, keyValue: string) => {
      try {
        await loginGuard();

        const eqIndex = keyValue.indexOf('=');
        if (eqIndex === -1) {
          output.error('Invalid format. Use KEY=VALUE.');
          process.exit(1);
        }

        const key = keyValue.substring(0, eqIndex);
        const value = keyValue.substring(eqIndex + 1);

        if (!key) {
          output.error('Key cannot be empty.');
          process.exit(1);
        }

        const { data } = await graphqlFetch(SET_SERVICE_ENV_VAR, {
          serviceId,
          key,
          value,
        });

        output.success(
          `Set ${data?.setServiceEnvVar?.key}=${data?.setServiceEnvVar?.value}`,
        );
      } catch (error) {
        output.error(
          error instanceof Error ? error.message : 'Failed to set env var',
        );
        process.exit(1);
      }
    });

  envCmd
    .command('delete <serviceId> <key>')
    .description('Delete an environment variable')
    .action(async (serviceId: string, key: string) => {
      try {
        await loginGuard();

        await graphqlFetch(DELETE_SERVICE_ENV_VAR, { serviceId, key });

        output.success(`Deleted env var "${key}" from service ${serviceId}.`);
      } catch (error) {
        output.error(
          error instanceof Error ? error.message : 'Failed to delete env var',
        );
        process.exit(1);
      }
    });

  // --- link/unlink ---
  cmd
    .command('link <sourceId> <targetId>')
    .description('Link two services together')
    .action(async (sourceId: string, targetId: string) => {
      try {
        await loginGuard();

        await graphqlFetch(LINK_SERVICES, {
          sourceServiceId: sourceId,
          targetServiceId: targetId,
        });

        output.success(`Linked service ${sourceId} → ${targetId}.`);
      } catch (error) {
        output.error(
          error instanceof Error ? error.message : 'Failed to link services',
        );
        process.exit(1);
      }
    });

  cmd
    .command('unlink <sourceId> <targetId>')
    .description('Unlink two services')
    .action(async (sourceId: string, targetId: string) => {
      try {
        await loginGuard();

        await graphqlFetch(UNLINK_SERVICES, {
          sourceServiceId: sourceId,
          targetServiceId: targetId,
        });

        output.success(`Unlinked service ${sourceId} → ${targetId}.`);
      } catch (error) {
        output.error(
          error instanceof Error ? error.message : 'Failed to unlink services',
        );
        process.exit(1);
      }
    });

  return cmd;
};
