import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false, // Bug Rollup avec type imports - utiliser index.d.ts manuel
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  skipNodeModulesBundle: true,
  external: ['vite', 'zod'],
});
