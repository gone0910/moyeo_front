import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * 프로필 사진 선택 컴포넌트
 * - Expo ImagePicker 기반
 * - 선택한 이미지의 uri, name, type 정보를 상위로 전달함
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
      const asset = result.assets[0];

      // ✅ Axios에서 multipart/form-data로 전송 가능한 구조로 가공
      const imageObject = {
        uri: asset.uri,
        name: asset.fileName || 'profile.jpg',   // fileName이 없을 수도 있으니 기본값 설정
        type: asset.type || 'image/jpeg',        // type도 없으면 기본값 설정
      };

      setImageUri(asset.uri);
      onChange && onChange(imageObject); // ✅ 전체 이미지 객체 전달
    }
  };

  return (
    <View style={styles.container}>
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
    // marginTop -45은  안드로이드에서 화면 밖 나감.
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
