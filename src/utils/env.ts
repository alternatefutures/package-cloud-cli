import { EnvNotSetError } from '@alternatefutures/errors';

// Replace global variables with specific values during build
const DEFAULT_ESBUILD_DEFINED_PROCESS_ENV_PREFIX = 'process.env.';

type Optional<T = void> = Partial<Record<keyof T, string | undefined | null>>;

export const parseEnvVarsAsKeyVal = <T extends Record<string, string>>({
  defined,
  keyPrefix = DEFAULT_ESBUILD_DEFINED_PROCESS_ENV_PREFIX,
}: {
  defined: Optional<T>;
  keyPrefix?: string;
}) => {
  const keys = Object.keys(defined);

  if (!keys.length) {
    throw new EnvNotSetError('');
  }

  return keys.reduce(
    (define, envName) => {
      const value = defined[envName as keyof T];

      if (!value) {
        throw new EnvNotSetError(envName);
      }

      if (/localhost|127\.0\.0\.1/.test(value)) {
        console.error(`🚨 Refusing to bake localhost URL into bundle: ${envName}=${value}`);
        console.error(`   This would publish a broken CLI. Fix your env vars and retry.`);
        process.exit(1);
      }

      define[`${keyPrefix}${envName}`] = JSON.stringify(value);

      return define;
    },
    {} as Record<string, string>,
  );
};
