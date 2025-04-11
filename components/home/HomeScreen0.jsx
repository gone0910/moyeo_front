// import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// 임시 홈화면 (삭제하시라요)

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-white">
      {/* 상단 헤더 */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">moyeo</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}> {/* 프로필 편집 연결 */}
          <Ionicons name="person-circle-outline" size={36} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* 주요 기능 버튼 2개 */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity className="w-[48%] h-32 bg-blue-100 rounded-2xl items-center justify-center">
            <Ionicons name="people-outline" size={32} color="#2563EB" />
            <Text className="mt-2 text-blue-800 font-semibold">여행자 매칭</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] h-32 bg-green-100 rounded-2xl items-center justify-center">
            <Ionicons name="map-outline" size={32} color="#059669" />
            <Text className="mt-2 text-green-800 font-semibold">여행 플랜 생성</Text>
          </TouchableOpacity>
        </View>

        {/* 내 여행 영역 (임시 공백 처리) */}
        <Text className="text-lg font-semibold mb-2">내 여행</Text>
        <View className="bg-gray-100 rounded-xl border border-gray-300 p-6 items-center justify-center">
          <Text className="text-gray-400">생성된 여행 플랜이 없습니다.</Text>
        </View>
      </ScrollView>

      {/* 플로팅 챗봇 버튼 */}
      <TouchableOpacity
        className="absolute bottom-24 right-6 bg-white w-14 h-14 rounded-full border border-gray-300 shadow-md items-center justify-center"
        onPress={() => navigation.navigate('Chatbot')} // 실제 연결될 화면 이름으로 수정 필요
      >
        <Text>Chatbot</Text>
        
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#4B5563" />
      </TouchableOpacity>

      {/* 하단 탭 바 */}
      <View className="flex-row justify-around items-center h-16 border-t border-gray-200">
        <TouchableOpacity className="items-center">
          <Ionicons name="home" size={24} color="#1F2937" />
          <Text className="text-xs text-gray-700 mt-1">홈 화면</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center">
          <Ionicons name="calendar" size={24} color="#6B7280" />
          <Text className="text-xs text-gray-500 mt-1">내 여행</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center">
          <Ionicons name="chatbubble-outline" size={24} color="#6B7280" />
          <Text className="text-xs text-gray-500 mt-1">채팅</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center">
          <Ionicons name="people-circle-outline" size={24} color="#6B7280" />
          <Text className="text-xs text-gray-500 mt-1">커뮤니티</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
