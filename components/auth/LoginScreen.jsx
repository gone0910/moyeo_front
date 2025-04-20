// 📁 components/auth/LoginScreen.jsx
import { StatusBar } from 'expo-status-bar';
import React, { useContext } from 'react';
import { View, Alert, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../contexts/UserContext';
import { loginUserWithOAuth } from '../../api/auth';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';

// ✅ 이미지 불러오기
const kakaoIcon = require('../../assets/icons/kakaotalk_icon.png');
const googleIcon = require('../../assets/icons/google_icon.png');
const logoIcon = require('../../assets/icons/logo_icon.png'); // ✅ 로고 아이콘 사용은 남겨둠 (추후 활용 가능)

export default function LoginScreen() {
  const { setUser } = useContext(UserContext);
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({ KaushanScript: KaushanScript_400Regular });

  if (!fontsLoaded) return null;

  const handleOAuthLogin = async (provider) => {
    try {
      const response = await loginUserWithOAuth(provider, 'dummyCode'); // ✅ API 로직 유지
      const user = response.data;
      setUser(user);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      navigation.replace('BottomTab');
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
    navigation.replace('UserInfo', { isMock: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.logoContainer}>
        {/* ✅ 병합된 UI 리팩토링: Kaushan Script 폰트 적용 */}
        <Text style={styles.appName}>moyeo</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.loginButton, styles.kakaoButton]}
          onPress={() => handleOAuthLogin('kakao')}
        >
          <Image source={kakaoIcon} style={styles.icon} />
          <Text style={styles.loginButtonText}>카카오 로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, styles.googleButton]}
          onPress={() => handleOAuthLogin('google')}
        >
          <Image source={googleIcon} style={styles.icon} />
          <Text style={styles.loginButtonText}>구글 로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, styles.mockButton]}
          onPress={handleMockLogin}
        >
          <Text style={styles.mockButtonText}>테스트 로그인(mock)</Text>
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
  appName: {
    fontSize: 90, // ✅ 병합된 스타일: 팀원 폰트 적용
    fontWeight: 'bold',
    color: '#4F46E5',
    fontFamily: 'KaushanScript', // ✅ 병합된 폰트
    lineHeight: 200,
    marginBottom: 50,
    marginRight: 10,
  },
  buttonContainer: {
    width: '80%',
    alignItems: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    width: '110%',
    marginBottom: 12,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
  },
  mockButton: {
    backgroundColor: '#4C5FD5',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 10, // ✅ 기존 marginRight/marginLeft 비정상값 수정
  },
  mockButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: 10, // ✅ 카카오/구글 통일
  },
});
