import eslint from '@eslint/js';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export const withTypeChecking = (tsconfigRootDir) =>
  tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        projectService: true,
        tsconfigRootDir,
      },
    },
  }));

export const prettierRuleOverrides = {
  rules: {
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
};

export const sharedGlobals = {
  browser: globals.browser,
  node: globals.node,
  jest: globals.jest,
  shared: globals['shared-node-browser'],
};

export { eslint, eslintPluginPrettierRecommended, tseslint };
