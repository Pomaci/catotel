const { extendsConfigs, ignorePatterns } = require("./eslint.shared.cjs");

module.exports = {
  root: true,
  extends: extendsConfigs,
  ignorePatterns,
};
