// 📁 /navigation/HomeNavigator.jsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../components/home/HomeScreen';
import MatchingScreen from '../components/matching/MatchingScreen';
import MatchingHome from '../components/matching/MatchingHome';
import MatchingInfoScreen from '../components/matching/MatchingInfoScreen';

const Stack = createNativeStackNavigator();

export default function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Matching" component={MatchingScreen} />
      <Stack.Screen name="MatchingHome" component={MatchingHome} /> 
      <Stack.Screen name="MatchingInfo" component={MatchingInfoScreen} />
    </Stack.Navigator>
  );
}
