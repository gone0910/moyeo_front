// components/chatBot/common/ChatBotCard.jsx  단일 카드 UI
import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const vScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

export default function ChatBotCard({ children, style, height, noPadding, noShadow  }) {
  // [CHANGED] 기본은 그림자 없이 (피그마는 라인/보더 중심)
  if (noShadow) {
    return (
      <View
        style={[
          styles.cardContainer,
          style,
          height ? { height } : {},
          noPadding && { paddingVertical: 0, paddingHorizontal: 0 },
        ]}
      >
        {children}
      </View>
    );
  }
  // [CHANGED] shadowWrapper 유지하되 기본 elevation 낮춤 (옵션성)
  return (
    <View
      style={[
        styles.shadowWrapper,
        height ? { height } : {},
      ]}
    >
      <View
        style={[
          styles.cardContainer,
          style,
          noPadding && { paddingVertical: 0, paddingHorizontal: 0 },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    // [CHANGED] 그림자 강도 완화
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
    borderRadius: scale(9),
    marginLeft: scale(0),   // [CHANGED] 리스트에서 간격 제어
    marginRight: scale(0),
    marginTop: vScale(0),
    marginBottom: vScale(0),
  },

  cardContainer: {
    // [CHANGED] 피그마 사이즈 반영
    width: scale(233),
    //height: vScale(172),
    minHeight: vScale(205),

    // [CHANGED] 피그마 보더/라운드
    borderRadius: scale(9),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D7FF',

    // [CHANGED] 여백/정렬
    overflow: 'hidden',
    justifyContent: 'flex-start',

    // [REMOVED] 기존 margin/shadow -> 리스트/부모가 담당
  },
});
