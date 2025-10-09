export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type FunctionRoute = {
  /** Route path pattern (supports wildcards: *, :param) */
  path: string;
  /** Destination URL to proxy to */
  destination: string;
  /** HTTP methods this route handles (default: all) */
  methods?: HttpMethod[];
  /** Whether to preserve the original path when proxying (default: true) */
  preservePath?: boolean;
  /** Priority for route matching (lower = higher priority, default: 100) */
  priority?: number;
  /** Custom headers to add to proxied requests */
  headers?: Record<string, string>;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
};

export type AlternateFuturesSiteConfig = {
  /** An unique sequence of random words that identifies the site. */
  slug: string;
  /** A directory where the site's data will be uploaded from. */
  distDir: string;
  /** An optional command that will be run before uploading site's data. */
  buildCommand?: string;
};

export type AlternateFuturesFunctionConfig = {
  /** An unique sequence of random words that identifies the function. */
  name: string;
  /** Type identifier for function configuration */
  type: 'function';
  /** Optional routing configuration for the function */
  routes?: FunctionRoute[];
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
