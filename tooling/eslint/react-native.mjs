import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';
import {
  eslint,
  eslintPluginPrettierRecommended,
  prettierRuleOverrides,
  sharedGlobals,
  tseslint,
  withTypeChecking,
} from './shared.mjs';

export const createReactNativeConfig = ({ tsconfigRootDir, ignores = [] }) =>
  tseslint.config(
    {
      ignores,
    },
    eslint.configs.recommended,
    ...withTypeChecking(tsconfigRootDir),
    reactPlugin.configs.recommended,
    reactHooksPlugin.configs.recommended,
    reactNativePlugin.configs.all ?? reactNativePlugin.configs.recommended,
    eslintPluginPrettierRecommended,
    prettierRuleOverrides,
    {
      languageOptions: {
        globals: {
          ...sharedGlobals.shared,
        },
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'react-native/no-inline-styles': 'warn',
      },
    },
  );

export default createReactNativeConfig;
