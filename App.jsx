// App.jsx
import { useEffect, useState, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './navigation/AppNavigator';
import { UserProvider, UserContext } from './contexts/UserContext'; //  사용자 전역 상태를 위한 Context 불러오기
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './components/common/SplashScreen'; //  앱 실행 시 보여질 임시 스플래시 화면

import './global.css';

// ✅ expo-google-fonts 기반 폰트 import 추가
import { useFonts as useKaushan, KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts as useInter, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts as useRoboto, Roboto_400Regular } from '@expo-google-fonts/roboto';

//  앱 진입 지점: 전체 앱을 UserProvider로 감싸 전역 사용자 상태 관리 가능하게 함
export default function App() {
  return (
    //  UserProvider로 앱을 감싸 전역에서 user 상태를 사용할 수 있게 설정
    <UserProvider>
      <Root />
      <StatusBar style="auto" />
    </UserProvider>
  );
}

// App()	앱 전체 entrypoint, Provider 설정
// Root()	로그인 상태 판단, 화면 분기
// AppNavigator	실제 스크린 등록 (Login, Home 등)
// AsyncStorage	로그인 정보 로컬 저장소.
// UserContext	user 상태 전역 공유

//  실제 사용자 로그인 상태를 판단하여 분기하는 내부 루트 컴포넌트
function Root() {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(true); //  자동 로그인 여부 확인 중 로딩 표시용
  const [forceUserInfo, setForceUserInfo] = useState(false); // ✅ 추가: 정보입력 유도 여부

  // ✅ Google Fonts 불러오기 상태
  const [kaushanLoaded] = useKaushan({ KaushanScript_400Regular });
  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_700Bold,
  });
  const [robotoLoaded] = useRoboto({
    Roboto_400Regular,
  });

  useEffect(() => {
    //  앱 실행 시 저장된 사용자 정보를 AsyncStorage에서 불러옴
    const loadUserFromStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser); //  저장된 유저 정보를 Context에 반영

          // ✅ mock 유저 또는 필수 정보 누락된 경우 → UserInfo로 유도
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
        setLoading(false); //  로딩 완료 시 화면 전환
      }
    };

    loadUserFromStorage();
  }, []);

  // ✅ 폰트 로딩 + 사용자 정보 로딩이 모두 완료될 때까지 Splash 표시
  if (!kaushanLoaded || !interLoaded || !robotoLoaded || loading) {
    return <SplashScreen />;
  }

  //  user가 있으면 홈 화면, 없으면 로그인/회원가입 흐름으로 분기됨
  return <AppNavigator isLoggedIn={!!user} forceUserInfo={forceUserInfo} />; // ✅ 추가 전달
}
