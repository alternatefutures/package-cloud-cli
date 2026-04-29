export const LIST_TEMPLATES = `
  query ListTemplates($category: TemplateCategory) {
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
  query GetTemplate($id: ID!) {
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

export const DEPLOY_TO_CONFIDENTIAL = `
  mutation DeployFromTemplateToPhala($input: DeployFromTemplateInput!) {
    deployFromTemplateToPhala(input: $input) {
      id status serviceId
    }
  }
`;

export const DEPLOY_COMPOSITE_TEMPLATE = `
  mutation DeployCompositeTemplate($input: DeployCompositeTemplateInput!) {
    deployCompositeTemplate(input: $input) {
      primaryServiceId
    }
  }
`;

export const ALL_DEPLOYMENTS = `
  query AllDeployments($projectId: ID, $limit: Int) {
    allDeployments(projectId: $projectId, limit: $limit) {
      id shortId status kind
      serviceName serviceSlug serviceType
      projectId projectName
      source image statusMessage
      createdAt updatedAt
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
  query ServiceLogs($serviceId: ID!, $tail: Int) {
    serviceLogs(serviceId: $serviceId, tail: $tail) {
      logs provider deploymentId
    }
  }
`;

export const DEPLOY_TO_AKASH = `
  mutation DeployToAkash($input: DeployToAkashInput!) {
    deployToAkash(input: $input) {
      id status dseq owner serviceId region resolvedRegion
    }
  }
`;

// Phase 46 — region picker query, used by `af regions` and consumed
// (advisory) by `af services deploy --region` to validate availability
// before submitting. PHALA returns a single sentinel row — the
// command layer detects `id === 'phala-single-region'` and prints the
// explicit single-region message instead of a table.
export const REGIONS_QUERY = `
  query Regions($provider: ComputeProviderType, $gpuModelHint: String) {
    regions(provider: $provider, gpuModelHint: $gpuModelHint) {
      id
      label
      available
      verifiedCount
      onlineCount
      recentBidCount
      confidence
      medianPrices {
        cpu1Core
        h100
        h200
        rtx4090
        a100
      }
    }
  }
`;

export const GET_AKASH_DEPLOYMENT = `
  query GetAkashDeployment($id: ID!) {
    akashDeployment(id: $id) {
      id status dseq provider serviceId serviceUrls errorMessage retryCount
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
  mutation LinkServices($sourceServiceId: ID!, $targetServiceId: ID!) {
    linkServices(sourceServiceId: $sourceServiceId, targetServiceId: $targetServiceId) {
      id
    }
  }
`;

export const UNLINK_SERVICES = `
  mutation UnlinkServices($sourceServiceId: ID!, $targetServiceId: ID!) {
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

export const CREATE_PROJECT = `
  mutation CreateProject($data: CreateProjectDataInput!) {
    createProject(data: $data) {
      id name slug
    }
  }
`;

export const UPDATE_PROJECT = `
  mutation UpdateProject($id: ID!, $data: UpdateProjectDataInput!) {
    updateProject(id: $id, data: $data) {
      id name slug
    }
  }
`;

export const DELETE_PROJECT = `
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

export const DELETE_SERVICE = `
  mutation DeleteService($id: ID!) {
    deleteService(id: $id) {
      id name
    }
  }
`;
