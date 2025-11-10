// 📁 /navigation/BottomTabNavigator.jsx
import React from 'react';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Feather from 'react-native-vector-icons/Feather'; // (현재 미사용이지만 유지)
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
  backgroundColor: '#FAFAFA',
  borderTopWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
};

export const HIDDEN_TABBAR_STYLE = {
  display: 'none',
  height: 0,
  opacity: 0,
  position: 'absolute',
  borderTopWidth: 0,
  pointerEvents: 'none',
};

// ✅ 탭바 숨김 대상
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
            <Text style={[styles.tabLabelText, { color }]}>{labels[route.name]}</Text>
          );
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName;
          let IconComponent = Ionicons;

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
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#76758B',
      })}

      // ✅ 모든 탭의 가장 깊은 화면 이름을 기준으로 숨김 여부 판단
      tabBar={(props) => {
        // 현재 활성 탭의 최하위 라우트 이름 탐색 (초기 렌더 방어)
    const getDeepestRouteName = (route) => {
      let cur = route;
      while (cur && cur.state && Number.isInteger(cur.state.index)) {
        cur = cur.state.routes?.[cur.state.index];
      }
      return cur?.name || route?.name || '';
    };

    const activeTop = props.state.routes[props.state.index];
    const nestedName = getDeepestRouteName(activeTop);
    if (__DEV__) console.log('[tabbar][focus route]', nestedName);

    // ✅ 이름 변형(접두/접미)에도 걸리도록 '부분 포함' 판정
    const HIDDEN_KEYWORDS = ['PlannerResponse', 'PlaceDetail', 'PlaceDetailScreen', 'NewPost'];
    const shouldHide = HIDDEN_KEYWORDS.some((kw) => nestedName?.includes?.(kw));

        return (
          <BottomTabBar
            {...props}
            style={[
              defaultTabBarStyle,
              shouldHide ? HIDDEN_TABBAR_STYLE : null,
            ]}
          />
        );
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
    width: 32,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: Platform.OS === 'android' ? 1 : 0,
  },
  tabLabelText: {
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
  },
});
