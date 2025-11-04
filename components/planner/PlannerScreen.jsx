// 📁 /screens/planner/PlannerScreen.jsx
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, PixelRatio } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import HeaderBar from '../../components/common/HeaderBar';

const PlanImage = require('../../assets/images/Plan_image_new.png');

// ==== 반응형 유틸 (iPhone 13 기준, 소수점 유지: MatchingScreen과 동일) ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  return PixelRatio.roundToNearestPixel(size * scale);
}

export default function PlannerScreen() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);

  return (
    <View style={styles.container}>
      <HeaderBar />

      {/* Main Section */}
      <View style={styles.centerWrapper}>
        <Text style={styles.title}>
          일정만 입력하셔도 {'\n'}
          <Text style={styles.blue}>여행플랜</Text> 완성
        </Text>

        <Text style={styles.subtitle}>
        여행의 시작은 가볍게, 계획은 단순하게
        </Text>
        <Text style={styles.subtitle}>
        나만의 이야기로 그 여정을 완성해보세요
        </Text>

        {/* 이미지 */}
        <Image source={PlanImage} style={styles.planImage} />

        {/* 버튼 */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('PlannerInfo')}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>여행 플랜 만들러 가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 배경 (MatchingScreen과 동일)
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // 본문 레이아웃 (MatchingScreen과 동일)
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: normalize(24),
    paddingTop: normalize(28, 'height'), // 상단 여백
  },

  // 타이틀 (사이즈/라인하이트/여백 동일)
  title: {
    fontSize: normalize(24.5),
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontWeight: 500,
    marginTop: normalize(36, 'height'),
    marginBottom: normalize(6),
    lineHeight: normalize(34, 'height'),
  },
  blue: { color: '#4F46E5' },

  // 서브타이틀 (MatchingScreen의 subtitle 스타일을 그대로 사용)
  subtitle: {
    fontSize: normalize(17.5),
    fontWeight: 400,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    marginTop: normalize(8, 'height'),
    lineHeight: normalize(21, 'height'),
  },

  // 메인 이미지 (규격 동일)
  planImage: {
    width: normalize(264.5),
    height: normalize(327.5, 'height'),
    borderRadius: normalize(16),
    marginTop: normalize(22, 'height'),
  },

  // CTA 버튼 (규격/그림자 동일)
  ctaButton: {
    marginTop: normalize(28, 'height'),
    width: normalize(188.5),
    height: normalize(50.5),
    justifyContent: 'center',
    borderRadius: normalize(12),
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

  // 버튼 텍스트 (동일)
  ctaText: {
    color: '#FFFFFF',
    fontSize: normalize(18),
    fontFamily: 'Pretendard',
    fontWeight: 600,
    textAlign: 'center',
  },
});
