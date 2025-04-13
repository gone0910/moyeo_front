import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { UserContext } from '../../contexts/UserContext';
import { updateProfile } from '../../api/auth';

import ProfileImagePicker from '../common/ProfileImagePicker';
import ToggleSelector from '../common/ToggleSelector';
import Dropdown from '../common/Dropdown';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);

  // 사용자 기존 정보 불러오기
  const [image, setImage] = useState(user?.image || null);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [age, setAge] = useState(user?.age || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [mbti, setMbti] = useState(user?.mbti || '');

  // 저장 버튼 클릭 시 호출되는 함수
  const handleSubmit = async () => {
    const updated = { nickname, age, gender, mbti, image };

    try {
      const updatedUser = await updateProfile(updated);
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
    } catch (e) {
      console.error('프로필 수정 실패:', e);
      Alert.alert('실패', '프로필 수정에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* 제목 텍스트 */}
        <Text style={styles.header}>프로필 수정</Text>

        {/* 프로필 이미지 선택 */}
        <ProfileImagePicker defaultImage={image} onChange={setImage} />

        {/* 닉네임 입력 */}
        <CustomInput
          label="닉네임"
          placeholder="닉네임을 입력하세요"
          value={nickname}
          onChangeText={setNickname}
        />

        {/* 나이 입력 */}
        <CustomInput
          label="나이"
          placeholder="나이를 입력하세요"
          value={age}
          keyboardType="numeric"
          onChangeText={setAge}
        />

        {/* 성별 선택 - ToggleSelector 사용 */}
        <Text style={styles.label}>성별</Text>
        <ToggleSelector
          options={['선택 안함', '남성', '여성']}
          selected={gender}
          setSelected={setGender}
        />

        {/* MBTI 선택 */}
        <Dropdown
          label="MBTI 선택"
          selectedValue={mbti}
          onValueChange={setMbti}
          items={[
            { label: '선택하지 않음', value: '' },
            { label: 'INTJ', value: 'INTJ' },
            { label: 'INTP', value: 'INTP' },
            { label: 'ENTJ', value: 'ENTJ' },
            { label: 'ENTP', value: 'ENTP' },
            { label: 'INFJ', value: 'INFJ' },
            { label: 'INFP', value: 'INFP' },
            { label: 'ENFJ', value: 'ENFJ' },
            { label: 'ENFP', value: 'ENFP' },
            { label: 'ISTJ', value: 'ISTJ' },
            { label: 'ISFJ', value: 'ISFJ' },
            { label: 'ESTJ', value: 'ESTJ' },
            { label: 'ESFJ', value: 'ESFJ' },
            { label: 'ISTP', value: 'ISTP' },
            { label: 'ISFP', value: 'ISFP' },
            { label: 'ESTP', value: 'ESTP' },
            { label: 'ESFP', value: 'ESFP' },
          ]}
        />

        {/* 저장 버튼 */}
        <CustomButton label="저장하기" onPress={handleSubmit} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 6,
    color: '#374151',
  },
});
