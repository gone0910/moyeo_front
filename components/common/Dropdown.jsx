/*이 예제는 React Native의 기본 Picker 
또는 더 강력한 서드파티 라이브러리인 react-native-picker-select 등을 사용할 수 있지만, 
우선 Expo에서 쉽게 사용할 수 있는 기본 Picker를 활용하여 제작하겠습니다.
Expo SDK 50+부터는 Picker가 deprecated 되어, 
가장 권장되는 패키지인 @react-native-picker/picker를 사용합니다.
npm install @react-native-picker/picker */

import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

/**
 * 재사용 가능한 드롭다운 컴포넌트
 *
 * @param {string} label - 드롭다운 라벨 텍스트 (옵션)
 * @param {string} selectedValue - 현재 선택된 값
 * @param {function} onValueChange - 값 변경 시 호출되는 함수
 * @param {Array} items - 드롭다운 옵션 배열 [{ label: '보기용', value: '실제값' }]
 * @param {string} className - 추가 Tailwind 스타일 (옵션)
 */
export default function Dropdown({
  label,
  selectedValue,
  onValueChange,
  items,
  className,
}) {
  return (
    <View className={`w-full mb-4 ${className}`}>
      {/* 드롭다운 라벨 (선택적) */}
      {label && <Text className="text-gray-700 mb-1 font-medium">{label}</Text>}

      {/* 드롭다운 선택 영역 */}
      <View className="border border-gray-300 rounded-lg bg-white px-2 py-1">
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          dropdownIconColor="#6B7280"
        >
          {items.map((item) => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
              color="#111827"
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}
