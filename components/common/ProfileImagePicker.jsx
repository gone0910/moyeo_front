import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * 프로필 사진 선택 컴포넌트
 * - Expo ImagePicker 기반
 * - 선택한 이미지의 uri, name, type 정보를 상위로 전달함
 */
export default function ProfileImagePicker({ onChange, defaultImage }) {
   //  defaultImage가 string이면 그대로, 객체면 uri만 추출
  const [imageUri, setImageUri] = useState(
    typeof defaultImage === 'string' ? defaultImage : defaultImage?.uri || null);


  useEffect(() => {
    const uri = typeof defaultImage === 'string' ? defaultImage : defaultImage?.uri;
    setImageUri(uri || null);
  }, [defaultImage]);

  // 렌더링:
  <Image source={{ uri: imageUri }} style={styles.image} />
    

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

      setImageUri(asset.uri);             // ✅ 로컬에서 이미지 미리 보기용
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
