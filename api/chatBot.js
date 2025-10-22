// api/chatBot.js (수정 완료)

import api from './AxiosInstance'; // 1. axios 대신 중앙 인스턴스 'api'를 가져옵니다.

// 2. 모든 함수에서 token 파라미터와 try...catch를 제거합니다.

// GPS 기반 질의
export const queryByGPS = async ({ category, latitude, longitude }) => {
  const body = { category, latitude, longitude };
  // 3. axios.post 대신 api.post를 사용하고, 헤더 설정을 삭제합니다.
  const response = await api.post('/chatbot/gps', body);
  return response.data;  // 서버 응답 dto
};

// 목적지 기반 질의
export const queryByDestination = async ({ city, category }) => {
  const body = { city, category };
  const response = await api.post('/chatbot/destination', body);
  return response.data;
};

// GPS 기반 재질의
export const recreateByGPS = async ({ category, latitude, longitude, excludedNames }) => {
  const body = { category, latitude, longitude, excludedNames };
  const response = await api.post('/chatbot/recreate/gps', body);
  return response.data;
};

// 목적지 기반 재질의
export const recreateByDestination = async ({ city, category, excludedNames }) => {
  const body = { city, category, excludedNames };
  const response = await api.post('/chatbot/recreate/destination', body);
  return response.data;
};