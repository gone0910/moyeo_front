// components/chatBot/BotButton.jsx  챗봇 전용 버튼
// 역할: 챗봇 말풍선 내에서 사용되는 공통 버튼. isActive/disabled에 따라 컬러 변경, 클릭 비활성 지원.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
const scale = (size) => width * (size / 390); // 아이폰13 기준

const UserBubble = ({ text }) => (
  <View style={styles.userBubble}>
    <Text style={styles.userText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  userBubble: {
    backgroundColor: '#7E7E7E',
    borderTopLeftRadius: scale(14),         
    borderBottomRightRadius: scale(14),
    borderBottomLeftRadius: scale(14),
    paddingVertical: scale(10),            
    paddingHorizontal: scale(18),         
    marginVertical: scale(6),             
    maxWidth: '80%',
  },
  userText: {
    color: '#fff',
    fontSize: scale(14),                  
    textAlign: 'center',
  },
});

export default UserBubble;
