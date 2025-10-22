// 📁 /navigation/HomeNavigator.jsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../components/home/HomeScreen';
import MatchingScreen from '../components/matching/MatchingScreen';
import MatchingHome from '../components/matching/MatchingHome';
import MatchingInfoScreen from '../components/matching/MatchingInfoScreen';
import MatchingList from '../components/matching/MatchingList';
import NoneList from '../components/matching/NoneList';
import PlannerScreen from '../components/planner/PlannerScreen';
import PlannerInfoScreen from '../components/planner/PlannerInfoScreen';
import PlannerResponseHome from '../components/planner/PlannerResponseHome';
import PlaceDetailScreen from '../components/planner/PlaceDetailScreen';
import NewPostScreen from '../components/community/NewPostScreen';
const Stack = createNativeStackNavigator();

export default function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Matching" component={MatchingScreen} />
      <Stack.Screen name="MatchingHome" component={MatchingHome} /> 
      <Stack.Screen name="MatchingInfo" component={MatchingInfoScreen} />
      <Stack.Screen name="MatchingList" component={MatchingList} />
      <Stack.Screen name="NoneList" component={NoneList} />
      <Stack.Screen name="Planner" component={PlannerScreen} />
      <Stack.Screen name="PlannerInfo" component={PlannerInfoScreen} />
      <Stack.Screen name="PlannerResponse" component={PlannerResponseHome} />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
      <Stack.Screen name="NewPost" component={NewPostScreen} />

    </Stack.Navigator>
  );
}
