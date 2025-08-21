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

  // 🔁 mock 로그인 체크용 useEffect
useEffect(() => {
  const checkMockLogin = async () => {
    const isMock = await AsyncStorage.getItem('mock');
    const token = await AsyncStorage.getItem('jwt');
    if (isMock === 'true' && token) {
      console.log('🧪 [Mock 로그인 감지됨] → UserInfo 이동');
      navigation.replace('UserInfo'); // 또는 'BottomTab'
    }
  };
  checkMockLogin();
}, []);

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
        await AsyncStorage.removeItem('mock');
        console.log('🧹 mock 상태 제거 완료');
        const savedToken = await AsyncStorage.getItem('jwt');
        console.log('🔁 저장된 토큰 재확인:', savedToken);

        if (!savedToken) {
          console.warn(' 토큰 저장 실패 또는 반영 안 됨 → 이동 중단');
          Alert.alert('오류', '토큰 저장에 실패했습니다. 다시 시도해주세요.');
          return;
        }

        if (mode === 'register') {
          console.log('[모드: register] → UserInfo로 이동');
          navigation.replace('UserInfo');
          return;
        }

        try {
          console.log('📡 기존 사용자 정보 요청 시작');
          const user = await getUserInfo(token);
          setUser({ ...user, token }); // ✅ token 포함
          await AsyncStorage.setItem('user', JSON.stringify({ ...user, token }));
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

      <View style={styles.buttonContainer}>
        {/* 카카오 로그인 */}
        <TouchableOpacity
          style={[styles.loginButton, styles.kakaoButton]}
          onPress={() => handleOAuthLogin('kakao')}
        >
          <Image source={kakaoIcon} style={styles.icon1} />
          <Text style={styles.loginButtonText}>카카오 로그인</Text>
        </TouchableOpacity>

        {/* 구글 로그인 */}
        <TouchableOpacity
          style={[styles.loginButton, styles.googleButton]}
          onPress={() => handleOAuthLogin('google')}
        >
          <Image source={googleIcon} style={styles.icon2} />
          <Text style={styles.loginButtonText}>구글 로그인</Text>
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
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: normalize(180, 'height'),
    marginBottom: normalize(100, 'height'),
  },
  appName: {
    fontSize: normalize(100),
    fontFamily: 'KaushanScript_400Regular',
    color: '#4F46E5',
    lineHeight: normalize(100, 'height'),
    marginBottom: normalize(40, 'height'),
  },
  buttonContainer: {
    width: '90%',
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
    marginLeft: normalize(-14),
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
  transform: [{ translateX: normalize(-110) }], // ← 왼쪽으로 20px 이동
},
icon2: {
  width: normalize(26),
  height: normalize(26),
  resizeMode: 'contain',
  marginRight: normalize(8),
  transform: [{ translateX: normalize(-115) }], // ← 왼쪽으로 20px 이동
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
