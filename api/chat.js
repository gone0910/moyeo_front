// 📁 api/chat.js (axios 기반)
// ✅ 채팅 관련 REST API 함수 모음 (이미지 전송 없음 → axios 사용 적합)

// 📁 api/chat.js (수정 후)

import axios from 'axios';
import { BASE_URL } from './config/api_Config';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 1. 채팅방 생성 요청 (수정 없음)
 */
export const createChatRoom = async (nickname, token) => {
  // ... (기존 코드와 동일)
  const res = await axiosInstance.post(
    `/chat/room/create?otherUserNickname=${encodeURIComponent(nickname)}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  console.log('[📦 응답 원본]', res.data); 

    if (typeof res.data === 'number' || typeof res.data === 'string') {
      return {
        roomId: res.data,
        nickname,
        profileUrl: null,
      };
    }

    return res.data;
};


/**
 * 2. 채팅방 목록 조회
 * - 현재 로그인한 사용자가 참여 중인 채팅방 리스트를 반환
 * - [수정] 서버 응답을 가공없이 그대로 반환하도록 .map() 로직 제거
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

    // [수정] .map()을 사용한 데이터 가공 로직을 제거하고 서버 응답 그대로 반환
    return res.data;

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
 * 3. 채팅방 과거 메시지 조회 (수정 없음)
 */
export const getChatHistory = async (roomId, token) => {
  // ... (기존 코드와 동일)
  const res = await axiosInstance.get(
    `/chat/history/${roomId}`, 
    {
    headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

//  * 4. 채팅방 읽음 처리 요청
//  * - 해당 roomId의 메시지들을 모두 읽음 처리
//  * - 서버에서 현재 시점 이전 메시지 기준으로 처리됨
//  */
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
 * 5. 채팅방 나가기 요청 (수정 없음)
 */
export const exitChatRoom = async (roomId, token) => {
  // ... (기존 코드와 동일)
  const res = await axiosInstance.delete(
    `/chat/room/${roomId}/leave`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.status === 200;
};