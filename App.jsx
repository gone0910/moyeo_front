// App.jsx
import { useEffect, useState, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { UserProvider, UserContext } from './contexts/UserContext';
import SplashScreen from './components/common/SplashScreen';
import AppNavigator from './navigation/AppNavigator'; // 로그인/홈 화면 분기용 네비게이터

import './global.css';

// ✅ expo-google-fonts 기반 폰트 import
import { useFonts as useKaushan, KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts as useInter, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts as useRoboto, Roboto_400Regular } from '@expo-google-fonts/roboto';

// ✅ 앱 진입 지점
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
          <Root />
        <StatusBar style="auto" />
      </UserProvider>
    </GestureHandlerRootView>
  );
}

// ✅ 사용자 로그인 상태에 따라 화면 분기하는 내부 컴포넌트
function Root() {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [forceUserInfo, setForceUserInfo] = useState(false); // 프로필 입력 유도 여부

  // ✅ Google Fonts 로딩 상태
  const [kaushanLoaded] = useKaushan({ KaushanScript_400Regular });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_700Bold });
  const [robotoLoaded] = useRoboto({ Roboto_400Regular });

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);

          // 필수 정보 누락 시 유도
          if (
            parsedUser.id === 'mockUser' ||
            !parsedUser.nickname ||
            !parsedUser.age ||
            !parsedUser.gender ||
            !parsedUser.mbti
          ) {
            setForceUserInfo(true);
          }
        }
      } catch (e) {
        console.log('자동 로그인 로딩 실패:', e);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // ✅ 모든 로딩 완료 전까지 스플래시 화면
  if (!kaushanLoaded || !interLoaded || !robotoLoaded || loading) {
    return <SplashScreen />;
  }

  return <AppNavigator isLoggedIn={!!user} forceUserInfo={forceUserInfo} />;
}
