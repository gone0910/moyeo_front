import { useState, useContext, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import CustomInput from '../common/CustomInput';
import CustomButton from '../common/CustomButton';
import Dropdown from '../common/Dropdown';
import RadioButton from '../common/RadioButton';
import ProfileImagePicker from '../common/ProfileImagePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../contexts/UserContext';
import { registerUser } from '../../api/auth';
import { useNavigation } from '@react-navigation/native';

/**
 * 프로필 정보 입력 (회원가입) 화면
 * 회원가입 화면 (OAuth 신규 유저 대상)
 * - 로그인 시 백엔드가 '회원가입 필요' 예외를 응답한 경우 진입
 * - AsyncStorage에 저장된 임시 토큰을 꺼내 회원가입 요청 시 Authorization 헤더로 전달
 * - 회원가입 성공 시 최종 user 정보 저장 + Home 화면 이동
 */

export default function UserInfoScreen() {
  const navigation = useNavigation();
  const { setUser } = useContext(UserContext);

  const [image, setImage] = useState(null);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [mbti, setMbti] = useState('');

  // 앱 진입 시 임시 토큰 로드
  const [tempToken, setTempToken] = useState(null);

  useEffect(() => {
    const loadTempToken = async () => {
      const token = await AsyncStorage.getItem('tempToken');
      setTempToken(token);
    };
    loadTempToken();
  }, []);

  // 회원가입 완료 버튼 클릭 시 실행
  const handleComplete = async () => {
    if (!tempToken) {
      Alert.alert('에러', '임시 토큰이 없습니다. 로그인부터 다시 시도해주세요.');
      return;
    }

    const newUser = { nickname, age, gender, mbti, image };

    try {
      // 서버에 회원가입 요청 (임시 토큰을 Authorization 헤더로 전달)
      const user = await registerUser(newUser, tempToken);

      // 전역 상태 + 자동 로그인 정보 저장
      setUser(user);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.removeItem('tempToken');
      navigation.replace('Home');
    } catch (e) {
      console.error('회원가입 실패:', e);
      Alert.alert('회원가입 실패', '다시 시도해주세요.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-8 pt-12">
      <View className="items-center mb-6">
        <ProfileImagePicker onChange={setImage} />
      </View>

      <CustomInput
        label="닉네임"
        placeholder="닉네임을 입력하세요"
        value={nickname}
        onChangeText={setNickname}
      />

      <CustomInput
        label="나이"
        placeholder="나이를 입력하세요"
        value={age}
        keyboardType="numeric"
        onChangeText={setAge}
      />

      <View className="flex-row items-center space-x-8 mb-4">
        <RadioButton
          label="남성"
          selected={gender === 'male'}
          onPress={() => setGender('male')}
        />
        <RadioButton
          label="여성"
          selected={gender === 'female'}
          onPress={() => setGender('female')}
        />
      </View>

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
        onPress={handleComplete}
        className="mt-4"
      />
    </ScrollView>
  );
}