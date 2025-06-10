import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, PixelRatio, Platform } from 'react-native';

// ==== 반응형 유틸 함수 (아이폰 13 기준) ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height'
    ? SCREEN_HEIGHT / BASE_HEIGHT
    : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

export default function ToggleSelector2({ items, selectedItem, onSelect, size = 'large' }) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isSelected = selectedItem.includes(item); // ✅ 배열 기반 체크
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
    flexWrap: 'wrap',
    gap: normalize(8),
  },
  toggle: {
    borderWidth: 1,
    borderColor: '#726BEA',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(8, 'height'),
    marginRight: normalize(8),
    marginTop: normalize(-1, 'height'),
  },
  selectedToggle: {
    backgroundColor: '#B3A4F7',
  },
  large: {
    width: normalize(95),
    height: normalize(40, 'height'),
    borderRadius: normalize(12),
  },
  small: {
    width: normalize(76),
    height: normalize(32, 'height'),
    borderRadius: normalize(12),
  },
  toggleText: {
    fontSize: normalize(14),
    color: '#373737',
  },
  selectedText: {
    color: '#FFFFFF',
  },
});
