// components/common/LottieLoader.jsx
// 로티파일즈 로딩용 애니메이션 [버스]

import React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import { LottieStyles } from './styles/LottieStyles';

const LottieLoader = () => {
  return (
    <View style={LottieStyles.loaderContainer}>
      <LottieView
        source={require('../../assets/animations/LoadingBus.json')}
        autoPlay
        loop
        speed={1.2}
        style={LottieStyles.centeredMedium}
      />
    </View>
  );
};

export default LottieLoader;
