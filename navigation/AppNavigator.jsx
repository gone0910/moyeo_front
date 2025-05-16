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
import MatchingScreen from '../components/matching/MatchingScreen';
import MatchingHome from '../components/matching/MatchingHome';
import MatchingInfoScreen from '../components/matching/MatchingInfoScreen'; // 🔁 팀원 코드 병합

const Stack = createNativeStackNavigator();

export default function AppNavigator({ isLoggedIn }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* 로그인 흐름 */}
        {!isLoggedIn && (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="UserInfo" component={UserInfoScreen} />
          </>
        )}

        {/* 로그인 이후 화면: 항상 포함시키되, 로그인 안 된 경우 접근 안 되게! */}
        <Stack.Screen name="BottomTab" component={BottomTabNavigator} />
        <Stack.Screen name="Planner" component={PlannerScreen} options={{ title: '여행 플랜 생성' }} />
        <Stack.Screen name="Matching" component={MatchingScreen} options={{ title: '여행자 매칭' }} />
        <Stack.Screen name="MatchingHome" component={MatchingHome} options={{ title: '여행자 매칭 홈' }} />
        <Stack.Screen name="MatchingInfo" component={MatchingInfoScreen} options={{ title: '여행자 매칭 기입' }} />
        <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} options={{ title: '프로필 홈' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: '프로필 편집' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
