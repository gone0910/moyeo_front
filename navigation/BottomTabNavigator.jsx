// 📁 /navigation/BottomTabNavigator.jsx
import React, { useMemo } from 'react';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Feather from 'react-native-vector-icons/Feather';
import { View, Text, StyleSheet, Platform } from 'react-native';

import HomeNavigator from './HomeNavigator';
import MyTripsScreen from '../components/trip/MyTripsScreen';
import CommunityStackNavigator from './CommunityStackNavigator';
import ChatNavigator from './ChatNavigator';

const Tab = createBottomTabNavigator();

export const MAIN_TAB_ID = 'MainTabs';

export const defaultTabBarStyle = {
  height: 70,
  paddingBottom: 6,
  paddingTop: 6,
  backgroundColor: '#FAFAFA', // 너가 바꾸고 싶었던 색
  borderTopWidth: 0,          // ✅ 상단선 제거
  elevation: 0,               // ✅ Android 그림자 제거
  shadowOpacity: 0,           // ✅ iOS 그림자 제거
};

// (참고) 스타일 숨김 세트 — 커스텀 tabBar(null)로 가리므로 보조용
export const HIDDEN_TABBAR_STYLE = {
  display: 'none',
  height: 0,
  opacity: 0,
  position: 'absolute',
  borderTopWidth: 0,
  pointerEvents: 'none',
};

// 🔒 HomeNavigator 실제 Stack.Screen 이름들과 1:1
const HIDDEN_ROUTES = ['PlannerResponse', 'PlaceDetail', 'NewPost'];

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      id={MAIN_TAB_ID}
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { paddingBottom: 0 },
        sceneContainerStyle: { paddingBottom: 0 },
        tabBarLabel: ({ focused, color }) => {
          const labels = { Home: '홈 화면', MyTrips: '내 여행', Chat: '채팅', Community: '커뮤니티' };
          return (
            <Text style={[styles.tabLabelText, { color }]}>
              {labels[route.name]}
            </Text>
          );
        },
        tabBarIcon: ({ color, focused }) => {
  let iconName;
  let IconComponent = Ionicons; // Ionicons만 사용해서 outline/fill 통일

  if (route.name === 'Home') {
    iconName = focused ? 'home' : 'home-outline';
  } else if (route.name === 'MyTrips') {
    iconName = focused ? 'briefcase' : 'briefcase-outline';
  } else if (route.name === 'Chat') {
    iconName = focused ? 'chatbubble' : 'chatbubble-outline';
  } else if (route.name === 'Community') {
    iconName = focused ? 'people' : 'people-outline';
  }

  return (
    <View style={styles.iconBox}>
      <IconComponent name={iconName} size={28} color={color} />
    </View>
  );
},
tabBarActiveTintColor: '#111111',     // 활성: 진한 검정
tabBarInactiveTintColor: '#76758B',   // 비활성: 회색
      })}
      // ✅ 커스텀 tabBar: Home 탭의 중첩 라우트가 숨김 대상이면 탭바 자체를 렌더하지 않음
      tabBar={(props) => {
        try {
          const homeRoute = props.state.routes.find((r) => r.name === 'Home');
          // 중첩 네비게이터의 현재 포커스된 자식 라우트명
          const nestedName =
            homeRoute?.state?.routes?.[homeRoute.state.index]?.name ?? 'HomeMain';

          if (__DEV__) console.log('[tabbar][custom nested]', nestedName);

          const shouldHide = HIDDEN_ROUTES.some(
            (name) => nestedName === name || nestedName?.startsWith?.(name)
          );

          return shouldHide ? null : <BottomTabBar {...props} />;
        } catch (e) {
          // 안전망: 문제 생기면 기본 탭바
          if (__DEV__) console.warn('[tabbar] custom check failed:', e);
          return <BottomTabBar
    {...props}
    style={[
      props.style,
      shouldHide
        ? {
            opacity: 0,
            height: 0,
            pointerEvents: 'none',
            borderTopWidth: 0,
          }
        : defaultTabBarStyle,
    ]}
  /> 
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{ tabBarStyle: defaultTabBarStyle }}
      />

      <Tab.Screen
        name="MyTrips"
        component={MyTripsScreen}
        options={{ tabBarStyle: defaultTabBarStyle }}
      />

      <Tab.Screen
        name="Chat"
        component={ChatNavigator}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Chat', { screen: 'ChatListScreen' });
          },
        })}
        options={{ tabBarStyle: defaultTabBarStyle }}
      />

      <Tab.Screen
        name="Community"
        component={CommunityStackNavigator}
        options={{ tabBarStyle: defaultTabBarStyle }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconBox: {
   width: 32,            // 고정 폭
   height: 28,           // 고정 높이
   justifyContent: 'center',
   alignItems: 'center',
   // 필요시 그림자 유지하려면 아래 4줄을 그대로 옮겨도 됩니다.
   shadowColor: '#000',
   shadowOpacity: 0.08,
   shadowOffset: { width: 0, height: 2 },
   shadowRadius: 6,
   elevation: Platform.OS === 'android' ? 1 : 0,
 },
 tabLabelText: {
   fontSize: 12,
   lineHeight: 14,       // 고정 lineHeight로 라벨 높이 흔들림 방지
   textAlign: 'center',
 },
  iconShadowContainer: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: Platform.OS === 'android' ? 1 : 0,
  },
  textShadowStyle: {
    textShadowColor: 'rgba(79,70,229,0.3)',
    textShadowRadius: 6,
  },
});
