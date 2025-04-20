import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * 프로필 사진 선택 컴포넌트
 * - 원형 이미지 UI
 * - 이미지 선택 시 상위 컴포넌트로 uri 전달
 * ✅ 안내 텍스트 제거
 * ✅ marginTop: -45 적용 (⚠️ 기기 해상도에 따라 이미지 깨짐 위험 있음)
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
    <View style={styles.container}>
      {/* 안내 텍스트 제거됨 */}
      <TouchableOpacity onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>선택</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    // marginTop : -45는  특정 해상도에서 이미지 깨질 수 있음 (주의) 나 깨짐.
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
