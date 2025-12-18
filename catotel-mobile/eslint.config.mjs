import { createReactNativeConfig } from '../tooling/eslint/react-native.mjs';

export default createReactNativeConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: ['.expo', 'node_modules', 'dist', 'build'],
});
