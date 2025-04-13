import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * 범용 토글형 선택 컴포넌트
 * 
 * @param {Array<string>} options - 선택 항목 리스트
 * @param {string} selected - 현재 선택된 값
 * @param {function} setSelected - 선택 변경 시 호출되는 함수
 * @param {string} align - 정렬 방식 ('center', 'left') 중 선택
 * @param {string} theme - 색상 테마 ('dark'이면 검정 강조)
 */
export default function ToggleSelector({
  options = [],
  selected,
  setSelected,
  align = 'center',
  theme = 'light',
}) {
  const isNoneSelected = selected === '선택 안함';
  const containerAlign =
    align === 'left' ? 'flex-start' : 'center';

  return (
    <View style={[styles.container, { justifyContent: containerAlign }]}>
      {options.map((option) => {
        const isSelected = selected === option;
        const isDisabled = isNoneSelected && option !== '선택 안함';
        const isNoneToggle = option === '선택 안함' && isNoneSelected;

        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.option,
              isSelected && (theme === 'dark' ? styles.selectedDark : styles.selectedLight),
              isDisabled && styles.disabledOption,
            ]}
            onPress={() => {
              if (isNoneToggle) {
                setSelected(''); // '선택 안함' 다시 누르면 해제
              } else if (!isDisabled) {
                setSelected(option);
              }
            }}
          >
            <Text
              style={[
                styles.text,
                isSelected && styles.selectedText,
                isDisabled && styles.disabledText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#E5E7EB', // 기본 회색
    marginRight: 12,
    marginBottom: 8,
  },
  selectedLight: {
    backgroundColor: '#3B82F6', // 파랑
  },
  selectedDark: {
    backgroundColor: '#000000', // 검정
  },
  disabledOption: {
    backgroundColor: '#D1D5DB', // 더 흐린 회색
  },
  text: {
    fontSize: 20,
    color: '#374151',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#9CA3AF',
  },
});
