import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false, // Désactivé temporairement à cause d'un bug Rollup avec type imports
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  skipNodeModulesBundle: true,
  external: ['vite', 'zod'],
});
