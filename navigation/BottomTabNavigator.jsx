// 📁 /navigation/BottomTabNavigator.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Feather from 'react-native-vector-icons/Feather';
import { View, Text, StyleSheet } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

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
  backgroundColor: '#FFFFFF',
  borderTopWidth: 0,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
};

// ✅ 완전 숨김(깜빡임 방지용)
export const HIDDEN_TABBAR_STYLE = {
  display: 'none',
 height: 0,
 position: 'absolute',
 borderTopWidth: 0,
 paddingTop: 0,
 paddingBottom: 0,
 opacity: 0,
 overflow: 'hidden',
 pointerEvents: 'none',
};

const HIDDEN_ROUTES = [
  'PlannerInfoScreen',
  'PlannerResponseHome',
  'PlaceDetail',
];

// [ADD] 포커스 라우트 기반으로 숨김 여부 판단 (+로그)
function shouldHideByRoute(route) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeMain';
  if (__DEV__) console.log('[tabbar][focus route]', routeName);
  return HIDDEN_ROUTES.some(
    (name) => routeName === name || routeName?.startsWith?.(name)
  );
} // ←←← ← 여기 빠져있던 닫는 중괄호!

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      id={MAIN_TAB_ID}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: ({ focused, color }) => {
          const labels = { Home: '홈 화면', MyTrips: '내 여행', Chat: '채팅', Community: '커뮤니티' };
          return (
            <Text
              style={[
                { fontSize: 12, fontFamily: 'Roboto_400Regular', color, textAlign: 'center' },
                focused && styles.textShadowStyle,
              ]}
            >
              {labels[route.name]}
            </Text>
          );
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName;
          let IconComponent = Ionicons;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyTrips') {
            iconName = 'briefcase';
            IconComponent = Feather;
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbox' : 'chatbox-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          }
          return (
            <View style={styles.iconShadowContainer}>
              <IconComponent name={iconName} size={28} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#A1A1AA',
      })}
    >
      {/* Home 탭: 헬퍼로 숨김 제어 */}
      <Tab.Screen
  name="Home"
  component={HomeNavigator}
  options={({ route }) => {
    const hide = shouldHideByRoute(route);
    return {
      // ✅ 기본 → 숨김 순서의 배열. 뒤가 이긴다 = 숨김이 최우선
      tabBarStyle: hide ? HIDDEN_TABBAR_STYLE : defaultTabBarStyle,
    };
  }}
  // ✅ 추가: 홈 탭 버튼 눌렀을 때 항상 HomeMain으로 이동하도록 강제
  listeners={({ navigation }) => ({
    tabPress: (e) => {
      // 기본 동작 그대로 유지
      e.preventDefault();

      // ✅ Home 탭을 누를 때 항상 HomeMain 화면으로 이동
      navigation.navigate('Home', { screen: 'HomeMain' });

      // 만약 완전히 스택을 리셋하고 싶다면 아래 주석 해제
      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: 'Home', state: { routes: [{ name: 'HomeMain' }] } }],
      // });
    },
  })}
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
});
