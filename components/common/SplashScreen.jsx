import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * 임시 스플래시 화면 컴포넌트
 */
export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>moyeo</Text>
      <ActivityIndicator size="large" color="#033690" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7', // ✅ 배경색 변경
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 40, // ✅ 텍스트 크기 확대
    fontWeight: 'bold',
    color: '#033690', // ✅ 텍스트 색상 변경
    marginBottom: 24,
  },
  loader: {
    transform: [{ scale: 1.6 }], // ✅ 로딩 아이콘 크기 확대
  },
});