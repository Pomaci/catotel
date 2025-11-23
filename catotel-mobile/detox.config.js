/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.sim.debug': {
      type: 'ios.simulator',
      binaryPath: 'ios/build/Catotel/Build/Products/Debug-iphonesimulator/Catotel.app',
      build:
        'npx expo prebuild --platform ios && xcodebuild -workspace ios/Catotel.xcworkspace -scheme Catotel -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      device: {
        type: 'iPhone 15',
      },
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15' },
    },
  },
  configurations: {
    'ios.debug': {
      device: 'simulator',
      app: 'ios.sim.debug',
    },
  },
};
