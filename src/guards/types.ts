import type { AlternateFuturesSdk } from '@alternatefutures/sdk/node';

type NoArgumentsType = never;

export type SdkGuardedFunctionArgs<T = NoArgumentsType> = {
  sdk: AlternateFuturesSdk;
  args: T;
};

export type SdkGuardedFunction<T = NoArgumentsType> = (
  guardedArgs: SdkGuardedFunctionArgs<T>,
) => Promise<void>;

export type Action<T = NoArgumentsType> = (args?: T) => Promise<void> | void;

export type Guards = {
  authenticated: true;
  project: boolean;
  site: boolean;
};
