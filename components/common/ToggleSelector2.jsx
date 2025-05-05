// components/common/ToggleSelector2.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ToggleSelector2({ items, selectedItem, onSelect, size = 'large' }) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isSelected = selectedItem === item;
        return (
          <TouchableOpacity
            key={item}
            onPress={() => onSelect(item)}
            style={[
              styles.toggle,
              size === 'small' ? styles.small : styles.large,
              isSelected && styles.selectedToggle,
            ]}
          >
            <Text style={[styles.toggleText, isSelected && styles.selectedText]}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap', // ✅ 줄바꿈!
    gap: 8,           // 버튼 사이 여백
  },
  toggle: {
    borderWidth: 1,
    borderColor: '#726BEA',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,  // 아래 여백
    marginRight:8,
    marginTop:-1
  },
  selectedToggle: {
    backgroundColor: '#B3A4F7',
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
  toggleText: {
    fontSize: 14,
    color: '#373737',
  },
  selectedText: {
    color: '#FFFFFF',
  },
});
