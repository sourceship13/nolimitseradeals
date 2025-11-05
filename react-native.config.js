module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts/'],
  dependencies: {
    'react-native-config': {
      platforms: {
        android: null, // Disable autolinking for Android to avoid New Architecture issues
      },
    },
  },
};