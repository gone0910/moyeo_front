// screens/planner/PlannerScreen.jsx
import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  PixelRatio,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import HeaderBar from '../../components/common/HeaderBar';

const PlanImage = require('../../assets/images/Plan_image_new.png');

// ===== 반응형 유틸 (iPhone 13 기준 390 x 844) =====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

function normalize(size, based = 'width') {
  const scale =
    based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  const rounded = PixelRatio.roundToNearestPixel(newSize);
  // 안드로이드에서 살짝 크게 나오는 현상 보정
  return Platform.OS === 'ios' ? Math.round(rounded) : Math.round(rounded) - 1;
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function PlannerScreen() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);

  // 기기 비율 기반 동적 사이징 (가드 포함)
  const titleFontSize = clamp(SCREEN_HEIGHT * 0.033, 20, 32);      // 20~32
  const descFontSize = clamp(SCREEN_HEIGHT * 0.0213, 16, 22);      // 16~22 (가이드 본문 20pt 근처)
  const imageWidth = clamp(SCREEN_WIDTH * 0.75, 220, 320);
  const imageHeight = clamp(SCREEN_HEIGHT * 0.39, 260, 360);
  const ctaHeight = clamp(SCREEN_HEIGHT * 0.065, 48, 60);
  const ctaFontSize = clamp(SCREEN_HEIGHT * 0.0213, 16, 22);

  return (
    <View style={styles.container}>
      <HeaderBar />

      <View style={styles.centerWrapper}>
        <Text style={[styles.title, { fontSize: titleFontSize }]}>
          일정만 입력하셔도 {'\n'}
          <Text style={styles.blue}>여행플랜</Text> 완성
        </Text>

        <Text style={[styles.desc, { fontSize: descFontSize }]}>
          내 취향에 맞춘 {'\n'}
          여행 계획을 세워보세요
        </Text>

        <Image
          source={PlanImage}
          style={[
            styles.planImage,
            { width: imageWidth, height: imageHeight },
          ]}
          resizeMode="cover"
        />

        <TouchableOpacity
          style={[styles.ctaButton, { height: ctaHeight }]}
          onPress={() => navigation.navigate('PlannerInfo')}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, { fontSize: ctaFontSize }]}>
            여행 플랜 만들러 가기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#Fafafa',
  },

  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: normalize(20),
    paddingTop: normalize(24, 'height'),
  },

  title: {
    textAlign: 'center',
    fontWeight: '700', // 헤더는 볼드
    lineHeight: normalize(38, 'height'),
    color: '#111827',
  },

  blue: {
    color: '#4F46E5',
  },

  desc: {
    marginTop: normalize(10, 'height'),
    textAlign: 'center',
    color: '#6B7280',
    fontWeight: '400', // 본문 일반 굵기
    lineHeight: normalize(28, 'height'),
  },

  planImage: {
    borderRadius: normalize(16),
    marginTop: normalize(22, 'height'),
    // 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

  ctaButton: {
    width: clamp(SCREEN_WIDTH * 0.9, 280, 360),
    borderRadius: normalize(12),
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: normalize(24, 'height'),
  },

  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
