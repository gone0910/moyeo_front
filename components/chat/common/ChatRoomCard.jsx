// components/chat/common/ChatRoomCard.jsx

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

// ... (스타일링 함수 및 formatListTime 함수는 기존과 동일)
const { width: W, height: H } = Dimensions.get('window');
const BW = 390, BH = 844;
const s = (x) => Math.round((W / BW) * x);
const vs = (x) => Math.round((H / BH) * x);

const formatListTime = (isoLike) => {
  if (!isoLike) return '';
  try {
    const d = new Date(isoLike);
    if (isNaN(d.getTime())) return '';

    // +9시간 KST 변환 (핵심 추가)
    const koreaTime = new Date(d.getTime() + 9 * 60 * 60 * 1000);

    const now = new Date(); // 'now'는 이미 KST 기준 현재 시간입니다.

    // [버그 수정]
    // 'now'에 9시간을 이중으로 더하고 있었기 때문에 'nowKorea'가
    // KST 기준 다음 날짜로 넘어가는 문제가 있었습니다.
    // const nowKorea = new Date(now.getTime() + 9 * 60 * 60 * 1000); // <--- [기존 버그 코드]
    
    // [수정] 'nowKorea' 대신 'now'를 사용하도록 변경합니다.
    // (또는 const nowKorea = now; 로 선언해도 됩니다.)

    const y = koreaTime.getFullYear();
    const m = koreaTime.getMonth() + 1;
    const day = koreaTime.getDate();

    // [수정] nowKorea.getFullYear() -> now.getFullYear()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(y, koreaTime.getMonth(), day);
    const diffDays = Math.floor((today - target) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // ... (이하 동일)
      const hh = String(koreaTime.getHours()).padStart(2, '0');
      const mm = String(koreaTime.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }

    if (diffDays === 1) return '어제';

    // [수정] nowKorea.getFullYear() -> now.getFullYear()
    if (y === now.getFullYear()) return `${m}월 ${day}일`;

    const MM = String(m).padStart(2, '0');
    const DD = String(day).padStart(2, '0');
    return `${y}.${MM}.${DD}`;
  } catch {
    return '';
  }
};


export default function ChatRoomCard({ room, isEditing, onDeletePress }) {
  const navigation = useNavigation();

  console.log(
    `[ChatRoomCard] ID: ${room?.roomId}, 원본 메시지: ${room?.lastMessage}, 원본 시간: ${room?.lastMessageTime}`
  );

  const handlePress = () => {
    if (isEditing) return;
    navigation.navigate('ChatRoomScreen', {
      roomId: room.roomId,
      nickname: room.otherUserNickname, // API 명세와 일치
      profileUrl: room.otherUserImageUrl, // API 명세와 일치
    });
  };

  // 안전 처리
  const name = room?.otherUserNickname || '';
  const lastMessage = room?.lastMessage || '';
  // [수정] lastMessageCreatedAt -> lastMessageTime
  const time = formatListTime(room?.lastMessageTime);
  const unread = Number(room?.unReadCount ?? 0);
  const profileUrl = room?.otherUserImageUrl || '';

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      {/* 프로필 이미지 */}
      <Image source={{ uri: profileUrl }} style={styles.avatar} />

      {/* 중앙 텍스트 */}
      <View style={[styles.textWrapper, isEditing && unread === 0 && styles.textWrapperEditing]}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>

        {/* 마지막 메시지 */}
        {!!lastMessage && (
          <Text style={styles.preview} numberOfLines={1}>
            {lastMessage}
          </Text>
        )}

        {/* 시간 — 마지막 메시지 바로 아래로 */}
        {!!time && <Text style={styles.time}>{time}</Text>}
      </View>

      {/* 안읽은 수 */}
      {unread > 0 && (
        <View style={[styles.badge, isEditing && styles.badgeEditing]}>
          <Text style={styles.badgeText}>{unread}</Text>
        </View>
      )}

      {/* 삭제 아이콘 */}
      {isEditing && (
        <TouchableOpacity onPress={onDeletePress} style={styles.deleteIconWrapper}>
          <MaterialIcons name="cancel" size={s(21)} color="#FF7E7E" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const AVATAR = s(48);
const BADGE = s(22);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    height: vs(72), // 살짝 높여서 3줄 여유
    paddingHorizontal: s(20),
    position: 'relative',
    marginBottom: vs(10),
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    marginRight: s(12),
    backgroundColor: '#E0E0E0',
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  textWrapperEditing: {
    marginRight: s(44), // (뱃지 없을 때) 삭제 아이콘 영역 확보
  },
  name: {
    fontSize: s(15),
    fontWeight: '500',
    color: '#111111',
    lineHeight: vs(18),
  },
  preview: {
    fontSize: s(13),
    fontWeight: '400',
    color: '#767676',
    lineHeight: vs(18),
    marginTop: vs(2),
  },
  time: {
    fontSize: s(12),
    fontWeight: '400',
    color: '#767676',
    lineHeight: vs(17),
    marginTop: vs(2),
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#FFF', fontSize: s(11), fontWeight: '500' },
  badgeEditing: { marginRight: s(44) },
  deleteIconWrapper: {
    position: 'absolute',
    top: '50%',
    right: s(22),
    marginTop: -s(10),
    zIndex: 1,
  },
});
