import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // 뒤로가기 + 로그아웃 아이콘
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { UserContext } from '../../contexts/UserContext';
import ProfileImagePicker from '../common/ProfileImagePicker';
import Dropdown from '../common/Dropdown'; // DropDownPicker 기반

import { editUserProfileWithFetch, getUserInfoWithFetch, urlToBase64ProfileImage } from '../../api/auth_fetch'; // ✅ fetch 기반 API 사용

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


export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);

  const [image, setImage] = useState(null);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [mbti, setMbti] = useState('');

  // 프로필 이미지 삭제 버튼
  const handleRemoveImage = () => {
    Alert.alert(
      '사진 삭제',
      '프로필 사진을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => setImage(null) },
      ]
    );
  };

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('jwt');
      const isMock = await AsyncStorage.getItem('mock');
      if (isMock === 'true') {
        setNickname(user?.nickname || '');
        setGender(user?.gender === 'MALE' ? '남성' : user?.gender === 'FEMALE' ? '여성' : '');
        setAge(user?.age?.toString() || '');
        setMbti(user?.mbti || '');
        setImage(user?.profileImageUrl || null);
      } else {
        try {
          const freshUser = await getUserInfoWithFetch(token);
          setNickname(freshUser.nickname || '');
          setGender(freshUser.gender === 'MALE' ? '남성' : freshUser.gender === 'FEMALE' ? '여성' : '');
          setAge(freshUser.age?.toString() || '');
          setMbti(freshUser.mbti || '');
          setImage(freshUser.profileImageUrl || null);
        } catch (e) {
          console.error('❌ 사용자 정보 조회 실패:', e);
          Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
        }
      }
    };
    init();
  }, []);

  const isValid = nickname.length > 0 && gender && Number(age) >= 13 && Number(age) <= 99;

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('jwt');
    const isMock = await AsyncStorage.getItem('mock');
    const userData = {
      nickname,
      gender,
      age: Number(age),
      mbti: mbti === '' ? null : mbti,
    };

    if (isMock === 'true') {
      const mockUserData = {
        ...userData,
        profileImageUrl: image,
      };
      setUser(mockUserData);
      await AsyncStorage.setItem('user', JSON.stringify(mockUserData));
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
      return;
    }

    try {
    let imageForUpload = image;
    // 기존 이미지가 URL(string)이면 base64 파일 객체로 변환!
    if (typeof image === 'string' && image.startsWith('http')) {
      imageForUpload = await urlToBase64ProfileImage(image);
    }
      // ✅ 실제 사용자: 이미지 파일과 함께 수정 요청 전송
      await editUserProfileWithFetch(userData, imageForUpload, token);
      const updated = await getUserInfoWithFetch(token);
      setUser(updated);
      await AsyncStorage.setItem('user', JSON.stringify(updated));
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
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
          <Text style={styles.headerText}>프로필 편집</Text>
          <View style={styles.headerLine} />
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back-ios" size={normalize(22)} color="#4F46E5" />
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ProfileImagePicker defaultImage={image} onChange={setImage} />
          {/* 이미지 삭제 버튼, 임시 */}
          {image && (
            <TouchableOpacity
              onPress={handleRemoveImage}
              style={styles.deleteButton}
              accessibilityLabel="프로필 사진 삭제"
            >
              <MaterialIcons name="delete" size={28} color="#EF4444" />
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
              <Text style={[styles.genderText, gender === '남성' && styles.genderTextSelected]}>
                남성
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, gender === '여성' && styles.genderSelected]}
              onPress={() => setGender(gender === '여성' ? '' : '여성')}
            >
              <Text style={[styles.genderText, gender === '여성' && styles.genderTextSelected]}>
                여성
              </Text>
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

          <View style={styles.formGroups}>
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
            <Text style={styles.submitText}>저장하기</Text>
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
    marginTop: normalize(6, 'height'),
    marginBottom: normalize(3, 'height'),
    letterSpacing: -0.3,
  },
  headerLine: {
    width: '90%',
    marginBottom: normalize(18, 'height'),
    marginTop: normalize(6, 'height'),
    height: normalize(1, 'height'),
    backgroundColor: '#E5E7EB',
    borderRadius: normalize(2),
  },
  container: {
    paddingHorizontal: normalize(20),
    paddingTop: normalize(4, 'height'),
    paddingBottom: normalize(80, 'height'),
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: normalize(25),
    top: normalize(6, 'height'),
    zIndex: 2,
  },
  formGroup: {
    marginBottom: normalize(30, 'height'),
    borderRadius: normalize(8),
    width: '100%',
    paddingHorizontal: normalize(6),
    minHeight: normalize(54, 'height'),
  },
  formGroups: {
    marginBottom: normalize(30, 'height'),
    marginTop: -normalize(2, 'height'),
    borderRadius: normalize(8),
    width: '100%',
    paddingHorizontal: normalize(6),
  },
  formGrouped: {
    marginBottom: normalize(30, 'height'),
    borderRadius: normalize(8),
    width: '100%',
    paddingHorizontal: normalize(6),
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
    paddingVertical: normalize(18, 'height'),
    borderRadius: normalize(8),
    alignItems: 'center',
    width: '100%',
    marginTop: normalize(12, 'height'),
    marginBottom: normalize(18, 'height'),
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#ffffff',
    fontSize: normalize(17),
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
    alignSelf: 'center',  // 가운데 정렬
    marginTop: 8,
    padding: 6,
    borderRadius: 24,
  },
});
