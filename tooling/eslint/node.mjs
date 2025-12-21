import {
  eslint,
  eslintPluginPrettierRecommended,
  sharedGlobals,
  tseslint,
  withTypeChecking,
  prettierRuleOverrides,
} from './shared.mjs';

export const createNodeConfig = ({ tsconfigRootDir, ignores = [] }) =>
  tseslint.config(
    {
      ignores,
    },
    eslint.configs.recommended,
    ...withTypeChecking(tsconfigRootDir),
    eslintPluginPrettierRecommended,
    prettierRuleOverrides,
    {
      languageOptions: {
        globals: {
          ...sharedGlobals.node,
          ...sharedGlobals.jest,
        },
        sourceType: 'commonjs',
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
      },
    },
  );

export default createNodeConfig;
