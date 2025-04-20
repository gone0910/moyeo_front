// 📁 /navigation/AppNavigator.jsx

/**
 * 📌 App 전반의 Stack Navigator를 정의하는 파일입니다.
 * - 로그인 상태에 따라 로그인/회원가입 흐름 또는 메인 탭으로 분기합니다.
 * - 하단 탭은 BottomTabNavigator.jsx에 정의되어 있고, 이곳에서 연결합니다.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 화면 컴포넌트들 import
import LoginScreen from '../components/auth/LoginScreen';
import UserInfoScreen from '../components/auth/UserInfoScreen';
import EditProfileScreen from '../components/profile/EditProfileScreen';
import ProfileHomeScreen from '../components/profile/ProfileHomeScreen'; // ✅ 프로필 홈 화면 추가
import BottomTabNavigator from './BottomTabNavigator'; // ✅ 하단탭 연결 (하단탭 - 홈화면)
import PlannerScreen from '../components/planner/PlannerScreen';
import MatchingScreen from '../components/matching/MatchingScreen';   // 매칭, 여행 플랜 임시화면 (개발이후 수정필요)

const Stack = createNativeStackNavigator();

export default function AppNavigator({ isLoggedIn }) {
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* 로그인 흐름 */}
        {!isLoggedIn && (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="UserInfo" component={UserInfoScreen} options={{ title: '회원 가입' }} />
          </>
        )}

        {/* 메인 앱 영역 (하단 탭 내비게이터 연결) */}
        <Stack.Screen name="BottomTab" component={BottomTabNavigator} />

        {/* 주요 기능 2개 (여행 매칭, 플랜) 임시화면 (개발이후 수정필요) */}
        <Stack.Screen name="Planner" component={PlannerScreen} options={{ title: '여행 플랜 생성' }} />
        <Stack.Screen name="Matching" component={MatchingScreen} options={{ title: '여행자 매칭' }} />

        {/* 추가 화면들 */}
        <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} options={{ title: '프로필 홈' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: '프로필 편집' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
