// 📁 api/chat.js (axios 기반)
// ✅ 채팅 관련 REST API 함수 모음
// 📌 AxioInstance(api)를 사용하여 자동 토큰 재발급 처리

import api from './AxiosInstance'; // ⬅️ [변경] axios -> api (경로 확인)
import { BASE_URL } from './config/api_Config';

// ⬇️ [제거] 이 파일 내부의 별도 axiosInstance 생성 로직 제거
// const axiosInstance = axios.create({ ... });

/**
 * 1. 채팅방 생성 요청
 */
export const createChatRoom = async (nickname) => { // ⬅️ [변경] token 인자 제거
  const res = await api.post( // ⬅️ [변경] axiosInstance -> api
    `/chat/room/create?otherUserNickname=${encodeURIComponent(nickname)}`,
    {}
    // ⬅️ [제거] headers: { Authorization } 제거 (자동 주입)
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
 */
export const fetchChatRooms = async () => { // ⬅️ [변경] token 인자 제거
  console.log('[fetchChatRooms 호출]');
  try {
    const res = await api.get('/chat/my/rooms'); // ⬅️ [변경] axiosInstance -> api, headers 제거

    // 응답 전체 구조 로깅
    console.log('[원시 응답 원본]', JSON.stringify(res.data, null, 2));

    return res.data;

  } catch (error) {
    // ... (오류 로깅은 그대로 유지)
    console.log('[❌ fetchChatRooms 오류]', error);
    if (error.response) {
      console.log('[❌ 응답 status]', error.response.status);
      console.log('[❌ 응답 data]', error.response.data);
      console.log('[❌ 응답 headers]', error.response.headers);
    }
    throw error;
  }
};

/**
 * 3. 채팅방 과거 메시지 조회
 */
export const getChatHistory = async (roomId) => { // ⬅️ [변경] token 인자 제거
  const res = await api.get( // ⬅️ [변경] axiosInstance -> api
    `/chat/history/${roomId}`
    // ⬅️ [제거] headers: { Authorization } 제거
  );
  return res.data;
};

/**
 * 4. 채팅방 읽음 처리 요청
 */
export const markAsRead = async (roomId) => { // ⬅️ [변경] token 인자 제거
  const res = await api.post( // ⬅️ [변경] axiosInstance -> api
    `/chat/room/${roomId}/read`,
    {} // body
    // ⬅️ [제거] headers: { Authorization } 제거
  );
  return res.status === 200;
};

/**
 * 5. 채팅방 나가기 요청
 */
export const exitChatRoom = async (roomId) => { // ⬅️ [변경] token 인자 제거
  const res = await api.delete( // ⬅️ [변경] axiosInstance -> api
    `/chat/room/${roomId}/leave`
    // ⬅️ [제거] headers: { Authorization } 제거
  );
  return res.status === 200;
};