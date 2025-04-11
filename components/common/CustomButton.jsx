import { TouchableOpacity, Text } from 'react-native';

/**
 * 재사용 가능한 버튼 컴포넌트
 *
 * @param {string} label - 버튼에 표시될 텍스트
 * @param {function} onPress - 버튼 클릭 시 실행되는 함수
 * @param {string} className - Tailwind 추가 클래스 (옵션)
 * @param {boolean} disabled - 버튼 비활성화 여부 (기본값 false)
 */
export default function CustomButton({ label, onPress, className, disabled = false }) {
  return (
    <TouchableOpacity
      // 버튼 활성화 여부에 따라 배경색 변경
      className={`w-full py-3 rounded-lg items-center justify-center ${
        disabled ? 'bg-gray-400' : 'bg-blue-500'
      } ${className}`}
      onPress={onPress}
      disabled={disabled} // 버튼 활성화 상태 제어
    >
      {/* 버튼 라벨 텍스트 */}
      <Text className="text-white text-base font-semibold">
        {label}
      </Text>
    </TouchableOpacity>
  );
}
