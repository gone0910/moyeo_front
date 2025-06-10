// components/chatBot/BotButton.jsx  챗봇 전용 버튼
// 역할: 챗봇 말풍선 내에서 사용되는 공통 버튼. isActive/disabled에 따라 컬러 변경, 클릭 비활성 지원.

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
const scale = (size) => width * (size / 390); // 아이폰13 기준

const BotButton = ({ title, onPress, isActive = true }) => (
  <TouchableOpacity
    onPress={isActive ? onPress : undefined}
    style={[styles.button, !isActive && styles.buttonDisabled]}
    disabled={!isActive}
    activeOpacity={0.8}
  >
    <Text style={[styles.buttonText, !isActive && styles.textDisabled]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    height: scale(28),                 
    borderRadius: scale(6),             
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: scale(4),          
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: '#fff',
    fontSize: scale(14),               
  },
  textDisabled: {
    color: '#B0B0B0',
  },
});

export default BotButton;
