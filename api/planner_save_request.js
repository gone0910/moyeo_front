// api/planner_save_request.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';
import api from './AxiosInstance';

/**
 * 서버 스펙: Authorization 헤더 필요, 바디는 title/startDate/endDate/days[].places[] 구조
 * 성공 시 { scheduleId: number } 반환. :contentReference[oaicite:0]{index=0}
 *
 * @param {{
 *  title: string,
 *  startDate: string, // 'YYYY-MM-DD'
 *  endDate: string,   // 'YYYY-MM-DD'
 *  days: Array<{
 *    places: Array<{
 *      type: string, name: string, hashtag?: string,
 *      estimatedCost?: number, lat?: number, lng?: number,
 *      walkTime?: number|null, driveTime?: number|null, transitTime?: number|null,
 *      placeOrder?: number // 없으면 함수가 1부터 채워줌
 *    }>
 *  }>
 * }} scheduleData
 * @returns {Promise<{scheduleId:number}>}
 */
export async function saveSchedule(scheduleData) {
  if (!scheduleData) throw new Error('scheduleData가 없습니다.');

  // [제거] api/axiosInstance가 토큰을 자동 관리합니다.
  // const token =
  //   (await AsyncStorage.getItem('accessToken')) ||
  //   (await AsyncStorage.getItem('jwt')) ||
  //   (await AsyncStorage.getItem('token'));

  // if (!token) throw new Error('JWT 토큰이 없습니다.');

  // placeOrder 보정: 각 day의 places에 1..N 순번을 채움
  const normalizedDays = (scheduleData.days || []).map((day) => {
    const places = (day.places || []).map((p, idx) => ({
      ...p,
      placeOrder: typeof p.placeOrder === 'number' ? p.placeOrder : idx + 1,
    }));
    return { places };
  });

  const body = {
  scheduleId: scheduleData.id ?? scheduleData.scheduleId, // ✅ 기존 ID 유지
  title: scheduleData.title || 'My Trip',
  startDate: scheduleData.startDate,
  endDate: scheduleData.endDate,
  days: normalizedDays,
};

// ⬇️ [변경] axios.post -> api.post, headers 제거
  const res = await api.post(
    `${BASE_URL}/schedule/save`, // 저장 엔드포인트
    body
    // ⬅️ [제거] headers: { ... }
    // api가 자동으로 Authorization (요구 헤더 명세 일치)과 'Content-Type'을 주입합니다.
  );

  // 성공 응답 예: { "scheduleId": 1 }
  if (!res?.data?.scheduleId && res?.status !== 200) {
    throw new Error('일정 저장 실패');
  }
  return res.data; // { scheduleId }
}
