// components/chatBot/BotBubble.jsx  챗봇 말풍선
// 역할: 챗봇이 출력하는 말풍선 컴포넌트. 버튼/텍스트 포함, 활성/비활성 상태에 따라 컬러·스타일 변경.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BotBubble = ({ children, isActive, style }) => (
  <View style={[styles.bubble, !isActive && styles.bubbleDisabled, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  bubble: {
    // 디자인 반영
    padding: 18,
    borderRadius: 20,
    borderTopLeftRadius: 0,
    borderWidth: 3,
    borderColor: '#928CFF',
    backgroundColor: '#fff',
    marginVertical: 6,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  bubbleDisabled: {
    backgroundColor: '#EAEAEA',
    borderColor: '#BDBDBD',
  },
});

export default BotBubble;
