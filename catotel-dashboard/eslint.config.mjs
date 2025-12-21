import { createNextConfig } from '../tooling/eslint/next.mjs';

export default createNextConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: ['.next', 'out', 'dist', 'node_modules', 'playwright-report'],
});
