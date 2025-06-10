// components/chatBot/BotBubble.jsx  챗봇 말풍선
// 역할: 챗봇이 출력하는 말풍선 컴포넌트. 버튼/텍스트 포함, 활성/비활성 상태에 따라 컬러·스타일 변경.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
const scale = (size) => width * (size / 390); // 아이폰13 기준

const BotBubble = ({ children, isActive, style, custom }) => ( // custom : 로딩 메세지용
  <View style={[
    styles.bubble, !isActive && styles.bubbleDisabled,
    custom === 'loading' && styles.bubbleLoading, style
  ]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  bubble: {
    padding: scale(18),                   
    borderRadius: scale(20),              
    borderTopLeftRadius: 0,
    borderWidth: scale(3),                
    borderColor: '#928CFF',
    backgroundColor: '#fff',
    marginVertical: scale(6),            
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  bubbleDisabled: {
    backgroundColor: '#EAEAEA',
    borderColor: '#BDBDBD',
  },
  bubbleLoading: {
    paddingHorizontal: scale(10),  // ★ 패딩 확 줄이기
    paddingVertical: scale(6),
    minWidth: 0,                   // ★ 최소 가로 제한 제거
    maxWidth: '60%',               // ★ 필요시 최대폭도 줄이기
    alignSelf: 'flex-start',
  },
});

export default BotBubble;
