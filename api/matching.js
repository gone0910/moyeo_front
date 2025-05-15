// 🔁 여행자 매칭 관련 API 함수 파일 (React Native + Axios)
// 📌 모든 요청은 JWT 토큰 필요 / Content-Type: application/json
// 📌 Expo Go 환경에서도 문제 없이 작동함

import axios from 'axios';

const BASE_URL = 'http://ec2-54-180-25-3.ap-northeast-2.compute.amazonaws.com:8080'; // ✅ 실제 서버 주소로 교체 필요

// ─────────────────────────────────────────────
// ✅ [1] 매칭 정보 입력/수정
// - API 명세: POST /matching/profile
// - 요청 데이터: startDate, endDate, province, cities, groupType, ageRange, travelStyles
// - 설명: 사용자가 매칭 조건을 입력하면 서버에 저장됨
// - 사용 위치: MatchingInfoScreen.jsx (정보 입력 버튼 클릭 시 호출)
export const submitMatchingProfile = async (data, token) => {
  console.log('📤 [전송할 매칭 데이터]', data);
  console.log('🔐 [전송할 토큰]', token);
  try {
    const response = await axios.post(`${BASE_URL}/matching/profile`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json', // 생략 가능 (디폴트가 application/json)
      },
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
// - 설명: 조건에 맞는 사용자 리스트를 받아옴
// - 주의: 빈 배열([])과 API 실패(null) 구분 필수
// - 사용 위치: MatchingInfoScreen.jsx (조건 입력 후 자동 조회 or 수동 버튼)
export const getMatchingList = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/matching/result`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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
export const getUserMatchingDetail = async (nickname, token) => {
  try {
    const response = await axios.get(`${BASE_URL}/matching/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { nickname },
    });
    console.log('📋 사용자 상세정보:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 상세정보 오류:', error.response || error);
    return null;
  }
};
