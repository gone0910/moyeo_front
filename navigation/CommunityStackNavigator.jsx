import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityScreen from '../components/community/CommunityScreen';
import NewPostScreen from '../components/community/NewPostScreen';
import PostDetailScreen from '../components/community/PostDetailScreen';
import EditPostScreen from '../components/community/EditPostScreen';


const Stack = createNativeStackNavigator();

export default function CommunityStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
  <Stack.Screen name="CommunityMain" component={CommunityScreen} />
  <Stack.Screen
    name="NewPost"
    component={NewPostScreen}
    options={{
      // 이 부분이 핵심!
      presentation: 'card', // (필요시)
      tabBarStyle: { display: 'none' }, // <-- 이 줄 추가!
      tabBarVisible: false, // (버전별로 이 옵션도 혹시 필요)
    }}
  />

  <Stack.Screen name="PostDetail" component={PostDetailScreen} />
  <Stack.Screen
  name="EditPost"
  component={EditPostScreen}
  options={{
    presentation: 'card', 
    tabBarStyle: { display: 'none' }, // 하단 탭바 숨김
    tabBarVisible: false,              // (버전에 따라 필요시)
    // presentation: 'card',            // (필요시)
  }}
/>
</Stack.Navigator>
  );
}

