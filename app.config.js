module.exports = {
  expo: {
    name: 'Katiba Yetu',
    slug: 'katiba-yetu',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    backgroundColor: '#0A0A0A',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0A6233',  // Green splash
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'tz.katibayetu.app',
      requireFullScreen: false,
      infoPlist: {
        NSMicrophoneUsageDescription: 'Inahitajika kwa ajili ya kusoma ibara kwa sauti.',
        NSSpeechRecognitionUsageDescription: 'Inahitajika kwa ajili ya kutafuta kwa sauti.',
        UIStatusBarStyle: 'UIStatusBarStyleLightContent',
      },
    },
    android: {
      package: 'tz.katibayetu.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A6233',
      },
      permissions: [
        'INTERNET',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
      statusBar: {
        barStyle: 'light-content',
        backgroundColor: '#0A6233',
      },
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    extra: {
      eas: {
        projectId: 'katiba-yetu-tz',
      },
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          backgroundColor: '#0A6233',
          image: './assets/splash.png',
          imageWidth: 200,
        },
      ],
    ],
  },
};
