import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { UserContext } from '../../contexts/UserContext';

// 공통 컴포넌트 import
import ProfileImagePicker from '../common/ProfileImagePicker';
import ToggleSelector from '../common/ToggleSelector';
import Dropdown from '../common/Dropdown';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';

// 프로필 편집 화면 (기존 입력 데이터 수정 화면)
export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);

  // 기존 사용자 정보로 초기화
  const [image, setImage] = useState(user?.image || null); // 프로필 이미지 상태
  const [nickname, setNickname] = useState(user?.nickname || ''); // 닉네임 상태 (최대 12자)
  const [age, setAge] = useState(user?.age || ''); // 나이 상태 (10~99 범위)
  const [gender, setGender] = useState(user?.gender || ''); // 성별 상태 ('남성', '여성')
  const [mbti, setMbti] = useState(user?.mbti || ''); // MBTI 상태 (선택사항)

  // 필수 항목 입력 여부 확인
  const isValid = nickname.length > 0 && gender && age >= 10 && age <= 99;

  // 저장 버튼 클릭 시 실행
  const handleSubmit = async () => {
    const updatedUser = { nickname, age, gender, mbti, image };

    try {
      setUser(updatedUser); // 전역 상태 저장
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser)); // 로컬 저장
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
    } catch (e) {
      console.error('프로필 저장 실패:', e);
      Alert.alert('실패', '프로필 저장에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 제목 및 필수항목 안내 */}
        
        <Text style={styles.notice}>*는 필수입력 사항입니다</Text>

        {/* 프로필 이미지 선택 */}
        <ProfileImagePicker defaultImage={image} onChange={setImage} />

        {/* 닉네임 입력 */}
        <CustomInput
          label="닉네임 *"
          placeholder="닉네임을 입력하세요"
          value={nickname}
          onChangeText={(text) => {
            if (text.length <= 12) setNickname(text);
          }}
        />

        {/* 나이 입력 */}
        <CustomInput
          label="나이 *"
          placeholder="나이를 입력하세요"
          value={age.toString()}
          keyboardType="numeric"
          onChangeText={(text) => {
            const num = parseInt(text);
            if (!isNaN(num) && num >= 0 && num <= 99) setAge(num);
            else if (text === '') setAge('');
          }}
        />

        {/* 성별 선택 */}
        <Text style={styles.label}>성별 * </Text>
        <ToggleSelector
          options={['남성', '여성']}
          selected={gender}
          setSelected={(value) => {
            if (gender === value) {
              setGender(''); // 같은 항목 다시 누르면 해제
            } else {
              setGender(value);
            }
          }}
          align="left"
          theme="dark"
        />

        {/* MBTI 선택 (선택사항) */}
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
        <CustomButton
          label="저장하기"
          onPress={handleSubmit}
          disabled={!isValid}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// 스타일 가이드 적용
const styles = StyleSheet.create({
  notice: {
    fontSize: 14,
    color: '#EF4444', // 빨간색 강조
    marginBottom: 16,
  },
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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