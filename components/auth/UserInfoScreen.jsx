import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
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

// 회원가입 시 사용자 정보를 입력받는 화면
// 필수 항목: 닉네임, 나이, 성별
export default function UserInfoScreen() {
  const navigation = useNavigation();
  const { setUser } = useContext(UserContext);

  // 프로필 이미지 상태
  const [image, setImage] = useState(null);
  // 닉네임 상태 (최대 12자)
  const [nickname, setNickname] = useState('');
  // 나이 상태 (10~99 범위만 허용)
  const [age, setAge] = useState('');
  // 성별 상태 ('남성', '여성')
  const [gender, setGender] = useState('');
  // MBTI 상태 (선택사항)
  const [mbti, setMbti] = useState('');

  // 닉네임, 성별, 나이가 유효할 경우만 저장 버튼 활성화
  const isValid = nickname.length > 0 && gender && age >= 10 && age <= 99;

  // 저장 버튼 클릭 시 실행되는 함수
  const handleSubmit = async () => {
    const newUser = { nickname, age, gender, mbti, image };

    try {
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      Alert.alert('완료', '회원가입이 완료되었습니다.');
      navigation.replace('BottomTab');                     // BottomTab(하단바 로딩 후 홈화면면)
    } catch (e) {
      console.error('저장 오류:', e);
      Alert.alert('오류', '회원가입이 실패하였습니다다.');
    }
  };

  // 뒤로가기 이벤트 리스너 등록
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // 기본 뒤로가기 허용
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}> 
      <ScrollView contentContainerStyle={styles.container}>
        {/* 화면 전체 폼을 스크롤 가능하도록 구성 */}
        
        <Text style={styles.notice}>*는 필수입력 사항입니다</Text>

        <ProfileImagePicker onChange={setImage} />

        <CustomInput
          label="닉네임 *"
          placeholder="닉네임을 입력하세요"
          value={nickname}
          onChangeText={(text) => {
            if (text.length <= 12) setNickname(text);
          }}
        />

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

        <Text style={styles.label}>성별 *</Text>
        <ToggleSelector
          options={['남성', '여성']}
          selected={gender}
          setSelected={(value) => {
            if (gender === value) {
              setGender('');
            } else {
              setGender(value);
            }
          }}
          align="left" // 좌측 정렬 추가
          theme="dark" // 선택 시 검정색 강조
        />

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

        <CustomButton
          label="회원가입 완료"
          onPress={handleSubmit}
          disabled={!isValid}
          
        />
      </ScrollView>
    </SafeAreaView>
  );
}

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
