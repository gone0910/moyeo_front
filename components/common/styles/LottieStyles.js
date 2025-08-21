// components/common/styles/LottieStyles.js
// components/common/LottieLoader.jsx 전용 StyleSheet

import { StyleSheet } from 'react-native';

export const LottieStyles = StyleSheet.create({
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredMedium: {
    width: 200,
    height: 200,
    alignSelf: 'center',
  },
  fullScreen: {
    width: '100%',
    height: '100%',
  },
});
