import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

// 리사이징을 거친 사진의 최대용량 30mb
const MAX_ORIGINAL_SIZE = 30 * 1024 * 1024; // 30MB

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
    let asset = result.assets[0];
    let imageUri = asset.uri;
    let quality = 0.7;
    let resized = null;
    let info = await FileSystem.getInfoAsync(imageUri);

    // 💡 파일 크기가 30MB 초과라면 반복적으로 리사이즈/품질 다운!
    while (info.size > MAX_ORIGINAL_SIZE) {
      // 해상도나 품질을 반복적으로 낮추기 (예시: 90% → 80% → ... 50%)
      if (quality > 0.4) quality -= 0.1;
      resized = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }], // 1200px 이하로 제한 (원한다면 동적으로 줄여도 됨)
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      imageUri = resized.uri;
      info = await FileSystem.getInfoAsync(imageUri);

      // 무한루프 방지: 품질이 0.4 이하로 내려가면 break
      if (quality <= 0.4) break;
    }

    // 최종 크기 로그
    console.log(
      `📏 [리사이즈 후 최종 파일 용량] ${info.size} bytes ≈ ${(info.size / 1024 / 1024).toFixed(2)} MB`
    );

    if (info.size > MAX_ORIGINAL_SIZE) {
      alert('이미지 크기가 30MB를 초과합니다. 더 작은 사진을 선택해 주세요.');
      return;
    }


      // ✅ Axios에서 multipart/form-data로 전송 가능한 구조로 가공
      const imageObject = {
        uri: imageUri,
        name: asset.fileName || 'profile.jpg',   // fileName이 없을 수도 있으니 기본값 설정
        type: asset.type || 'image/jpeg',        // type도 없으면 기본값 설정
      };

      setImageUri(imageUri,);             // ✅ 로컬에서 이미지 미리 보기용
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
    width: 200,
    height: 200,
    borderRadius: 120,
  },
  placeholder: {
    width: 200,
    height: 200,
    borderRadius: 120,
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
