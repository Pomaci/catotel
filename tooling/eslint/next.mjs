import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import {
  eslint,
  eslintPluginPrettierRecommended,
  prettierRuleOverrides,
  sharedGlobals,
  tseslint,
  withTypeChecking,
} from './shared.mjs';

export const createNextConfig = ({ tsconfigRootDir, ignores = [] }) =>
  tseslint.config(
    {
      ignores,
    },
    eslint.configs.recommended,
    ...withTypeChecking(tsconfigRootDir),
    reactPlugin.configs.recommended,
    reactHooksPlugin.configs.recommended,
    jsxA11yPlugin.configs.recommended,
    nextPlugin.configs['core-web-vitals'],
    eslintPluginPrettierRecommended,
    prettierRuleOverrides,
    {
      languageOptions: {
        globals: {
          ...sharedGlobals.browser,
        },
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
      },
    },
  );

export default createNextConfig;
