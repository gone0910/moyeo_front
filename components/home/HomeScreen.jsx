import { View, Text, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '../common/SplashScreen';

/**
 * 홈 화면 (메인)
 */
export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);
  const [showSplash, setShowSplash] = useState(false); // ✅ 스플래시 표시 여부

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (e) {
      Alert.alert('로그아웃 실패', '다시 시도해주세요.');
    }
  };

  useEffect(() => {
    if (!user) {
      navigation.replace('Login');
    }
  }, [user]);

  return (
    <View className="flex-1 bg-white">
      {/* ✅ Splash 모달 */}
      <Modal visible={showSplash} transparent animationType="fade">
        <SplashScreen />
      </Modal>

      {/* 상단 헤더 */}
      <View className="flex-row items-center justify-between px-6 pt-10 pb-8 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-800">moyeo</Text>
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile', user)}>
            {user?.image ? (
              <Image
                source={{ uri: user.image }}
                style={{ width: 42, height: 42, borderRadius: 21 }}
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-300" />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout}>
            <Feather name="log-out" size={28} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 기능 버튼 */}
      <View className="flex-row justify-evenly mt-10">
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-gray-100 justify-center items-center mb-2">
            <MaterialIcons name="people-outline" size={30} color="#4B5563" />
          </View>
          <Text className="text-sm text-gray-600">여행자 매칭</Text>
        </View>

        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-gray-100 justify-center items-center mb-2">
            <Ionicons name="map-outline" size={30} color="#4B5563" />
          </View>
          <Text className="text-sm text-gray-600">여행 플랜 생성</Text>
        </View>
      </View>

      <View className="h-12" />

      {/* 내 여행 카드 */}
      <View className="mx-6 p-4 rounded-xl border border-gray-300">
        <Text className="text-lg font-semibold text-gray-800">내 여행</Text>
        <Text className="text-base font-bold mt-2">인천 여행</Text>
        <Text className="text-sm text-gray-600">2025. 4.4 ~ 4.5</Text>
        <Text className="text-red-500 font-semibold mt-1">D-3</Text>

        {/* ✅ 버튼 2개를 나란히 배치 */}
        <View className="absolute right-4 bottom-4 flex-row space-x-3">
          {/* 챗봇 버튼 */}
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-gray-800 justify-center items-center"
            onPress={() => console.log('챗봇 열기')}
          >
            <Feather name="plus" size={24} color="white" />
          </TouchableOpacity>

          {/* 스플래시 버튼 */}
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-gray-500 justify-center items-center"
            onPress={() => setShowSplash(true)}
          >
            <Ionicons name="rocket-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 하단 탭바 */}
      <View className="flex-row justify-around py-5 border-t border-gray-200 mt-auto">
        <TouchableOpacity className="items-center">
          <Ionicons name="home-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <Ionicons name="calendar-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <FontAwesome5 name="users" size={20} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
