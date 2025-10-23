// 📁 components/common/ToggleSelector4.jsx
// ToggleSelector와 완전히 동일한 디자인 & props
// 배열 기반 중복 선택만 다름

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ToggleSelector4({
  items,
  selectedItems,    // ✅ 배열! (selectedItems: [])
  onSelect,
  size = 'large',
  disableOnNone = true,
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
      {items.map((item) => {
        const isSelected = selectedItems.includes(item)
          || (item === '선택없음' && (selectedItems.length === 0 || selectedItems.includes('선택없음')));
        const isDisabled =
          disableOnNone && selectedItems.includes('선택없음') && item !== '선택없음';

        return (
          <TouchableOpacity
            key={item}
            onPress={() => {
              // '선택없음' 처리: 다시 누르면 전체 해제
              if (item === '선택없음') {
                if (isSelected) {
                  onSelect([]);
                } else {
                  onSelect(['선택없음']);
                }
                return;
              }

              // 일반 항목 클릭 (중복 선택/해제)
              if (selectedItems.includes(item)) {
                // 선택 해제
                onSelect(selectedItems.filter((v) => v !== item));
              } else {
                // 선택 추가 (만약 '선택없음'이 선택되어 있으면 먼저 해제)
                onSelect(selectedItems.filter((v) => v !== '선택없음').concat(item));
              }
            }}
            style={[
              styles.toggle,
              size === 'small'
                ? styles.small
                : size === 'middle'
                ? styles.middle
                : styles.large,
              isSelected && styles.selectedToggle,
              isDisabled && styles.disabledToggle,
            ]}
            activeOpacity={0.7}
            disabled={isDisabled}
          >
            <Text
              style={[
                styles.toggleText,
                size === 'small'
                  ? styles.smallText
                  : size === 'middle'
                  ? styles.middleText
                  : styles.largeText,
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
  middle: {
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
  middleText: {
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
