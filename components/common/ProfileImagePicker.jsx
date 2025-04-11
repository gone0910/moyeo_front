import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Image, TouchableOpacity, Text } from 'react-native';

/**
 * 프로필 사진 선택 컴포넌트 (원형 UI + 안내문구)
 */
export default function ProfileImagePicker({ onChange, defaultImage }) {
  const [imageUri, setImageUri] = useState(defaultImage || null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      onChange && onChange(uri);
    }
  };

  return (
    <View className="items-center mb-6">
      {/* 안내문구 */}
      <Text className="text-gray-600 mb-2">프로필 사진을 선택하세요.</Text>

      {/* 터치 가능한 원형 이미지 or 공백 */}
      <TouchableOpacity onPress={pickImage}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: 120, height: 120, borderRadius: 60 }}
          />
        ) : (
          <View className="w-[120px] h-[120px] rounded-full bg-gray-200 items-center justify-center">
            <Text className="text-gray-400 text-xs">선택</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
