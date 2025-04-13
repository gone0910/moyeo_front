/*이 예제는 React Native의 기본 Picker 
또는 더 강력한 서드파티 라이브러리인 react-native-picker-select 등을 사용할 수 있지만, 
우선 Expo에서 쉽게 사용할 수 있는 기본 Picker를 활용하여 제작하겠습니다.
Expo SDK 50+부터는 Picker가 deprecated 되어, 
가장 권장되는 패키지인 @react-native-picker/picker를 사용합니다.
npm install @react-native-picker/picker */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

/**
 * 재사용 가능한 드롭다운 컴포넌트
 *
 * @param {string} label - 라벨 텍스트
 * @param {string} selectedValue - 현재 선택된 값
 * @param {function} onValueChange - 값 변경 함수
 * @param {Array} items - 드롭다운 옵션 배열
 */
export default function Dropdown({
  label,
  selectedValue,
  onValueChange,
  items,
}) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          dropdownIconColor="#6B7280" // gray-500
        >
          {items.map((item) => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
              color="#111827" // gray-900
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 20,
    color: '#374151', // gray-700
    marginBottom: 6,
    fontWeight: '500',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 12, // 🔧 메인 컴포넌트 기준
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
