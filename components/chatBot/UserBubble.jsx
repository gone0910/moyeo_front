// components/chatBot/BotButton.jsx  챗봇 전용 버튼
// 역할: 챗봇 말풍선 내에서 사용되는 공통 버튼. isActive/disabled에 따라 컬러 변경, 클릭 비활성 지원.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UserBubble = ({ text }) => (
  <View style={styles.userBubble}>
    <Text style={styles.userText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  userBubble: {
    backgroundColor: '#7E7E7E',
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderBottomLeftRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginVertical: 6,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  userText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default UserBubble;
