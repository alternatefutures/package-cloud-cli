export const LIST_TEMPLATES = `
  query ListTemplates($category: String) {
    templates(category: $category) {
      id name description category tags
      dockerImage serviceType
      resources { cpu memory storage }
      ports { port as global }
      envVars { key default description required }
    }
  }
`;

export const GET_TEMPLATE = `
  query GetTemplate($id: String!) {
    template(id: $id) {
      id name description category tags
      dockerImage serviceType
      resources { cpu memory storage gpu { units vendor model } }
      ports { port as global }
      envVars { key default description required }
      persistentStorage { name mountPath size }
    }
  }
`;

export const DEPLOY_FROM_TEMPLATE = `
  mutation DeployFromTemplate($input: DeployFromTemplateInput!) {
    deployFromTemplate(input: $input) {
      id status serviceId
    }
  }
`;

export const DEPLOY_TO_PHALA = `
  mutation DeployFromTemplateToPhala($input: DeployFromTemplateInput!) {
    deployFromTemplateToPhala(input: $input) {
      id status serviceId
    }
  }
`;

export const LIST_AKASH_DEPLOYMENTS = `
  query AkashDeployments {
    akashDeployments {
      id status dseq provider errorMessage
      costPerHour costPerDay costPerMonth
      service { id name slug }
      deployedAt closedAt createdAt
    }
  }
`;

export const LIST_PHALA_DEPLOYMENTS = `
  query PhalaDeployments {
    phalaDeployments {
      id status appId appUrl errorMessage
      costPerHour costPerDay costPerMonth
      cvmSize
      service { id name slug }
      createdAt
    }
  }
`;

export const GET_SERVICE_REGISTRY = `
  query ServiceRegistry($projectId: ID) {
    serviceRegistry(projectId: $projectId) {
      id type name slug templateId dockerImage containerPort
      activeAkashDeployment { id status }
      activePhalaDeployment { id status }
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
  mutation CloseAkashDeployment($id: ID!) {
    closeAkashDeployment(id: $id) {
      id status
    }
  }
`;

export const STOP_PHALA_DEPLOYMENT = `
  mutation StopPhalaDeployment($id: ID!) {
    stopPhalaDeployment(id: $id) {
      id status
    }
  }
`;

export const DELETE_PHALA_DEPLOYMENT = `
  mutation DeletePhalaDeployment($id: ID!) {
    deletePhalaDeployment(id: $id) {
      id status
    }
  }
`;

export const SET_SERVICE_ENV_VAR = `
  mutation SetServiceEnvVar($serviceId: ID!, $key: String!, $value: String!) {
    setServiceEnvVar(serviceId: $serviceId, key: $key, value: $value) {
      id key value
    }
  }
`;

export const DELETE_SERVICE_ENV_VAR = `
  mutation DeleteServiceEnvVar($serviceId: ID!, $key: String!) {
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
      data {
        id name slug
      }
    }
  }
`;
