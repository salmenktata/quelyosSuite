import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Bug Rollup avec type imports - utiliser index.d.ts manuel
  sourcemap: true,
  clean: false, // Désactivé pour conserver index.d.ts manuel
  treeshake: true,
  splitting: false,
  skipNodeModulesBundle: true,
  external: ['vite', 'zod'],
});
