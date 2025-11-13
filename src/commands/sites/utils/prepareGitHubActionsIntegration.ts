import { join as joinPath } from 'node:path';

import { generateDeploymentWorkflowYaml } from '@alternatefutures/utils-github';
import { parse as parseSemver } from 'semver';

import type { Output } from '../../../output/Output';
import { fileExists } from '../../../utils/fs';
import { loadJSONFromPackageRoot } from '../../../utils/json';
import { confirmFileOverridePrompt } from '../prompts/confirmFileOverridePrompt';
import { getDeploymentWorkflowYamlLocation } from './getDeploymentWorkflowYamlLocation';
import { initializeDeploymentWorkflowDirectory } from './initializeDeploymentWorkflowDirectory';
import { requestDeploymentWorkflowInstallCommand } from './requestDeploymentWorkflowInstallCommand';
import { saveDeploymentWorkflowYaml } from './saveDeploymentWorkflowYaml';

export const ghWorkflowFilename = 'af-deploy.yaml';
export const ghActionsWorflowsDirectory = joinPath(
  process.cwd(),
  '.github/workflows',
);
export const ghActionsDeploySitesYamlPath = joinPath(
  ghActionsWorflowsDirectory,
  ghWorkflowFilename,
);

type PrepareGitHubActionsIntegrationArgs = {
  personalAccessToken: string;
  projectId: string;
  afConfigPath?: string;
  output: Output;
};

export const prepareGitHubActionsIntegration = async ({
  personalAccessToken,
  projectId,
  afConfigPath,
  output,
}: PrepareGitHubActionsIntegrationArgs) => {
  let nodeVersion: number;

  try {
    const nodeSemver = loadJSONFromPackageRoot(
      'package.json',
    ).engines.node.replace(/[^0-9\.]+/, '');

    nodeVersion = parseSemver(nodeSemver)?.major ?? 18;
  } catch {
    nodeVersion = 18;
  }

  const installCommand = await requestDeploymentWorkflowInstallCommand();
  const yamlContent = generateDeploymentWorkflowYaml({
    nodeVersion,
    fleekConfigPath: afConfigPath,
    installCommand,
  });
  const yamlPath = await getDeploymentWorkflowYamlLocation();
  const pathExists = await fileExists(yamlPath);

  if (pathExists && !(await confirmFileOverridePrompt({ path: yamlPath }))) {
    return;
  }

  if (yamlPath === ghActionsDeploySitesYamlPath) {
    await initializeDeploymentWorkflowDirectory({
      output,
      ghActionsWorflowsDirectory,
    });
  }

  await saveDeploymentWorkflowYaml({
    yamlPath,
    yamlContent,
    personalAccessToken,
    projectId,
    output,
  });
};
