import { build, BuildOptions } from 'esbuild';

import { parseEnvVarsAsKeyVal } from './src/utils/env';
import { defined } from './src/defined';
import pkgJson from './package.json';

import type { Defined } from './src/defined';

const external = [
  ...Object.keys(pkgJson.dependencies),
  "aws4",
];

const define = parseEnvVarsAsKeyVal<Defined>({ defined });

const main = async () => {
  const buildOptions: BuildOptions = {
    entryPoints: ['src/cli.ts'],
    define,
    bundle: true,
    platform: 'node',
    target: 'esnext',
    outfile: 'dist/bundle.js',
    format: 'cjs',
    sourcemap: true,
    external,
  };

  try {
    await build(buildOptions);
  } catch (error) {
    console.error('👹 Oops! Failed to bundle for some reason...');
    console.error(error);
    process.exit(1);
  }
};

main();
