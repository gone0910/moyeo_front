// components/chatBot/common/ChatBotCard.jsx  단일 카드 UI
import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const vScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

export default function ChatBotCard({ children, style, height, noPadding }) {
  return (
    <View
      style={[
        styles.shadowWrapper, // 그림자 랩퍼
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
  shadowWrapper: {         // 아이폰 전용 그림자
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    borderRadius: scale(9),
    marginLeft: scale(20),
    marginRight: scale(8),
    marginTop: vScale(15),
    marginBottom: vScale(15),
  },

  cardContainer: {
    width: scale(253),
    borderRadius: scale(9),
    backgroundColor: '#fff',
    marginLeft: scale(20),
    marginRight: scale(8),
    marginTop: vScale(15),
    marginBottom: vScale(15),
    minHeight: vScale(186),
    overflow: 'hidden',  // 넘치는 요소를 자를 수는 있지만 아이폰 그림자 제거
    shadowColor: '#000',
    shadowOffset: { width: scale(2), height: vScale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(4),
    elevation: 4,
    justifyContent: 'center',
    // paddingVertical: vScale(10),
    // paddingHorizontal: scale(12),
  },
});
