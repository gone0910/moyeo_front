// 📁 navigation/ChatNavigator.js
// ✅ Chat 탭 내부 Stack Navigator 구성: ChatList → ChatRoom

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatListScreen from '../components/chat/ChatListScreen';
import ChatRoomScreen from '../components/chat/ChatRoomScreen';

const Stack = createNativeStackNavigator();

export default function ChatNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatListScreen" component={ChatListScreen} />

    </Stack.Navigator>
  );
}
