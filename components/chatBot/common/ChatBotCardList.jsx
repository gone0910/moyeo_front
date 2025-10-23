// components/chatBot/common/ChatBotCardList.jsx  가로 스크롤 카드 리스트
import React from 'react';
import { View, StyleSheet, Dimensions, FlatList } from 'react-native';
import ChatBotCard from './ChatBotCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;

// [ADDED] 피그마 기준 상수
const CARD_WIDTH = scale(233);
const ITEM_GAP = scale(5);
const SNAP_INTERVAL = CARD_WIDTH + ITEM_GAP;

export default function ChatBotCardList({ data, renderItem }) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item, idx) => idx.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      // [ADDED] 좌우 살짝 여백 주고 가운데 느낌 살리기 (원하면 0으로)
      contentContainerStyle={styles.contentContainer}
      ItemSeparatorComponent={() => <View style={{ width: ITEM_GAP }} />} // [ADDED] 카드 사이 5px
      snapToInterval={SNAP_INTERVAL}
      decelerationRate="fast"
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    // 필요시 좌우 패딩 조정
    paddingHorizontal: scale(11),
  },
});
