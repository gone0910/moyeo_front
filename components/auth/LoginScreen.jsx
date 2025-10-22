import { StatusBar } from 'expo-status-bar';
import React, { useState, useContext, useEffect } from 'react';
import { View, Alert, StyleSheet, Text, TouchableOpacity, Image, Modal, Dimensions, PixelRatio, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../contexts/UserContext';
import { redirectToOAuth, getUserInfo } from '../../api/auth';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import SplashScreen from '../common/SplashScreen';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import Feather from 'react-native-vector-icons/Feather';
// ✅ [이식] LoginScreen0.jsx 에서 사용된 기능 import 추가
import { handleOAuthRedirectParams } from '../../api/AuthApi';


// 아이콘 이미지
const kakaoIcon = require('../../assets/icons/kakao_logo.png');
const googleIcon = require('../../assets/icons/google_loco.png');
// 📱 iPhone 13 기준 (390 x 844)
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// 폰트/컴포넌트 사이즈 자동 변환 함수
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

export default function LoginScreen() {
  const { setUser } = useContext(UserContext);
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({ KaushanScript_400Regular });
  const [showSplash, setShowSplash] = useState(false);

  if (!fontsLoaded) {
    return <SplashScreen />;
  }

  // 🧪 [Mock 로그인 체크용 useEffect 제거]
  // 딥링크 핸들러 및 Mock 버튼에서 직접 처리하도록 통합

  // ✅ [이식] 딥링크로 앱이 돌아왔을 때 토큰과 모드를 추출하여 처리 (LoginScreen0.jsx 로직)
  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      console.log('[딥링크 수신] URL:', url);

      try {
        const parsed = Linking.parse(url);
        console.log('[🔍 parsed 전체 구조 확인]', parsed);

        // [이식] 명세서 키 그대로 중앙 처리
        const outcome = await handleOAuthRedirectParams(parsed?.queryParams || {}); //

        // [이식] 분기: next='SignUp' → 회원가입 화면 / next='Home' → 홈
        if (outcome?.next === 'SignUp') { // 신규 사용자
          await AsyncStorage.removeItem('mock');
          console.log('🆕 [SignUp] 임시 토큰 저장 완료 → UserInfo 이동');
          navigation.replace('UserInfo');
          return;
        }

        if (outcome?.next === 'Home') { // 기존 사용자
          await AsyncStorage.removeItem('mock');
          const savedToken = await AsyncStorage.getItem('jwt'); // 중앙 저장된 AT 사용
          if (!savedToken) {
            console.warn('토큰 저장 실패 → 이동 중단');
            Alert.alert('오류', '토큰 저장에 실패했습니다. 다시 시도해주세요.');
            return;
          }

          // 사용자 정보 조회 후 홈 이동
          try {
            console.log('📡 사용자 정보 요청 시작');
            const user = await getUserInfo(savedToken);
            const refreshToken = await AsyncStorage.getItem('refreshToken'); // Refresh Token도 가져옴
            setUser({ ...user, accessToken: savedToken, refreshToken });     // UserContext 업데이트
            await AsyncStorage.setItem('user', JSON.stringify({ ...user, accessToken: savedToken, refreshToken })); // AsyncStorage 업데이트
            console.log('✅ 사용자 정보 저장 완료 → BottomTab 이동');
            navigation.replace('BottomTab');
            return;
          } catch (error) {
            if (error?.response?.status === 400) { //
              console.log('🆕 신규 사용자(400) → UserInfo 이동');
              navigation.replace('UserInfo');
              return;
            }
            console.error('📛 상세 오류:', error);
            Alert.alert('오류', '사용자 정보를 불러오는 데 실패했습니다.');
            return;
          }
        }

        // [이식] 방어 로직: 처리할 모드가 없으면 무시
        console.warn('ℹ️ 처리 가능한 딥링크 모드/토큰이 아님 → 무시');
        return;

      } catch (err) {
        console.error('❌ [딥링크 파싱 중 예외 발생]', err);
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);

    // 초기 URL 처리 로직
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

  // ✅ OAuth 로그인 시작: 버튼 클릭 시 실행됨
  const handleOAuthLogin = async (provider) => {
    try {
      await redirectToOAuth(provider);
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
        <Text style={styles.appName}>moyeo </Text>
      </View>
      <View style={styles.appContainer}>
        <Text style={styles.LogoName1}>지금 모여와 함께 </Text>
         <Text style={styles.LogoName2}>새로운 여정을 떠나요!</Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* 카카오 로그인 */}
        <TouchableOpacity
          style={[styles.loginButton, styles.kakaoButton]}
          onPress={() => handleOAuthLogin('kakao')}
        >
          <Image source={kakaoIcon} style={styles.icon1} />
          <Text style={styles.loginButtonText}>카카오로 로그인</Text>
        </TouchableOpacity>

        {/* 구글 로그인 */}
        <TouchableOpacity
          style={[styles.loginButton, styles.googleButton]}
          onPress={() => handleOAuthLogin('google')}
        >
          <Image source={googleIcon} style={styles.icon2} />
          <Text style={styles.loginButtonText}>구글로 로그인</Text>
        </TouchableOpacity>

        {/* mock 로그인 */}
        <TouchableOpacity
  style={[styles.loginButton, styles.mockButton]}
  onPress={async () => {
    await AsyncStorage.setItem('mock', 'true');
    await AsyncStorage.setItem('jwt', 'mock-token');
    navigation.replace('UserInfo'); // 또는 'BottomTab'
  }}
>
  <Text style={styles.mockButtonText}>임시 로그인 (Mock)</Text>
</TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',    
    backgroundColor: '#fff',
    paddingHorizontal: normalize(24),
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginTop: normalize(48, 'height'),
    marginBottom: normalize(12, 'height'),
  },
  appContainer: {
    alignItems: 'flex-start',
    marginTop: normalize(4, 'height'),
    marginBottom: normalize(100, 'height'),
  },
  appName: {
    fontSize: normalize(60),
    fontFamily: 'KaushanScript_400Regular',
    color: '#4F46E5',
    lineHeight: normalize(52, 'height'),
    marginBottom: normalize(10, 'height'),
  },
  LogoName1: {
    fontSize: normalize(28),                  
    fontFamily: 'Pretendard',                 
    lineHeight: normalize(28, 'height'),
    letterSpacing: -0.5,                     
    marginBottom: normalize(10, 'height'),
    fontWeight: '500',
  },

  LogoName2: {
    fontSize: normalize(28),
    fontFamily: 'Pretendard',
    lineHeight: normalize(28, 'height'),
    letterSpacing: -0.5,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: normalize(13, 'height'),
    paddingHorizontal: normalize(30),
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: '#DDDDDD',
    width: '100%',
    marginBottom: normalize(20, 'height'),
  },
  kakaoButton: {
    backgroundColor: '#FFEB3B',
    borderWidth: 0,
    marginBottom: normalize(10, 'height'),
  },
  googleButton: {
    backgroundColor: '#F3f3f3',
    borderWidth: 1,
    borderColor: '#f3f3f3',
    marginBottom: normalize(10, 'height'),
  },
  mockButton: {
    backgroundColor: '#4C5FD5',
    borderWidth: 0,
    marginBottom: normalize(2, 'height'),
  },
  loginButtonText: {
    fontSize: normalize(17),
    color: '#000000',
    marginLeft: normalize(-22),
    fontWeight:600,
    fontFamily:'Pretendard',
  },
  mockButtonText: {
    fontSize: normalize(17),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  icon1: {
  width: normalize(26),
  height: normalize(26),
  resizeMode: 'contain',
  marginRight: normalize(8),
  transform: [{ translateX: normalize(-100) }], 
},
icon2: {
  width: normalize(26),
  height: normalize(26),
  resizeMode: 'contain',
  marginRight: normalize(8),
  transform: [{ translateX: normalize(-108) }], 
},
  fabContainer: {
    position: 'absolute',
    right: normalize(18),
    bottom: normalize(32, 'height'),
    flexDirection: 'row',
    gap: normalize(12),
  },
  chatbotButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(8),
  },
  splashButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
