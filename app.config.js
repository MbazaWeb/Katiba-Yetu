module.exports = {
  expo: {
    name: 'Katiba Yetu',
    slug: 'katiba-yetu',
    version: '0.3.1',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash-icon.png',
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
        foregroundImage: './assets/adaptive-icon.png',
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
      favicon: './assets/favicon.png',
    },
  },
};
