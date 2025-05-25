// components/chat/common/ChatRoomCard.jsx  채팅 리스트에서 채팅방들을 카드로 보여주는 컴포넌트
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

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
      {/* ✅ 삭제 아이콘 (편집모드일 때만 표시) */}
      {isEditing && (
        <TouchableOpacity onPress={onDeletePress} style={styles.deleteIconWrapper}>
          <MaterialIcons name="remove-circle" size={21} color="#FF7E7E" />
        </TouchableOpacity>
      )}

      {/* ✅ 사용자 프로필 이미지 */}
      <Image source={{ uri: chat.profileUrl }} style={[styles.avatar, isEditing && styles.avatarEditing]} />

      {/* ✅ 사용자 이름 */}
      <View style={[styles.textWrapper, isEditing && styles.textEditing]}>
        <Text style={styles.name}>{chat.nickname}</Text>
      </View>

      {/* ✅ 안 읽은 메시지 수 뱃지 */}
      {chat.unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{chat.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  deleteIconWrapper: {
    position: 'absolute',
    top: '55%', // ✅ 상하 가운데 정렬을 위해 top 기준 50%
    left: 8,
    zIndex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 22,
    marginRight: 36,
    backgroundColor: '#E0E0E0',
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 20,
    color: '#333333',
    lineHeight: 24,
  },
  badge: {
    width: 32,
    height: 20,
    borderRadius: 16,
    backgroundColor: '#FF7272',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // ✅ 편집 모드일 때만 적용되는 추가 스타일
  avatarEditing: {
    marginLeft: 44,
  },
  textEditing: {
    marginLeft: 6,
  },
});
