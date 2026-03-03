export const LIST_TEMPLATES = `
  query ListTemplates($category: String) {
    templates(category: $category) {
      id name description category tags
      dockerImage serviceType
      resources { cpu memory storage }
      ports { containerPort protocol }
      envVars { key defaultValue description required }
    }
  }
`;

export const GET_TEMPLATE = `
  query GetTemplate($id: String!) {
    template(id: $id) {
      id name description category tags
      dockerImage serviceType
      resources { cpu memory storage gpu { units vendor model } }
      ports { containerPort protocol }
      envVars { key defaultValue description required }
      persistentStorage { name mountPath size }
    }
  }
`;

export const DEPLOY_FROM_TEMPLATE = `
  mutation DeployFromTemplate(
    $templateId: String!
    $projectId: String!
    $name: String
    $envOverrides: [EnvVarInput!]
    $resourceOverrides: ResourceOverridesInput
  ) {
    deployFromTemplate(
      templateId: $templateId
      projectId: $projectId
      name: $name
      envOverrides: $envOverrides
      resourceOverrides: $resourceOverrides
    ) {
      id status serviceId
    }
  }
`;

export const DEPLOY_TO_PHALA = `
  mutation DeployFromTemplateToPhala(
    $templateId: String!
    $projectId: String!
    $name: String
    $cvmSize: String
  ) {
    deployFromTemplateToPhala(
      templateId: $templateId
      projectId: $projectId
      name: $name
      cvmSize: $cvmSize
    ) {
      id status serviceId
    }
  }
`;

export const LIST_AKASH_DEPLOYMENTS = `
  query AkashDeployments {
    akashDeployments {
      id status dseq provider errorMessage
      costPerHour costPerDay costPerMonth retryCount
      service { id name slug }
      deployedAt closedAt createdAt
    }
  }
`;

export const LIST_PHALA_DEPLOYMENTS = `
  query PhalaDeployments {
    phalaDeployments {
      id status appId appUrl errorMessage
      costPerHour costPerDay costPerMonth retryCount
      cvmSize
      service { id name slug }
      createdAt
    }
  }
`;

export const GET_SERVICE_REGISTRY = `
  query ServiceRegistry($projectId: String!) {
    serviceRegistry(projectId: $projectId) {
      id type name slug templateId dockerImage containerPort
      envVars { id key value }
      ports { id containerPort publicPort protocol }
      linksFrom { id targetServiceId }
      linksTo { id sourceServiceId }
    }
  }
`;

export const GET_SERVICE_LOGS = `
  query ServiceLogs($serviceId: String!, $tail: Int) {
    serviceLogs(serviceId: $serviceId, tail: $tail) {
      logs provider deploymentId
    }
  }
`;

export const CLOSE_AKASH_DEPLOYMENT = `
  mutation CloseAkashDeployment($deploymentId: String!) {
    closeAkashDeployment(deploymentId: $deploymentId) {
      id status
    }
  }
`;

export const STOP_PHALA_DEPLOYMENT = `
  mutation StopPhalaDeployment($deploymentId: String!) {
    stopPhalaDeployment(deploymentId: $deploymentId) {
      id status
    }
  }
`;

export const DELETE_PHALA_DEPLOYMENT = `
  mutation DeletePhalaDeployment($deploymentId: String!) {
    deletePhalaDeployment(deploymentId: $deploymentId) {
      id status
    }
  }
`;

export const SET_SERVICE_ENV_VAR = `
  mutation SetServiceEnvVar($serviceId: String!, $key: String!, $value: String!) {
    setServiceEnvVar(serviceId: $serviceId, key: $key, value: $value) {
      id key value
    }
  }
`;

export const DELETE_SERVICE_ENV_VAR = `
  mutation DeleteServiceEnvVar($serviceId: String!, $key: String!) {
    deleteServiceEnvVar(serviceId: $serviceId, key: $key)
  }
`;

export const LINK_SERVICES = `
  mutation LinkServices($sourceServiceId: String!, $targetServiceId: String!) {
    linkServices(sourceServiceId: $sourceServiceId, targetServiceId: $targetServiceId) {
      id
    }
  }
`;

export const UNLINK_SERVICES = `
  mutation UnlinkServices($sourceServiceId: String!, $targetServiceId: String!) {
    unlinkServices(sourceServiceId: $sourceServiceId, targetServiceId: $targetServiceId)
  }
`;

export const LIST_PROJECTS = `
  query Projects {
    projects {
      id name slug framework status
    }
  }
`;
