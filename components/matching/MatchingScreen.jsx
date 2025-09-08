// 📁 /components/matching/MatchingScreen.jsx
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, PixelRatio, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts } from 'expo-font';
import HeaderBar from '../../components/common/HeaderBar';

const matchingImage = require('../../assets/images/match_image.jpg');

// ==== 반응형 유틸 (iPhone 13 기준, 소수점 유지) ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  return PixelRatio.roundToNearestPixel(size * scale); // 소수점 유지
}

export default function MatchingScreen() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [fontsLoaded] = useFonts({ KaushanScript: KaushanScript_400Regular });
  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <HeaderBar/>

      {/* Main Section */}
      <View style={styles.centerWrapper}>
        <Text style={styles.title}>
          여행을 함께할{'\n'}
          <Text style={styles.blue}>동행자</Text>를 찾아보세요
        </Text>

        <Text style={styles.subtitle}>
          자신과 일정이 같으며 목적지, 여행성향이
        </Text>
        <Text style={styles.subtitle}>
          비슷한 여행자를 찾아 보실 수 있어요
        </Text>

        {/* 이미지 */}
        <Image source={matchingImage} style={styles.matchingImage} />

        {/* 버튼 */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('MatchingInfo')}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>동행자 찾기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 배경
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', 
  },

  // 본문 레이아웃
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: normalize(24),
    paddingTop: normalize(28, 'height'),     // 상단 여백
  },

  // 타이틀
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
  blue: { color: '#4F46E5' },

  // 서브타이틀(2줄)
  subtitle: {
    fontSize: normalize(17.5),
    fontWeight:400,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    marginTop: normalize(8, 'height'),
    lineHeight: normalize(21, 'height'),
  },

  // 메인 이미지
  matchingImage: {
    width: normalize(264.5),              
    height: normalize(327.5, 'height'),
    borderRadius: normalize(16),
    marginTop: normalize(22, 'height'),
  },

  // CTA 버튼
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
