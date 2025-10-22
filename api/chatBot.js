// api/chatBot.js  (챗봇 명세서 v2 최신화 버전)

import axios from 'axios';

const BASE_URL = 'http://ec2-3-34-144-242.ap-northeast-2.compute.amazonaws.com:8080'; // 실제 배포 주소로 교체

// 1. GPS 기반 질의 (현재 위치/카테고리로 여행 정보 or 날씨 요청)
export async function queryByGPS({ category, latitude, longitude }, token) {
  try {
    // category: "SPOT"|"FOOD"|"HOTEL"|"FESTIVAL"|"WEATHER"
    const body = { category, latitude, longitude };
    const res = await axios.post(
      `${BASE_URL}/chatbot/gps`,
      body,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return res.data; // 서버 응답 리스트(카테고리별 DTO)
  } catch (error) {
    return { success: false, error: error?.response?.data?.message || error.message };
  }
}

// 2. 목적지 기반 질의 (선택한 시/카테고리로 여행 정보 or 날씨 요청)
export async function queryByDestination({ city, category }, token) {
  console.log('[API 호출 - 목적지]', city, category, token);

  try {
    const body = { city, category };
    const res = await axios.post(
      `${BASE_URL}/chatbot/destination`,
      body,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return res.data; // 서버 응답 리스트(카테고리별 DTO)
  } catch (error) {
    return { success: false, error: error?.response?.data?.message || error.message };
  }
}

// 3. GPS 기반 재질의 (중복 제외, 기존 응답 데이터 제외하고 재조회)
export async function recreateByGPS({ category, latitude, longitude, excludedNames }, token) {
  try {
    const body = { category, latitude, longitude, excludedNames };
    const res = await axios.post(
      `${BASE_URL}/chatbot/recreate/gps`,
      body,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return res.data; // 서버 응답 리스트(카테고리별 DTO)
  } catch (error) {
    return { success: false, error: error?.response?.data?.message || error.message };
  }
}

// 4. 목적지 기반 재질의 (중복 제외, 기존 응답 데이터 제외하고 재조회)
export async function recreateByDestination({ city, category, excludedNames }, token) {
  try {
    const body = { city, category, excludedNames };
    const res = await axios.post(
      `${BASE_URL}/chatbot/recreate/destination`,
      body,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return res.data; // 서버 응답 리스트(카테고리별 DTO)
  } catch (error) {
    return { success: false, error: error?.response?.data?.message || error.message };
  }
}