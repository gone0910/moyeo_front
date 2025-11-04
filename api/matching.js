// 🔁 여행자 매칭 관련 API 함수 파일 (React Native + Axios)
// 📌 모든 요청은 JWT 토큰 필요 / Content-Type: application/json
// 📌 Expo Go 환경에서도 문제 없이 작동함

import axios from 'axios';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경
import api from './AxiosInstance';


// const BASE_URL = 'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080'; // ✅ 실제 서버 주소로 교체 필요

// ─────────────────────────────────────────────
// ✅ [1] 매칭 정보 입력/수정
// - API 명세: POST /matching/profile
export const submitMatchingProfile = async (data) => { // ⬅️ token 매개변수 제거
  console.log('📤 [전송할 매칭 데이터]', data);
  try {
    // ⬇️ axios.post -> api.post, headers 제거
    const response = await api.post(`${BASE_URL}/matching/profile`, data, {
      // Authorization 헤더는 api 인스턴스가 자동으로 추가함
    });
    console.log('✅ 매칭 정보 입력 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 매칭 정보 입력 오류:', error.response || error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// ✅ [2] 매칭된 사용자 리스트 조회
// - API 명세: GET /matching/result
export const getMatchingList = async () => { // ⬅️ token 매개변수 제거
  try {
    // ⬇️ axios.get -> api.get, headers 제거
    const response = await api.get(`${BASE_URL}/matching/result`);
    console.log('📦 매칭 리스트:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 리스트 요청 오류:', error.response || error);
    return [];
  }
};

// ─────────────────────────────────────────────
// ✅ [3] 특정 사용자 상세 정보 조회
// - API 명세: GET /matching/profile?nickname={닉네임}
// - 설명: 리스트에서 특정 사용자를 선택했을 때 상세정보 조회
// - 사용 위치: MatchingResultDetailScreen.jsx 또는 모달
export const getUserMatchingDetail = async (nickname) => { // ⬅️ [변경] token 인자 제거
  try {
    // ⬇️ [변경] axios.get -> api.get, headers 제거
    const response = await api.get(`${BASE_URL}/matching/profile`, {
      params: { nickname }, // 쿼리 파라미터는 그대로 유지
    });
    console.log('📋 사용자 상세정보:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 상세정보 오류:', error.response || error);
    return null;
  }
};
