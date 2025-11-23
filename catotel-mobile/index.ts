import { TextInput } from "react-native";

const defaultProps = ((TextInput as unknown as { defaultProps?: any })
  .defaultProps ?? {}) as Record<string, unknown>;

defaultProps.autoComplete = "off";
defaultProps.autoCorrect = false;
defaultProps.importantForAutofill = "no";
defaultProps.textContentType = "none";
defaultProps.autoCapitalize = "none";

(TextInput as unknown as { defaultProps?: any }).defaultProps = defaultProps;

import "expo-router/entry";
