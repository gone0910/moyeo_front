// components//chat//ChatListScreen.jsx 채팅 리스트 화면
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import HeaderBar from '../../components/common/HeaderBar';
import ChatRoomCard from '../../components/chat/common/ChatRoomCard';
import { fetchChatRooms, exitChatRoom } from '../../api/chat';

// ✅ 더미 채팅방 리스트 (mock용)
const dummyChatRoomsData = [
  {
    roomId: '1',
    nickname: '김모여',
    profileUrl: 'https://via.placeholder.com/60x60.png?text=1',
    unreadCount: 3,
  },
  {
    roomId: '2',
    nickname: '신세휘',
    profileUrl: 'https://via.placeholder.com/60x60.png?text=2',
    unreadCount: 1,
  },
];

export default function ChatListScreen() {
  const [chatRooms, setChatRooms] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const navigation = useNavigation();

  // ✅ 채팅방 리스트 불러오기
const loadChatRooms = async () => {
  let token = null;
  try {
    const isMock = await AsyncStorage.getItem('mock');
    if (isMock === 'true') {
      console.log('[mock 모드] 더미 채팅방 사용');
      setChatRooms(dummyChatRoomsData);
      return;
    }

    token = await AsyncStorage.getItem('jwt');
    console.log('[ChatListScreen] 불러온 토큰:', token);

    const result = await fetchChatRooms(token);

    // ✅ 응답 구조 출력
    console.log('[채팅방 리스트 응답]', JSON.stringify(result, null, 2));

    if (!Array.isArray(result)) throw new Error('서버 응답이 배열이 아님');
    setChatRooms(result);
  } catch (err) {
    console.warn('[❌ Chat API 로딩 실패]', err);
    console.log('[❌ Chat 요청 URL]', '/chat/my/rooms');
    console.log('[❌ Chat 요청 토큰]', token);
    if (err.response) {
      console.log('[❌ 응답 상태]', err.response.status);
      console.log('[❌ 응답 메시지]', err.response.data?.message || err.message);
    } else {
      console.log('[❌ 알 수 없는 오류]', err.message);
    }
    Alert.alert('채팅 목록 오류', '서버와 연결할 수 없어 더미 데이터를 사용합니다.');
    setChatRooms(dummyChatRoomsData);
  }
};


  // ✅ 최초 로딩
  useEffect(() => {
    loadChatRooms();
  }, []);

  // ✅ 화면 재진입 시 최신 채팅방 목록 재조회
  useFocusEffect(
    React.useCallback(() => {
      loadChatRooms();
    }, [])
  );

  // ✅ 삭제(나가기) 처리
  const handleDelete = async (roomId) => {
    const isMock = await AsyncStorage.getItem('mock');
    if (isMock === 'true') {
      console.log('[mock] 채팅방 삭제됨:', roomId);
      setChatRooms((prev) => prev.filter((chat) => chat.roomId !== roomId));
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwt');
      const success = await exitChatRoom(roomId, token);
      if (success) {
        console.log('[✅ Chat API 나가기 완료]', roomId);
        setChatRooms((prev) => prev.filter((chat) => chat.roomId !== roomId));
        Alert.alert('채팅방 나가기 완료', '선택한 채팅방을 나갔습니다.');
      } else {
        Alert.alert('오류', '채팅방 나가기에 실패했습니다.');
      }
    } catch (err) {
      console.error('[❌ Chat API 나가기 에러]', err);
      Alert.alert('오류', '채팅방을 나가는 중 문제가 발생했습니다.');
    }
  };

  // ✅ 삭제 전 경고 팝업
  const confirmDelete = (roomId) => {
    Alert.alert(
      '채팅방 나가기',
      '대화 내용이 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '나가기', onPress: () => handleDelete(roomId) },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <HeaderBar /> {/* 공통 상단 헤더 */}

      {/* 상단 타이틀 + 편집/더보기 버튼 */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>채팅</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          {isEditing ? (
            <Text style={styles.editDone}>편집완료</Text> // 편집모드일 때 표시
          ) : (
            <MaterialIcons name="more-vert" size={24} color="#1E1E1E" /> // 기본 모드 아이콘
          )}
        </TouchableOpacity>
      </View>

      {/* 채팅방 리스트 표시 */}
      <View style={styles.listContainer}>
        <FlatList
          data={chatRooms}
          keyExtractor={(item) => item.roomId}
          renderItem={({ item }) => (
            <ChatRoomCard
              chat={item}
              isEditing={isEditing} // 편집 모드 여부 전달
              onDeletePress={() => confirmDelete(item.roomId)} // 삭제 버튼 클릭 핸들러
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
    paddingHorizontal: 20, // 좌우 패딩
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
