import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * 프로필 사진 선택 컴포넌트
 * - 원형 이미지 UI
 * - 이미지 선택 시 상위 컴포넌트로 uri 전달
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
      <Text style={styles.guideText}>프로필 사진을 선택하세요.</Text>

      <TouchableOpacity onPress={pickImage}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
          />
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
  guideText: {
    fontSize: 20,
    color: '#4B5563', // gray-600
    marginBottom: 8,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60, // 원형 이미지
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60, // 원형
    backgroundColor: '#E5E7EB', // gray-200
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF', // gray-400
  },
});
