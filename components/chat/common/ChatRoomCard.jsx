// components/chat/common/ChatRoomCard.jsx  채팅 리스트에서 채팅방들을 카드로 보여주는 컴포넌트
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const vScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

export default function ChatRoomCard({ chat, isEditing, onDeletePress }) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (isEditing) return; // ✅ 편집모드일 때 채팅방 진입 방지

    // ✅ 변경: 백엔드 명세서 기반 route.params 키 이름 수정
    navigation.navigate('ChatRoomScreen', {
      roomId: chat.roomId, // ✅ 변경된 키 이름 및 값
      nickname: chat.nickname,        // ✅ 변경된 키 이름
      profileUrl: chat.profileUrl,
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {/* 프로필 이미지 */}
      <Image source={{ uri: chat.profileUrl }} style={styles.avatar} />

      {/* 닉네임 */}
      <View style={styles.textWrapper}>
        <Text style={styles.name}>{chat.nickname}</Text>
      </View>

      {/* 뱃지: 편집모드일 때만 marginLeft */}
      {chat.unreadCount > 0 && (
      <View
        style={[
          styles.badge,
          isEditing && styles.badgeEditing, // 편집모드에서만 marginRight 추가
        ]}
      >
        <Text style={styles.badgeText}>{chat.unreadCount}</Text>
      </View>
      )}

      {/* 삭제 아이콘: 편집모드에서만 우측 */}
      {isEditing && (
        <TouchableOpacity onPress={onDeletePress} style={styles.deleteIconWrapper}>
          <MaterialIcons name="remove-circle" size={scale(21)} color="#FF7E7E" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>

  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vScale(14),
    position: 'relative',
  },
  deleteIconWrapper: {
    position: 'absolute',
    top: '55%', // 상대적 위치 유지 (fixed size 쓰고 싶으면 vScale로 조정)
    right: scale(8),
    zIndex: 1,
  },
  avatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(22),
    marginRight: scale(36),
    backgroundColor: '#E0E0E0',
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Roboto_400Regular',
    fontSize: scale(20),
    color: '#333333',
    lineHeight: vScale(24),
  },
  badge: {
    width: scale(32),
    height: vScale(20),
    borderRadius: scale(16),
    backgroundColor: '#FF7272',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: scale(12),
  },
  badgeEditing: {
    marginRight: scale(44),
  },

});
