/* eslint-disable no-process-env */

type Secrets = {
  AF_TOKEN?: string;
  AF_PROJECT_ID?: string;
  AF_ORG_ID?: string;
};

export const secrets: Secrets = {
  AF_TOKEN: process.env.AF_TOKEN,
  AF_PROJECT_ID: process.env.AF_PROJECT_ID,
  AF_ORG_ID: process.env.AF_ORG_ID,
};
