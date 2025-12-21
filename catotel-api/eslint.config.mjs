import { createNodeConfig } from '../tooling/eslint/node.mjs';

export default createNodeConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: ['dist', 'eslint.config.mjs'],
});
