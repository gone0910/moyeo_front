// components//chat//ChatListScreen.jsx 채팅 리스트 화면
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import ChatRoomCard from '../../components/chat/common/ChatRoomCard';
import HeaderBar from '../../components/common/HeaderBar';
import { MaterialIcons } from '@expo/vector-icons'; // ✅ 벡터 아이콘 사용용

// ✅ 테스트용 채팅방 데이터 (실제 구현 시 API로 대체 예정)
const dummyChatRoomsData = [
  {
    id: '1',
    name: '김모여',
    profileUrl: 'https://via.placeholder.com/40',
    unreadCount: 12,
  },
  {
    id: '2',
    name: '신세휘',
    profileUrl: 'https://via.placeholder.com/40',
    unreadCount: 8,
  },
  {
    id: '3',
    name: '김신록',
    profileUrl: 'https://via.placeholder.com/40',
    unreadCount: 0,
  },
];

export default function ChatListScreen() {
  const [chatRooms, setChatRooms] = useState(dummyChatRoomsData); // ✅ 채팅방 리스트 상태
  const [isEditing, setIsEditing] = useState(false); // ✅ 편집 모드 여부 상태

  // ✅ 삭제 로직: 선택된 채팅방 ID 기준으로 제거
  const handleDelete = (id) => {
    setChatRooms((prev) => prev.filter((chat) => chat.id !== id));
  };

  // ✅ 삭제 전 경고 팝업
  const confirmDelete = (id) => {
    Alert.alert(
      '채팅방 나가기',
      '정말 나가시겠어요? 대화 내용은 삭제됩니다.',
      [
        { text: '아니오', style: 'cancel' },
        { text: '예', onPress: () => handleDelete(id) },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <HeaderBar /> {/* ✅ 공통 상단 헤더 */}

      {/* ✅ 상단 타이틀 + 편집/더보기 버튼 */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>채팅</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          {isEditing ? (
            <Text style={styles.editDone}>편집완료</Text> // ✅ 편집모드일 때 표시
          ) : (
            <MaterialIcons name="more-vert" size={24} color="#1E1E1E" /> // ✅ 기본 모드 아이콘
          )}
        </TouchableOpacity>
      </View>

      {/* ✅ 채팅방 리스트 표시 */}
      <View style={styles.listContainer}>
        <FlatList
          data={chatRooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatRoomCard
              chat={item}
              isEditing={isEditing} // ✅ 편집 모드 여부 전달
              onDeletePress={() => confirmDelete(item.id)} // ✅ 삭제 버튼 클릭 핸들러
            />
          )}
          contentContainerStyle={{ paddingTop: 8 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    paddingHorizontal: 20, // ✅ 좌우 패딩
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 24,
    lineHeight: 32,
    color: '#1E1E1E',
  },
  editDone: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    textAlign: 'center',
    color: '#FF8181',
  },
});