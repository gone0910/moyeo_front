import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, PixelRatio } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts } from 'expo-font';
import HeaderBar from '../../components/common/HeaderBar';

const PlanImage = require('../../assets/images/Plan_image_new.png');

// 기준 width (iPhone 13)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ✅ 소수점 normalize (반올림 제거)
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  return PixelRatio.roundToNearestPixel(size * scale); // 소수점 유지
}

export default function PlannerScreen() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [fontsLoaded] = useFonts({ KaushanScript: KaushanScript_400Regular });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <HeaderBar />

      {/* Main 안내 문구 */}
      <View style={styles.centerWrapper}>
        <Text style={styles.title}>
          일정만 입력하셔도 {'\n'}
          <Text style={styles.title}>여행 플랜 완성</Text>
        </Text>
        <Text style={styles.desc}>
          내 취향에 맞춘 {'\n'}
          <Text style={styles.desc}>여행 계획을 세워보세요</Text>
        </Text>

      {/* 일러스트 이미지 */}
        <Image source={PlanImage} style={styles.PlanImage} />

      {/* 버튼 */}
        <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => navigation.navigate('PlannerInfoScreen')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.ctaText}>여행 플랜 만들러 가기</Text>
                </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: normalize(24),
    paddingTop: normalize(28, 'height'),     // 상단 여백
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(21.5),
    marginBottom: normalize(3.5),
  },
  logotext: {
    color: '#4F46E5',
    letterSpacing: 0.0,
  },
  profileImage: {
    width: normalize(43.5),
    height: normalize(43.5),
    borderRadius: normalize(21.75),
    backgroundColor: '#EEE',
  },
  profilePlaceholder: {
    width: normalize(43.5),
    height: normalize(43.5),
    borderRadius: normalize(21.75),
    backgroundColor: '#D1D5DB',
  },
  headerLine: {
    height: normalize(1.0, 'height'),
    backgroundColor: '#D1D5DB',
    marginTop: normalize(5.5),
    marginBottom: 0,
    marginHorizontal: normalize(9.5),
  },
  title: {
    fontSize: normalize(24.5),
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontWeight:500,
    marginTop: normalize(36, 'height'),
    marginBottom: normalize(6),
    lineHeight: normalize(34, 'height'),
  },
  desc: {
    fontSize: normalize(17.5),
    fontWeight:400,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    marginTop: normalize(8, 'height'),
    lineHeight: normalize(21, 'height'),
  },
  PlanImage: {
      width: normalize(264.5),              
      height: normalize(327.5, 'height'),
      borderRadius: normalize(16),
      marginTop: normalize(22, 'height'),
    },
  illustrationWrapper: {
    alignItems: 'center',
    marginTop: normalize(49.5),
    marginBottom: normalize(23.5),
  },
  ctaButton: {
    marginTop: normalize(28, 'height'),
    width: normalize(188.5),
    height:normalize(50.5),
    justifyContent: 'center',
    borderRadius: normalize(12),
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    // 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: normalize(16.5),
    fontFamily: 'Pretendard',
    fontWeight: 600,
    textAlign: 'center',
  },
});
