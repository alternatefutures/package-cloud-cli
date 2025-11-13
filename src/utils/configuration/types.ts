export type AlternateFuturesSiteConfig = {
  /** An unique sequence of random words that identifies the site. */
  slug: string;
  /** A directory where the site's data will be uploaded from. */
  distDir: string;
  /** An optional command that will be run before uploading site's data. */
  buildCommand?: string;
};

/**
 * Route configuration mapping path patterns to target URLs
 * @example
 * {
 *   '/api/users/*': 'https://users-service.com',
 *   '/api/products/*': 'https://products-service.com',
 *   '/api/*': 'https://api.example.com',
 *   '/*': 'https://default.com'
 * }
 */
export type RouteConfig = Record<string, string>;

export type AlternateFuturesFunctionConfig = {
  /** An unique sequence of random words that identifies the function. */
  name: string;
  /** Type identifier for function configuration */
  type: 'function';
  /** Optional routing configuration mapping path patterns to target URLs */
  routes?: RouteConfig;
};

export type AlternateFuturesRootConfig = {
  /** An array may contain one site's configuration at most. */
  sites: AlternateFuturesSiteConfig[];
  /** Optional function configuration */
  functions?: AlternateFuturesFunctionConfig[];
};

export type AlternateFuturesConfig =
  | AlternateFuturesRootConfig
  | (() => AlternateFuturesRootConfig)
  | (() => Promise<AlternateFuturesRootConfig>)
  | Promise<AlternateFuturesRootConfig>;

export enum AlternateFuturesSiteConfigFormats {
  JSON = 'json',
  Typescript = 'ts',
  Javascript = 'js',
}

export type AlternateFuturesSiteConfigFormatValue =
  AlternateFuturesSiteConfigFormats[keyof AlternateFuturesSiteConfigFormats];
