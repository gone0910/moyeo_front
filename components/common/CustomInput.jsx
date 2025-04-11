import { View, TextInput, Text } from 'react-native';

/**
 * 재사용 가능한 텍스트 입력 필드 컴포넌트
 *
 * @param {string} label - 입력 필드의 라벨 텍스트 (옵션)
 * @param {string} placeholder - 입력 필드 내의 플레이스홀더 텍스트
 * @param {string} value - 입력 필드의 현재 값
 * @param {function} onChangeText - 입력값 변경 시 호출되는 함수
 * @param {boolean} secureTextEntry - 비밀번호 필드 여부 (기본값 false)
 * @param {string} keyboardType - 키보드 타입 지정 (옵션, 예: 'numeric', 'email-address')
 * @param {string} className - 추가 Tailwind 클래스 (옵션)
 */
export default function CustomInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  className,
}) {
  return (
    <View className={`w-full mb-4 ${className}`}>
      {/* 입력 필드 라벨 (선택적) */}
      {label && (
        <Text className="text-gray-700 mb-1 font-medium">
          {label}
        </Text>
      )}
      {/* 텍스트 입력 필드 */}
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white focus:border-blue-500"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}
