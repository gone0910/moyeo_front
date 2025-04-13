import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * 공통 버튼 컴포넌트
 *
 * @param {string} label - 버튼에 표시될 텍스트
 * @param {function} onPress - 버튼 클릭 시 실행 함수
 * @param {boolean} disabled - 버튼 비활성화 여부
 * @param {object} style - 외부에서 추가하고 싶은 스타일 (선택)
 */
export default function CustomButton({ label, onPress, disabled = false, style }) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled ? styles.disabled : styles.enabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12, // 모든 버튼은 radius 12
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  enabled: {
    backgroundColor: '#000', // 기본: 검정
  },
  disabled: {
    backgroundColor: '#ccc', // 비활성화 시 회색
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  disabledText: {
    color: '#eee',
  },
});