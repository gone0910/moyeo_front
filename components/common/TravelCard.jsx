// 📁 components/common/TravelCard.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * 하나의 여행 플랜을 표시하는 카드 컴포넌트입니다.
 * - 최대 4개의 장소만 표시하고, 5개 이상일 경우 '...'(more-horiz 아이콘)을 추가로 표시합니다.
 * - 여행 제목, 기간, D-Day를 함께 표시합니다.
 *
 * @param {string} title - 여행 제목
 * @param {string} dDay - D-Day 문자열
 * @param {string} period - 여행 기간
 * @param {string[]} route - 여행 코스 배열
 */
export default function TravelCard({ title, dDay, period, route }) {
  const isLong = route.length > 4;
  const shownRoute = route.slice(0, 4).join('   ▶   ');

  return (
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
            size={20}
            color="#7E7E7E"
            style={{ marginTop: 19 }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 36,
    height : 160,
    marginTop: 12,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#000000',
    letterSpacing: 0,
  },
  dday: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#4F46E5',
    letterSpacing: 0,
  },
  period: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#7E7E7E',
    marginTop: 6,
    letterSpacing: 0,
  },
  routeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  route: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 12,
    color: '#7E7E7E',
    marginTop: 16,
    letterSpacing: -0.5,
    flexShrink: 1,
  },
});