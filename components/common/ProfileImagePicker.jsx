import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * 프로필 사진 선택 컴포넌트
 * - Expo ImagePicker 기반
 * - 선택한 이미지의 uri, name, type 정보를 상위로 전달함
 */
export default function ProfileImagePicker({ onChange, defaultImage, size = 86 }) {
   //  defaultImage가 string이면 그대로, 객체면 uri만 추출
  const [imageUri, setImageUri] = useState(
    typeof defaultImage === 'string' ? defaultImage : defaultImage?.uri || null);


  useEffect(() => {
    const uri = typeof defaultImage === 'string' ? defaultImage : defaultImage?.uri;
    setImageUri(uri || null);
  }, [defaultImage]);
    

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

      //  Axios에서 multipart/form-data로 전송 가능한 구조로 가공
      const imageObject = {
        uri: asset.uri,
        name: asset.fileName || 'profile.jpg',   // fileName이 없을 수도 있으니 기본값 설정
        type: asset.type || 'image/jpeg',        // type도 없으면 기본값 설정
      };

      setImageUri(asset.uri);            
      onChange && onChange(imageObject); 
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        {imageUri ? (
          //  동적 size 적용
          <Image 
            source={{ uri: imageUri }} 
            style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} 
          />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
            <MaterialIcons 
              name= "account-circle"
              size={size * 1.0} // 아이콘 크기를 전체 크기의 70%로 설정
              color="#c4c4c4"
            />
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
    
  },
  placeholder: {
    backgroundColor: '#ffffff', 
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
