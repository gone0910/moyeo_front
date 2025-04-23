// 📁 components/auth/LoginScreen.jsx
import { StatusBar } from 'expo-status-bar';
import React, { useState, useContext, useEffect } from 'react';
import { View, Alert, StyleSheet, Text, TouchableOpacity, Image, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../contexts/UserContext';
import { redirectToOAuth, getUserInfo } from '../../api/auth';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import SplashScreen from '../common/SplashScreen'; 
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking'; // ✅ 변경

//아이콘 필요시 추가
const kakaoIcon = require('../../assets/icons/kakaotalk_icon.png');
const googleIcon = require('../../assets/icons/google_icon.png');
const logoIcon = require('../../assets/icons/logo_icon.png');

export default function LoginScreen() {
  const { setUser } = useContext(UserContext);
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({ KaushanScript_400Regular });
  const [showSplash, setShowSplash] = useState(false); 

  if (!fontsLoaded) {
    return <SplashScreen />; // 폰트 불러올때까지 스플래시 화면 출력( 폰트 오류를 고치기 위해 추가하였으나 해결불가)
  }

  // ✅ 딥링크로 앱이 돌아왔을 때 토큰과 모드를 추출하여 처리
  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      console.log('[딥링크 수신] URL:', url);

      try {
        const parsed = Linking.parse(url);
        console.log('[🔍 parsed 전체 구조 확인]', parsed);

        const token = parsed.queryParams?.token;
        const mode = parsed.queryParams?.mode;

        console.log('🔑 파싱된 token:', token);
        console.log('🧭 파싱된 mode:', mode);

        if (!token) {
          console.warn(' 토큰이 존재하지 않음 → 아무 처리 안 함');
          return;
        }
        await AsyncStorage.setItem('jwt', token);
        console.log('💾 토큰 저장 완료');
        
        // ✅ 저장된 토큰을 다시 읽어서 확인
        const savedToken = await AsyncStorage.getItem('jwt');
        console.log('🔁 저장된 토큰 재확인:', savedToken);
        
        if (!savedToken) {
          console.warn(' 토큰 저장 실패 또는 반영 안 됨 → 이동 중단');
          Alert.alert('오류', '토큰 저장에 실패했습니다. 다시 시도해주세요.');
          return;
        }
        
        // ✅ 안전하게 저장된 후에만 화면 전환
        if (mode === 'register') {
          console.log('[모드: register] → UserInfo로 이동');
          navigation.replace('UserInfo');
          return;
        }

        try {
          console.log('📡 기존 사용자 정보 요청 시작');
          const user = await getUserInfo(token);
          setUser(user);
          await AsyncStorage.setItem('user', JSON.stringify(user));
          console.log('✅ 사용자 정보 저장 완료 → BottomTab 이동');
          navigation.replace('BottomTab');
        } catch (error) {
          console.error('❌ 사용자 정보 요청 실패');
          if (error.response?.status === 400) {
            console.log('🆕 [getUserInfo] 400 예외 → 회원가입 이동');
            navigation.replace('UserInfo');
          } else {
            console.error('📛 상세 오류:', error);
            Alert.alert('오류', '사용자 정보를 불러오는 데 실패했습니다.');
          }
        }
      } catch (err) {
        console.error('❌ [딥링크 파싱 중 예외 발생]', err);
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('💡 초기 URL 감지됨 → 직접 처리 시작');
        handleDeepLink({ url });
      } else {
        console.log('ℹ️ 앱 처음 실행 시 URL 없음');
      }
    });

    return () => sub.remove();
  }, []);

  // ✅ OAuth 로그인 시작: 버튼 클릭 시 실행됨 → redirectToOAuth 내부에서 redirect_uri 생성 및 백엔드로 전달
  const handleOAuthLogin = async (provider) => {
    try {
      await redirectToOAuth(provider); // ✅ auth.js 내부에서 redirect_uri 자동 생성 및 요청 전송
    } catch (error) {
      console.error('[OAuth 오류]', error);
      Alert.alert('로그인 실패', '알 수 없는 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <Modal
        visible={showSplash}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSplash(false)} 
      >
        <SplashScreen />
      </Modal>

      <View style={styles.logoContainer}>
        <Text style={styles.appName}>moyeo</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.loginButton, styles.kakaoButton]}
          onPress={() => handleOAuthLogin('kakao')}
        >
          <Image source={kakaoIcon} style={styles.icon} />
          <Text style={styles.loginButtonText}>카카오로 로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, styles.googleButton]}
          onPress={() => handleOAuthLogin('google')}
        >
          <Image source={googleIcon} style={styles.icon} />
          <Text style={styles.loginButtonText}>Google로 로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, styles.mockButton]}
          onPress={async () => {
            // ✅ [Mock용] UI 개발 흐름 테스트용 임시 로그인 버튼
            await AsyncStorage.setItem('mock', 'true');
            await AsyncStorage.setItem('jwt', 'mock-token');
            navigation.replace('UserInfo');
          }}
        >
          <Text style={styles.mockButtonText}>임시 로그인 (테스트용)</Text>
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
    fontFamily: 'KaushanScript_400Regular',
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
    marginLeft: 10,
  },
  mockButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  splashButton: {                 
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
