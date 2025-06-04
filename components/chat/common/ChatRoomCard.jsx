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
          <MaterialIcons name="remove-circle" size={21} color="#FF7E7E" />
        </TouchableOpacity>
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
    right: 8,
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
  badgeEditing: {
    marginRight: 44,
  },

});
