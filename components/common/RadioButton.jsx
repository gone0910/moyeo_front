import { TouchableOpacity, View, Text } from 'react-native';

/**
 * 재사용 가능한 라디오 버튼 컴포넌트
 *
 * @param {string} label - 라디오 버튼 텍스트
 * @param {boolean} selected - 선택 여부
 * @param {function} onPress - 클릭 시 호출되는 함수
 */
export default function RadioButton({ label, selected, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center mb-2">
      <View className={`h-5 w-5 rounded-full border border-gray-400 items-center justify-center`}>
        {selected && <View className="h-3 w-3 bg-blue-500 rounded-full" />}
      </View>

      {/*라디오 버튼사이 간격 */}
      <Text className="ml-2 text-gray-800">{label}</Text>
    </TouchableOpacity>
  );
}
