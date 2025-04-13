import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

/**
 * 재사용 가능한 드롭다운 컴포넌트 (react-native-dropdown-picker 기반)
 *
 * @param {string} label - 라벨 텍스트
 * @param {string} selectedValue - 현재 선택된 값
 * @param {function} onValueChange - 값 변경 함수
 * @param {Array} items - 드롭다운 옵션 배열 (label, value 포함)
 */
export default function Dropdown({ label, selectedValue, onValueChange, items }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedValue);
  const [options, setOptions] = useState(items);

  const handleChangeValue = (val) => {
    setValue(val);
    onValueChange(val);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <DropDownPicker
        open={open}
        value={value}
        items={options}
        setOpen={setOpen}
        setValue={handleChangeValue}
        setItems={setOptions}
        placeholder="선택해주세요"
        style={styles.dropdown}
        textStyle={styles.text}
        dropDownContainerStyle={styles.dropdownContainer}
        listMode="SCROLLVIEW"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
    zIndex: 10, // 드롭다운 겹침 이슈 해결
  },
  label: {
    fontSize: 20,
    color: '#374151', // gray-700
    marginBottom: 6,
    fontWeight: '500',
  },
  dropdown: {
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
  },
  dropdownContainer: {
    borderColor: '#D1D5DB',
    borderRadius: 12,
  },
  text: {
    fontSize: 20,
    color: '#111827', // gray-900
  },
});
