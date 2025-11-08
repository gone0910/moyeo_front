// 📁 api/planner_resave_request.js
// 목적: 기존 일정(scheduleId)의 편집 결과를 재저장(resave)하는 API 호출
// 엔드포인트: PUT /schedule/resave/{scheduleId}
// 요청 바디: { days: [ { day, date, totalEstimatedCost, places: [...] } ] }
// 응답: { scheduleId: number }
//
// 사용 예:
// import { resaveSchedule } from './planner_resave_request';
// await resaveSchedule(1, daysArray); // daysArray는 UI에서 편집된 days 그대로

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';

/** 내부: 토큰 로드 (키 후보를 순차 조회) */
async function loadToken() {
  const keys = ['jwt', 'accessToken', 'token'];
  for (const k of keys) {
    const v = await AsyncStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

/** 내부: days payload 정리 (필드 보존, undefined는 제거) */
function sanitizeDays(days) {
  if (!Array.isArray(days)) return [];

  const toNonNegNum = (v, def = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return def;
    return Math.max(0, Math.round(n));
  };

  // 시간값은 음수(-1 등)를 허용하고, 비수치/미입력은 필드 생략(undefined) 처리
  const toTime = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : undefined;
  };

  const toCoord = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

  return days.map((d) => {
    const base = {
      day: d?.day, // "2일차" 형태 그대로 유지
      date: d?.date, // "YYYY-MM-DD"
      totalEstimatedCost: toNonNegNum(d?.totalEstimatedCost, 0),
      places: Array.isArray(d?.places)
        ? d.places.map((p) => {
            const obj = {
              type: p?.type,
              name: p?.name,
              hashtag: p?.hashtag,
              estimatedCost: toNonNegNum(p?.estimatedCost, 0),
              lat: toCoord(p?.lat),
              lng: toCoord(p?.lng),
              walkTime: toTime(p?.walkTime),
              driveTime: toTime(p?.driveTime),
              transitTime: toTime(p?.transitTime),
            };
            // undefined 필드 제거
            Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k]);
            return obj;
          })
        : [],
    };

    // 상위 레벨 undefined 제거
    Object.keys(base).forEach((k) => base[k] === undefined && delete base[k]);
    return base;
  });
}

/**
 * 일정 재저장 요청
 * @param {number|string} scheduleId - 대상 일정 ID
 * @param {Array} days - UI 편집 결과 (요청 샘플의 days 구조)
 * @param {{ method?: 'PUT'|'POST' }} [opts]
 * @returns {Promise<{scheduleId:number}>}
 */
export async function resaveSchedule(scheduleId, days, opts = {}) {
  // ✅ 기본 메서드를 POST로
  const method = (opts.method || 'POST').toUpperCase();
  const url = `${BASE_URL}/schedule/resave/${scheduleId}`;

  const token = await loadToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const payload = { days: sanitizeDays(days) };
  console.log('🌐 [resaveSchedule][REQ]', JSON.stringify({ url, method, scheduleId }, null, 2));
  console.log('🧾 [resaveSchedule][BODY]', JSON.stringify(payload, null, 2));

  try {
    const res = method === 'POST'
      ? await axios.post(url, payload, { headers })
      : await axios.put(url, payload, { headers });

    return res?.data ?? {};
  } catch (error) {
    // ✅ PUT으로 왔고 405라면 POST로 한 번 더 시도
    const status = error?.response?.status;
    if (method === 'PUT' && status === 405) {
      console.warn('↻ 405(Method Not Allowed) -> POST로 재시도합니다.');
      const res = await axios.post(url, payload, { headers });
      return res?.data ?? {};
    }
    // 그 외 에러는 그대로 던짐
    throw error;
  }
}
export default resaveSchedule;
