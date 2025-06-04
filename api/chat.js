// 📁 api/chat.js (axios 기반)
// ✅ 채팅 관련 REST API 함수 모음 (이미지 전송 없음 → axios 사용 적합)

import axios from 'axios';

// ✅ 실제 API 주소로 교체 필요
const BASE_URL = 'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080';

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
  console.log('[fetchChatRooms 호출] 전달받은 토큰:', token);
  try {
    const res = await axiosInstance.get('/chat/my/rooms', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 응답 전체 구조 로깅
    console.log('[원시 응답 원본]', JSON.stringify(res.data, null, 2));

    return res.data.map((room) => ({
      roomId: room.roomId,
      nickname: room.otherUserNickname,
      profileUrl: room.otherUserImageUrl,
      unreadCount: room.unReadCount,
    }));
  } catch (error) {
    // 오류 로그 추가
    console.log('[❌ fetchChatRooms 오류]', error);
    if (error.response) {
      console.log('[❌ 응답 status]', error.response.status);
      console.log('[❌ 응답 data]', error.response.data);
      console.log('[❌ 응답 headers]', error.response.headers);
    }
    throw error; // 상위에서 또 잡음
  }
};

/**
 * 3. 채팅방 과거 메시지 조회
 * - roomId를 기반으로 과거 채팅 메시지를 조회
 *  응답에는 unReadUserCount가 포함되며, isRead는 프론트에서 계산 필요
 *  isRead = (unReadUserCount === 0
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