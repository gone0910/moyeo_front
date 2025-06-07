// 📁 components/common/ToggleSelector.jsx
// MatchingInfoScreen.jsx 전용 - '선택없음' 선택 시 다른 항목 비활성화 지원

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ToggleSelector({
  items,
  selectedItem,
  onSelect,
  size = 'large',
  disableOnNone = true, // ✅ 기본값 true: '선택없음' 선택 시 나머지 비활성화
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
      {items.map((item) => {
        const isSelected = 
        (item === '선택없음' && (selectedItem === '' || selectedItem === '선택없음')) ||
        selectedItem === item;
        const isDisabled =
          disableOnNone && selectedItem === '선택없음' && item !== '선택없음'; // ✅ 조건부 비활성화

        return (
          <TouchableOpacity
            key={item}
            onPress={() => {
              if (item === '선택없음') {
                // '선택없음'을 다시 누르면 선택 초기화
                if (isSelected) {
                  onSelect('');
                } else {
                  onSelect('선택없음');
                }
                return;
              }

              // 일반 항목 클릭
              onSelect(item);
            }}
            style={[
              styles.toggle,
              size === 'small'
                ? styles.small
                : size === 'middle'
                ? styles.middle
                : styles.large, // Fixed conditional for size
              isSelected && styles.selectedToggle,
              isDisabled && styles.disabledToggle,
            ]}
            activeOpacity={0.7}
            disabled={isDisabled} // ✅ 실제 클릭 방지
          >
            <Text
              style={[
                styles.toggleText,
                size === 'small'
                  ? styles.smallText
                  : size === 'middle'
                  ? styles.middleText
                  : styles.largeText, // Fixed conditional for size
                isSelected && styles.selectedText,
                isDisabled && styles.disabledText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginTop: 8,
    paddingLeft: 1,
  },
  toggle: {
    borderWidth: 1,
    borderColor: '#726BEA',
    backgroundColor: '#FFFFFF',
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedToggle: {
    backgroundColor: '#B3A4F7',
    borderColor: '#726BEA',
  },
  large: {
    width: 95,
    height: 40,
    borderRadius: 12,
  },
  small: {
    width: 76,
    height: 32,
    borderRadius: 12,
  },
  middle: { // Added middle size style
    width: 95,
    height: 40,
    borderRadius: 12,
  },
  toggleText: {
    fontFamily: 'Roboto',
    color: '#373737',
    fontWeight: '400',
  },
  largeText: {
    fontSize: 14,
  },
  smallText: {
    fontSize: 12,
  },
  middleText: { // Added middle text style
    fontSize: 14,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  disabledToggle: {
    backgroundColor: '#F5F4FA',
    borderColor: '#DDD9F5',
  },
  disabledText: {
    color: '#B3B3B3',
  },
});
