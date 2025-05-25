// 📁 api/chat.js (axios 기반)
// ✅ 채팅 관련 REST API 함수 모음 (이미지 전송 없음 → axios 사용 적합)

import axios from 'axios';

// ✅ 실제 API 주소로 교체 필요
const BASE_URL = 'http://ec2-54-180-25-3.ap-northeast-2.compute.amazonaws.com:8080';

// ✅ axios 인스턴스 생성: baseURL과 JSON Content-Type 설정
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 1. 채팅방 생성 요청
 * - 상대방 userId를 서버에 전송
 * - 이미 존재하는 채팅방이 있으면 해당 roomId 반환
 * - 없으면 새로 생성해서 roomId 반환
 */
export const createChatRoom = async (nickname, token) => {
  const res = await axiosInstance.post(
    `/chat/room/create?otherUserNickname=${encodeURIComponent(nickname)}`,
    {}, // ✅ 빈 body
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  console.log('[📦 응답 원본]', res.data); // 반드시 찍어서 확인할 것

    // ✅ roomId만 단일 숫자로 반환되는 경우를 방지
    if (typeof res.data === 'number' || typeof res.data === 'string') {
      return {
        roomId: res.data,
        nickname,
        profileUrl: null, // 기본 이미지 혹은 나중에 다시 조회
      };
    }

    return res.data;
  };


/**
 * 2. 채팅방 목록 조회
 * - 현재 로그인한 사용자가 참여 중인 채팅방 리스트를 반환
 */
export const fetchChatRooms = async (token) => {
  const res = await axiosInstance.get('/chat/my/rooms', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

    // ✅ 이 로그를 추가하세요
  console.log('[원시 응답 원본]', JSON.stringify(res.data, null, 2));

  // ✅ 백엔드 응답 필드명을 프론트에서 쓰는 형식으로 변환
  return res.data.map((room) => ({
    roomId: room.roomId,
    nickname: room.otherUserNickname,     // ← 변환됨
    profileUrl: room.otherUserImageUrl,   // ← 변환됨
    unreadCount: room.unReadCount,        // ← 변환됨
  }));
};

/**
 * 3. 채팅방 과거 메시지 조회
 * - roomId를 기반으로 과거 채팅 메시지를 조회
 *  응답에는 inReadUserCount가 포함되며, isRead는 프론트에서 계산 필요
 *  isRead = (inReadUserCount === 0
 */
export const getChatHistory = async (roomId, token) => {
  const res = await axiosInstance.get(
    `/chat/history/${roomId}`, 
    {
    headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data; // [{ senderId, message, createdAt, ... }, ...]
};

/**
 * 4. 채팅방 읽음 처리 요청
 * - 해당 roomId의 메시지들을 모두 읽음 처리
 * - 서버에서 현재 시점 이전 메시지 기준으로 처리됨
 */
export const markAsRead = async (roomId, token) => {
  const res = await axiosInstance.post(
    `/chat/room/${roomId}/read`,
    {}, // body 명세서에는 없어서 임의로 공백처리.
    { 
      headers: { Authorization: `Bearer ${token}` }
     }
  );
  return res.status === 200;
};

/**
 * 5. 채팅방 나가기 요청
 * - 해당 채팅방에서 사용자가 퇴장
 * - 모든 참여자가 나갈 경우 채팅방 삭제될 수 있음
 */
export const exitChatRoom = async (roomId, token) => {
  const res = await axiosInstance.delete(
    `/chat/room/${roomId}/leave`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.status === 200;
};