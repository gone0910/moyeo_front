// 📁 components/common/TravelCard.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PixelRatio,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// ==== 반응형 유틸 함수 (iPhone 13 기준) ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale =
    based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

/**
 * 하나의 여행 플랜을 표시하는 카드 컴포넌트입니다.
 * - 최대 4개의 장소만 표시하고, 5개 이상일 경우 '...'(more-horiz 아이콘)을 추가로 표시합니다.
 * - 여행 제목, 기간, D-Day를 함께 표시합니다.
 *
 * @param {string} title - 여행 제목
 * @param {string} dDay - D-Day 문자열
 * @param {string} period - 여행 기간
 * @param {string[]} route - 여행 코스 배열
 * @param {Function} onPress - 카드 클릭 시 실행될 함수
 */
export default function TravelCard({ title, dDay, period, route, onPress }) {
  const isLong = route.length > 4;
  const shownRoute = route.slice(0, 4).join('   ▶   ');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.dday}>{dDay}</Text>
        </View>

        <Text style={styles.period}>{period}</Text>

        <View style={styles.routeWrapper}>
          <Text style={styles.route}>{shownRoute}</Text>
          {isLong && (
            <MaterialIcons
              name="more-horiz"
              size={normalize(20)}
              color="#7E7E7E"
              style={{ marginTop: normalize(19, 'height') }}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: normalize(360),
    height: normalize(100, 'height'),
    backgroundColor: '#fff',
    borderRadius: normalize(20),
    paddingVertical: normalize(28, 'height'),
    paddingHorizontal: normalize(20),
    marginBottom: normalize(10),
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: normalize(6),
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: normalize(-2, 'height'),
  },
  title: {
    fontSize: normalize(16),
    fontWeight: '400',
    color: '#373737',
    marginBottom: normalize(-5),
  },
  dday: {
    fontFamily: 'Inter_700Bold',
    fontSize: normalize(24),
    marginTop: normalize(10, 'height'),
    color: '#4F46E5',
    letterSpacing: 0,
  },
  period: {
    fontFamily: 'Inter_400Regular',
    fontSize: normalize(14),
    color: '#7E7E7E',
    top: normalize(0, 'height'),
    letterSpacing: 0,
  },
  routeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: normalize(8, 'height'),
    gap: normalize(4),
  },
  route: {
    fontFamily: 'Roboto_400Regular',
    fontSize: normalize(11),
    color: '#7E7E7E',
    marginTop: normalize(7, 'height'),
    letterSpacing: -0.5,
    flexShrink: 1,
  },
});
