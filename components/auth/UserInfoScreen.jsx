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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { UserContext } from '../../contexts/UserContext';
import ProfileImagePicker from '../common/ProfileImagePicker';
import Dropdown from '../common/Dropdown';  // DropdownPicker 기반 Dropdown
// import { registerUser } from '../../api/auth'; // 🔁 나중에 사용 시 주석 해제

export default function UserInfoScreen() {
  const navigation = useNavigation();
  const { setUser } = useContext(UserContext);

  const [image, setImage] = useState(null);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [mbti, setMbti] = useState('');

  const isValid = nickname.length > 0 && gender && age >= 10 && age <= 99;

  const handleSubmit = async () => {
    const newUser = { nickname, age, gender, mbti, image };

    try {
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      // 🔁 Axios 연동용 주석 시작
      /*
      const token = await AsyncStorage.getItem('jwtToken');
      const userData = {
        nickname,
        gender,
        age: parseInt(age),
        mbti,
      };
      await registerUser(userData, image, token);
      */
      // 🔁 Axios 연동용 주석 끝

      Alert.alert('완료', '회원가입이 완료되었습니다.');
      navigation.replace('BottomTab');
    } catch (e) {
      console.error('저장 오류:', e);
      Alert.alert('오류', '회원가입이 실패하였습니다.');
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {});
    return unsubscribe;
  }, [navigation]);

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

        <ScrollView contentContainerStyle={styles.container}>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  headerContainer: { alignItems: 'center' },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 32, // 회원가입 텍스트가 너무 올라가서 marginTop 추가.
    marginBottom: 8,
  },
  headerLine: {
    width: '90%',
    marginBottom: 30,
    marginTop: 10,
    height: 1,
    backgroundColor: '#999',
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
