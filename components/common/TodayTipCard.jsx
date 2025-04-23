import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * 오늘의 여행 Tip 카드 컴포넌트
 * - HomeScreen에서 사용
 * - `배경색`, `제목 색`, `본문 색`을 props로 받아 스타일링 가능
 * - props란? → 부모 컴포넌트(HomeScreen)에서 값을 전달해주는 방식
 *   예: <TodayTipCard backgroundColor="#FEF3C7" titleColor="#014421" textColor="#374151" />
 */

const travelTips = [
  '국내선 항공권은 출발 1시간 전에 도착하는 것이 좋아요.',
  'KTX 예약은 주말엔 최소 3일 전에 해두는 게 안전해요.',
  '도심 여행은 지하철역 근처 숙소가 이동에 편리해요.',
  '제주도는 날씨 변화가 심하니 얇은 겉옷을 챙기세요.',
  '숙소 체크인 시간과 위치를 미리 확인해두세요.',
  '버스/지하철 교통카드는 티머니 하나면 전국 사용 가능해요.',
  '자주 붐비는 식당은 네이버/카카오 예약이 가능해요.',
  '산이나 계곡 여행 시 미끄럼 방지 신발은 필수!',
];

export default function TodayTipCard({
  backgroundColor = '#FFFFFF', // ❗기본값: 흰색 (색상 전달 안 해도 동작)
  titleColor = '#000000',      // ❗기본값: 검정
  textColor = '#333333'        // ❗기본값: 어두운 회색
}) {
  const tip = travelTips[new Date().getDate() % travelTips.length];

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.header}>
        <Feather name="info" size={20} color={titleColor} />
        <Text style={[styles.title, { color: titleColor }]}>오늘의 여행 Tip</Text>
      </View>
      <Text style={[styles.tip, { color: textColor }]}>{tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 32,
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12, // 메인 컴포넌트 규칙
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  tip: {
    fontSize: 16,
    lineHeight: 24,
  },
});
