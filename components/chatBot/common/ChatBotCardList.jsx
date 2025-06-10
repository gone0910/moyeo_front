// components/chatBot/common/ChatBotCardList.jsx  가로 스크롤 카드 리스트
import React from 'react';
import { View, StyleSheet, Dimensions, Platform, FlatList } from 'react-native';
import ChatBotCard from './ChatBotCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * (233 / 390);
const CARD_HEIGHT = 156;
const CARD_MARGIN_LEFT = width * (16 / 390);
const CARD_MARGIN_RIGHT = 12;

export default function ChatBotCardList({ data, renderItem }) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item, idx) => idx.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
      }}
      snapToInterval={245} // 예시값 (width+간격)
      decelerationRate="fast"
      renderItem={renderItem}  // 
    />
  );
}
