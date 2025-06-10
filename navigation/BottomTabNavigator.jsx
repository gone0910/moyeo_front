// 📁 /navigation/BottomTabNavigator.jsx
// 하단 탭바를 생성하기 위해 필요한 패키지 설치. npm install @react-navigation/bottom-tabs

/**
 * 하단탭바를 담당하는 컴포넌트이이며 (일단은)홈화면으로 이동하는 라우터입니다.
 * 📌 앱 전체에서 공통으로 사용되는 하단 탭바 구성 컴포넌트입니다.
 * - Home, 내 여행, 채팅, 커뮤니티 등의 주요 화면을 탭으로 전환할 수 있습니다.
 * - React Navigation의 createBottomTabNavigator 사용
 * - 앱 전체에서 재사용되므로 단일 파일로 분리하여 관리합니다.
 * - 탭바 높이, 아이콘 크기, 라벨 스타일 등은 여기서 일괄 설정합니다.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // 아이콘 1
import Feather from 'react-native-vector-icons/Feather'; // 아이콘 2
import { View, Text, StyleSheet } from 'react-native';

// 각 탭에서 연결될 화면 컴포넌트들
import HomeNavigator from './HomeNavigator'; 
import MyTripsScreen from '../components/trip/MyTripsScreen';
import ChatNavigator from './ChatNavigator';
import CommunityStackNavigator from './CommunityStackNavigator';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {  //하단탭이 홈화면 및 라우터 기능 탑재.
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 6,
          paddingTop: 6,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,

          // ✅ 상단 둥글게 처리
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,


        },
        tabBarLabel: ({ focused, color }) => {
          const labels = {
            Home: '홈 화면',
            MyTrips: '내 여행',
            Chat: '채팅',
            Community: '커뮤니티',
          };
          return (
            <Text
              style={[
                {
                  fontSize: 12,
                  fontFamily: 'Roboto_400Regular',
                  color,
                  textAlign: 'center',
                },
                focused && styles.textShadowStyle, // ✅ 텍스트 그림자 효과 적용
              ]}
            >
              {labels[route.name]}
            </Text>
          );
        },

        // ✅ 탭 아이콘 설정
        tabBarIcon: ({ color, focused }) => {
          let iconName;
          let IconComponent = Ionicons; // 기본은 Ionicons 사용

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MyTrips') {
            iconName = 'briefcase';
            IconComponent = Feather; // ✅ Feather로 아이콘 컴포넌트 교체
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
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="MyTrips" component={MyTripsScreen} />
      <Tab.Screen name="Chat" component={ChatNavigator} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // 탭을 누를 때 항상 ChatList로 이동
            e.preventDefault(); // 기본 동작 막기
            navigation.navigate('Chat', {
              screen: 'ChatListScreen', // ✅ Stack 내 ChatList로 이동
            });
          },
        })}
      />
      <Tab.Screen name="Community" component={CommunityStackNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({



});
