import { vitestConfig } from '@alternatefutures/tester';
import { merge } from 'lodash';
import { defineConfig } from 'vitest/config';

export default defineConfig(
  merge(vitestConfig, {
    test: {
      isolate: true,
      clearMocks: true,
      deps: {
        inline: ['vitest-mock-process'],
      },
      coverage: {
        branches: 70,
        functions: 40,
        lines: 45,
        statements: 45,
      },
    },
  })
);
