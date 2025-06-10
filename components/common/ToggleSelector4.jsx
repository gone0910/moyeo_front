// components/common/ToggleSelector4.jsx 
// ToggleSelector.jsx의 디자인에 기반한 단일이 아닌 중복선택 가능 토글(기존 것은 참조하는데가 너무많아서 생성함.)

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ToggleSelector4({
  items,
  selectedItems,
  onSelect,
  size = 'large',
  disableOnNone = true,
}) {
  const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : []; // 항상 배열 보장.

  const isNoneSelected = selectedItems.includes('선택없음');

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
      {items.map((item) => {
        const isSelected = selectedItems.includes(item);
        const isDisabled =
          disableOnNone && isNoneSelected && item !== '선택없음';

        return (
          <TouchableOpacity
  key={item}
  onPress={() => {
    if (isDisabled) return; // 방어
    if (item === '선택없음') {
      if (isSelected) onSelect([]);
      else onSelect(['선택없음']);
      return;
    }
    if (isSelected) onSelect(safeSelectedItems.filter((v) => v !== item));
    else onSelect(safeSelectedItems.filter((v) => v !== '선택없음').concat(item));
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
    borderRadius: 20,
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
