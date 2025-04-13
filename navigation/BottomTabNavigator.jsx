// 📁 /navigation/BottomTabNavigator.jsx
// 하단 탭바를 생성하기 위해 필요한 패키지 설치. npm install @react-navigation/bottom-tabs


/**
 * 하단탭바를 담당하는 컴포넌트이이며 (일단은)홈화면으로 이동하는 라우터입니다.
 * 📌 앱 전체에서 공통으로 사용되는 하단 탭바 구성 컴포넌트입니다.
 * - Home, 내 여행, 채팅, 커뮤니티 등의 주요 화면을 탭으로 전환할 수 있습니다.
 * - React Navigation의 createBottomTabNavigator 사용
 * - 앱 전체에서 재사용되므로 단일 파일로 분리하여 관리합니다.
 * - 탭바 높이, 아이콘 크기, 라벨 스타일 등은 여기서 일괄 설정합니다.
 * - "대강 하단 탭바는 재사용할꺼니깐 컴포넌트 파일 따로 만들었다는 내용용"
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// 각 탭에서 연결될 화면 컴포넌트들
import HomeScreen from '../components/home/HomeScreen';
import MyTripsScreen from '../components/trip/MyTripsScreen';
import ChatScreen from '../components/chat/ChatScreen';
import CommunityScreen from '../components/community/CommunityScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 70, // ✅ 최종 높이 지정
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'MyTrips') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Chat') iconName = focused ? 'chatbox' : 'chatbox-outline';
          else if (route.name === 'Community') iconName = focused ? 'people' : 'people-outline';

          return <Ionicons name={iconName} size={28} color={color} />; // ✅ 아이콘 사이즈 확대
        },
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#9CA3AF',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '홈 화면' }} />
      <Tab.Screen name="MyTrips" component={MyTripsScreen} options={{ tabBarLabel: '내 여행' }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: '채팅' }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ tabBarLabel: '커뮤니티' }} />
    </Tab.Navigator>
  );
}
