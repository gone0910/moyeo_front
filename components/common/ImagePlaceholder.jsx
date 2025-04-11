import { View, Text } from 'react-native';

/**
 * 이미지 자리를 임시로 표시할 플레이스홀더 컴포넌트
 *
 * @param {number|string} width - 너비
 * @param {number|string} height - 높이
 * @param {string} label - 표시할 텍스트
 * @param {string} className - 추가 스타일
 */
export default function ImagePlaceholder({ width, height, label, className }) {
  return (
    <View
      style={{ width, height }}
      className={`bg-gray-200 rounded-lg items-center justify-center ${className}`}
    
    >
      <Text className="text-gray-500">{label}</Text>
    </View>
  );
}
