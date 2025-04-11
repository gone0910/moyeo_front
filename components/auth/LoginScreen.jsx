// 📁 components/auth/LoginScreen.jsx
import { StatusBar } from 'expo-status-bar';
import React, { useContext } from 'react';
import { View, Alert, StyleSheet, Text, TouchableOpacity, Image } from 'react-native'; // ✅ Image 추가
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../contexts/UserContext';
import { loginUserWithOAuth } from '../../api/auth';
import { useNavigation } from '@react-navigation/native';

// ✅ 이미지 require 로 불러오기
const kakaoIcon = require('../../assets/icons/kakaotalk_icon.png');
const googleIcon = require('../../assets/icons/google_icon.png');
const logoIcon = require('../../assets/icons/logo_icon.png'); // ✅ 로고 아이콘 추가

export default function LoginScreen() {
  const { setUser } = useContext(UserContext);
  const navigation = useNavigation();

  const handleOAuthLogin = async (provider) => {
    try {
      const response = await loginUserWithOAuth(provider, 'dummyCode');
      const user = response.data;
      setUser(user);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      navigation.replace('Home');
    } catch (error) {
      if (
        error?.response?.status >= 400 &&
        error?.response?.status < 500 &&
        error?.response?.data?.message === '회원가입 필요'
      ) {
        const tempToken = error.response.data.temporaryToken;
        await AsyncStorage.setItem('tempToken', tempToken);
        navigation.replace('UserInfo');
      } else {
        Alert.alert('로그인 실패', '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  const handleMockLogin = async () => {
    const mockUser = {
      nickname: '테스트유저',
      age: '24',
      gender: 'male',
      mbti: 'ENFP',
      image: null,
    };
    setUser(mockUser);
    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.logoContainer}> {/* ✅ 앱 로고 상단 마진 추가 */}
        <Image source={logoIcon} style={styles.logoIcon} />
        <Text style={styles.appName}>moyeo</Text>
      </View>

      <View style={styles.buttonContainer}> {/* ✅ 버튼 그룹 마진/정렬 조정 */}
        <TouchableOpacity 
          style={[styles.loginButton, styles.kakaoButton]} // ✅ 카카오 버튼 색상 적용
          onPress={() => handleOAuthLogin('kakao')}
        >
          <Image source={kakaoIcon} style={styles.icon} />
          <Text style={styles.loginButtonText}>Login with Kakao</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginButton} // ✅ 기본(구글) 스타일 유지
          onPress={() => handleOAuthLogin('google')}
        >
          <Image source={googleIcon} style={styles.icon} />
          <Text style={styles.loginButtonText}>Login with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, styles.mockButton]} // ✅ mock 버튼 색상 적용
          onPress={handleMockLogin}
        >
          <Text style={styles.mockButtonText}>Login with Mock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 40,
  },
  logoIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonContainer: {
    width: '80%',
    alignItems: 'center',
  },
  loginButton: { // ✅ 모든 버튼에 동일한 스타일 적용 (기본값: 흰 배경)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    width: '100%',
    marginBottom: 12,
  },
  kakaoButton: { // ✅ 카카오 버튼 색상 스타일
    backgroundColor: '#FEE500',
  },
  mockButton: { // ✅ mock 버튼 색상 스타일
    backgroundColor: '#4C5FD5', // 파란색
  },
  loginButtonText: { // ✅ 공통 텍스트 스타일 (기본: 검정 글씨)
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  mockButtonText: { // ✅ mock 버튼 전용 흰 글씨 스타일
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
});
