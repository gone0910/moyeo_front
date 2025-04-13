import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

/**
 * 재사용 가능한 텍스트 입력 필드 컴포넌트
 *
 * @param {string} label - 라벨 텍스트 (옵션)
 * @param {string} placeholder - 입력 안내 문구
 * @param {string} value - 현재 값
 * @param {function} onChangeText - 값 변경 핸들러
 * @param {boolean} secureTextEntry - 비밀번호 입력 여부
 * @param {string} keyboardType - 키보드 타입 ('numeric', 'email-address' 등)
 * @param {object} style - 외부 스타일 덮어쓰기 (옵션)
 */
export default function CustomInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  style = {},
}) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor="#9CA3AF" // gray-400
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 20, // 🔧 라벨 폰트 크기
    color: '#374151', // gray-700
    marginBottom: 6,
    fontWeight: '500', // 중간 굵기
  },
  input: {
    fontSize: 20, // 🔧 일반 텍스트
    backgroundColor: '#ffffff',
    borderColor: '#D1D5DB', // gray-300
    borderWidth: 1,
    borderRadius: 12, // 🔧 메인 컴포넌트 radius
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
