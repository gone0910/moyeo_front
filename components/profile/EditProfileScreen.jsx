/* 프로필 편집 화면 */
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { UserContext } from '../../contexts/UserContext';
import ProfileImagePicker from '../common/ProfileImagePicker';
import Dropdown from '../common/Dropdown'; // DropDownPicker 기반
// import { editUserProfile, getUserInfo } from '../../api/auth'; // api 오프 시시 주석 유지, getUserInfo 추가
import { editUserProfileWithFetch, getUserInfoWithFetch } from '../../api/auth_fetch'; // ✅ fetch 기반 API 사용

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);

  //  백엔드에서 받은 프로필 이미지 URL 기준으로 초기화
  const [image, setImage] = useState(user?.profileImageUrl || null);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [age, setAge] = useState(user?.age || '');
  //  수정된 경우 (서버에서 받은 영어 → 토글이 이해할 수 있는 한국어로 변환)
  const [gender, setGender] = useState(
    user?.gender === 'MALE' ? '남성' : user?.gender === 'FEMALE' ? '여성' : ''
  );
  const [mbti, setMbti] = useState(user?.mbti || '');
  const isValid = nickname.length > 0 && gender && age >= 13 && age <= 99;

  // 프로필 편집 완료 버튼
  const handleSubmit = async () => {
    //  백엔드가 요구하는 형식: 숫자 age + gender/mbti는 서버 포맷 (예: 'MALE', 'INFP')
    const token = await AsyncStorage.getItem('jwt');
    const isMock = await AsyncStorage.getItem('mock');

    const userData = {
      nickname,
      gender: gender === '남성' ? 'MALE' : gender === '여성' ? 'FEMALE' : '',
      age: parseInt(age),
      mbti,
      profileImageUrl: image?.uri || null,
    };

    if (isMock === 'true') {
      // ✅ mock 모드일 경우 직접 상태 및 저장소 갱신
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
      return;
    }

    try {
      await editUserProfileWithFetch(userData, token); // ✅ fetch로 수정 요청
      const updated = await getUserInfoWithFetch(token); // ✅ fetch로 사용자 정보 다시 조회
      setUser(updated);
      await AsyncStorage.setItem('user', JSON.stringify(updated));
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
    } catch (e) {
      console.error('❌ 프로필 저장 실패:', e);
      Alert.alert('실패', '프로필 저장에 실패했습니다.');
    }
  };

  //   // 기존 axios api 함수인 editUserProfile
  //   try {
  //     await editUserProfile(userData, image, token);
  //     const updated = await getUserInfo(token);
  //     setUser(updated);
  //     await AsyncStorage.setItem('user', JSON.stringify(updated));
  //     Alert.alert('성공', '프로필이 수정되었습니다.');
  //     navigation.goBack();
  //   } catch (e) {
  //     console.error('프로필 저장 실패:', e);
  //     Alert.alert('실패', '프로필 저장에 실패했습니다.');
  //   }
  // };

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

        <ScrollView contentContainerStyle={styles.container}>
          {/* <Text style={styles.notice}>*는 필수입력 사항입니다</Text> 필요시 추가. */}

          <ProfileImagePicker defaultImage={image} onChange={setImage} />

          <View style={styles.formGrouped}>
            <Text style={styles.label}>닉네임 *</Text>
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

          <Text style={styles.labels}>성별 *</Text>
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
            <Text style={styles.label}>나이 *</Text>
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

        {/* ✅ UserInfoScreen과 동일한 버튼 */}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  headerContainer: { alignItems: 'center' },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 32,
    marginBottom: 8,
  },
  headerLine: {
    width: '90%',
    marginBottom: 30,
    marginTop: 10,
    height: 1,
    backgroundColor: '#999',
  },
  notice: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 16,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 150,
  },
  formGroup: {
    marginBottom: 25,
    borderRadius: 8,
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 60,
  },
  formGroups: {
    marginBottom: 30,
    marginTop: -8,
    borderRadius: 8,
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  formGrouped: {
    marginBottom: 30,
    borderRadius: 8,
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 60,
  },
  label: {
    fontSize: 18,
    color: '#373737',
    marginBottom: 8,
    lineHeight: 22,
  },
  labels: {
    fontSize: 16,
    color: '#373737',
    marginBottom: 8,
    lineHeight: 22,
    left: 10,
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  genderButton: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  genderSelected: {
    backgroundColor: '#b3a4f7',
  },
  genderText: {
    color: '#999',
    fontSize: 18,
  },
  genderTextSelected: {
    color: '#fff',
  },
  mbtiLabel: {
    fontSize: 18,
    color: '#373737',
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '94%',
    marginLeft: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
});
