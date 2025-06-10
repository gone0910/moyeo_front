const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// 기본 설정 가져오기
const config = getDefaultConfig(__dirname);

// SVG 관련 설정 병합
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// NativeWind 설정 적용
module.exports = withNativeWind(config, { input: './global.css' });