module.exports = {
  expo: {
    name: 'Katiba Yetu',
    slug: 'katiba-yetu',
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    backgroundColor: '#0A0A0A',
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#0A6233',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'tz.katibayetu.app',
    },
    android: {
      package: 'tz.katibayetu.app',
      adaptiveIcon: {
        backgroundColor: '#0A6233',
      },
      permissions: [
        'INTERNET',
        'VIBRATE',
      ],
      statusBar: {
        barStyle: 'light-content',
        backgroundColor: '#0A6233',
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
    },
  },
};
