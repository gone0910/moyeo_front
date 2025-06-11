import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  PixelRatio,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking'; // ✅ 딥링크 파싱용 추가

import { UserContext } from '../../contexts/UserContext';
import ProfileImagePicker from '../common/ProfileImagePicker';
import Dropdown from '../common/Dropdown'; // DropdownPicker 기반 Dropdown
import { registerUserWithFetch, getUserInfoWithFetch } from '../../api/auth_fetch'; // 회원가입은 fetch 사용
import { MaterialIcons } from '@expo/vector-icons'; 

// ==== 반응형 유틸 함수 ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390; // iPhone 13 기준
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

export default function UserInfoScreen() {
  const navigation = useNavigation();
  const { setUser } = useContext(UserContext);

  const [image, setImage] = useState(null);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [mbti, setMbti] = useState('');

  const parsedAge = parseInt(age);
  const isValid = nickname.length > 0 && gender && !isNaN(parsedAge) && parsedAge >= 10 && parsedAge <= 99;
  
  // 프로필 이미지 삭제 버튼
  const handleDeleteProfileImage = () => {
  Alert.alert(
    '이미지 삭제',
    '이미지를 삭제하시겠습니까?',
    [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        onPress: () => setImage(null),
        style: 'destructive',
      },
    ],
    { cancelable: true }
  );
};

  useEffect(() => {
    const handleInitialLink = async () => {
      const url = await Linking.getInitialURL();
      if (!url) return;
      const { queryParams } = Linking.parse(url);
      const mode = queryParams?.mode;
      const token = queryParams?.token;
      if (mode === 'register' && token) {
        await AsyncStorage.setItem('jwt', token);
        console.log('✅ 신규 사용자 토큰 저장 완료');
      }
    };
    handleInitialLink();
  }, []);

  // 가입 시작하기 (회원가입 요청)
  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('jwt');
    const isMock = await AsyncStorage.getItem('mock');

    const userData = {
      nickname,
      gender: gender === '남성' ? 'MALE' : gender === '여성' ? 'FEMALE' : '',
      age: parseInt(age),
      mbti: mbti === '' ? null : mbti,
    };

    if (isMock === 'true') {
      const mockUser = {
        ...userData,
        profileImageUrl: image?.uri || null,
      };
      setUser(mockUser);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      navigation.replace('BottomTab');
      return;
    }

    try {
      const result = await registerUserWithFetch(userData, image, token); // fetch 함수 호출
      console.log(' registerUser 응답:', result);

      const newToken = result.token || token;
      if (result.token) {
        console.log('✅ 정식 JWT 토큰이 응답에 포함됨:', result.token);
      } else {
        console.warn('⚠️ 응답에 정식 토큰 없음 → 임시 토큰 계속 사용');
      }

      const newUser = await getUserInfoWithFetch(newToken); // fetch 함수 사용
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      await AsyncStorage.setItem('jwt', newToken);

      Alert.alert('완료', '회원가입이 완료되었습니다.');
      navigation.replace('BottomTab');
    } catch (e) {
    let errorMessage = '회원가입에 실패했습니다.';
    try {
      const data = JSON.parse(e.message);
      if (data?.message === 'Nickname already exists') {
        errorMessage = '중복된 닉네임입니다.';
      }
    } catch {}
    Alert.alert('오류', errorMessage);
  }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>회원가입</Text>
          <View style={styles.headerLine} />
        </View>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
          <ProfileImagePicker defaultImage={image} onChange={setImage} />

          {/* 이미지 삭제 버튼, 임시 */}
          {image && typeof image === 'object' && image.uri && (
  <TouchableOpacity
    onPress={handleDeleteProfileImage}
    style={styles.deleteButton}
    accessibilityLabel="프로필 사진 삭제"
  >
    <MaterialIcons name="cancel" size={normalize(36)} color="#FF5555" />
  </TouchableOpacity>
)}

          <View style={styles.formGrouped}>
            <Text style={styles.label}>닉네임<Text style={styles.asterisk}> *</Text></Text>

            <TextInput
              style={styles.input}
              placeholder="닉네임을 입력해 주세요"
              placeholderTextColor="#A0A0A0"
              value={nickname}
              onChangeText={(text) => {
                if (text.length <= 12) setNickname(text);
              }}
            />
          </View>
          <Text style={styles.labels}>성별<Text style={styles.asterisk}> *</Text></Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[styles.genderButton, gender === '남성' && styles.genderSelected]}
              onPress={() => setGender(gender === '남성' ? '' : '남성')}
            >
              <Text style={[styles.genderText, gender === '남성' && styles.genderTextSelected]}>남성</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, gender === '여성' && styles.genderSelected]}
              onPress={() => setGender(gender === '여성' ? '' : '여성')}
            >
              <Text style={[styles.genderText, gender === '여성' && styles.genderTextSelected]}>여성</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>나이<Text style={styles.asterisk}> *</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="나이를 입력해 주세요"
              placeholderTextColor="#A0A0A0"
              keyboardType="numeric"
              value={age.toString()}
              onChangeText={(text) => {
                const num = parseInt(text);
                if (!isNaN(num) && num >= 0 && num <= 99) setAge(num);
                else if (text === '') setAge('');
              }}
            />
          </View>
          <View style={[styles.formGroups]}>
            <Text style={styles.mbtiLabel}>MBTI 선택</Text>
            <Dropdown
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
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !isValid && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid}
          >
            <Text style={styles.submitText}>시작하기</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ======= 반응형 스타일 =======
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F9FB',
  },
  headerContainer: {
    alignItems: 'center',
  },
  headerText: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: '#333',
    marginTop: normalize(0, 'height'),
    marginBottom: normalize(5, 'height'),
    letterSpacing: -0.3,
  },
  headerLine: {
    width: '90%',
    marginBottom: normalize(24, 'height'),
    marginTop: normalize(6, 'height'),
    height: normalize(1, 'height'),
    backgroundColor: '#E5E7EB',
    borderRadius: normalize(2),
  },
  notice: {
    fontSize: normalize(14),
    color: '#EF4444',
    marginBottom: normalize(16, 'height'),
  },
  container: {
    paddingHorizontal: normalize(20),
    paddingTop: normalize(16, 'height'),
    paddingBottom: normalize(90, 'height'),
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: normalize(30, 'height'),
    borderRadius: normalize(8),
    width: '100%',
    paddingHorizontal: normalize(4),
    minHeight: normalize(54, 'height'),
  },
  formGroups: {
    marginBottom: normalize(30, 'height'),
    marginTop: -normalize(6, 'height'),
    borderRadius: normalize(8),
    width: '100%',
    paddingHorizontal: normalize(4),
  },
  formGrouped: {
    marginBottom: normalize(30, 'height'),
    borderRadius: normalize(8),
    width: '100%',
    paddingHorizontal: normalize(4),
    minHeight: normalize(54, 'height'),
  },
  label: {
    fontSize: normalize(16),
    color: '#373737',
    marginBottom: normalize(7, 'height'),
    lineHeight: normalize(20, 'height'),
    fontWeight: '500',
  },
  labelss: {
    fontSize: normalize(16),
    color: '#373737',
    marginBottom: normalize(7, 'height'),
    lineHeight: normalize(20, 'height'),
    fontWeight: '500',
    right: normalize(157),
  },
  labels: {
    fontSize: normalize(16),
    color: '#373737',
    marginBottom: normalize(7, 'height'),
    lineHeight: normalize(20, 'height'),
    fontWeight: '500',
    right: normalize(150),
  },
  asterisk: {
  color: '#EF4444',   // 빨간색
  fontWeight: 'bold',
  fontSize: 18,
  },
  input: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(10, 'height'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: normalize(8),
    backgroundColor: '#fff',
    fontSize: normalize(16),
    minHeight: normalize(40, 'height'),
    marginBottom: 2,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: normalize(30, 'height'),
    paddingHorizontal: normalize(2),
    gap: normalize(6),
  },
  genderButton: {
    flex: 1,
    paddingHorizontal: normalize(4),
    paddingVertical: normalize(11, 'height'),
    marginHorizontal: normalize(3),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: normalize(8),
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  genderSelected: {
    backgroundColor: '#B5A7F6',
    borderColor: '#7C5DE3',
  },
  genderText: {
    color: '#999',
    fontSize: normalize(15),
    fontWeight: '500',
  },
  genderTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  mbtiLabel: {
    fontSize: normalize(16),
    color: '#373737',
    marginBottom: normalize(7, 'height'),
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: normalize(16, 'height'),
    borderRadius: normalize(8),
    alignItems: 'center',
    width: '100%',
    marginTop: normalize(14, 'height'),
    marginBottom: normalize(22, 'height'),
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#ffffff',
    fontSize: normalize(18),
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: normalize(18),
    backgroundColor: 'transparent',
  },
  deleteButton: {
    position: 'absolute',
    top: normalize(20, 'height'),
    right: normalize(110),
    backgroundColor:"#fff",
    borderRadius: normalize(20),
    elevation: 3,
    zIndex: 5,

  },
});
