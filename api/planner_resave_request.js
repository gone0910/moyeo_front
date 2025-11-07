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
    return Math.max(0, n);
  };

  return days.map(d => {
    const base = {
      day: d?.day,
      date: d?.date,
      totalEstimatedCost: toNonNegNum(d?.totalEstimatedCost, 0),
      places: Array.isArray(d?.places)
        ? d.places.map(p => ({
            type: p?.type,
            name: p?.name,
            hashtag: p?.hashtag,
            estimatedCost: toNonNegNum(p?.estimatedCost, 0),
            lat: typeof p?.lat === 'number' ? p.lat : undefined,
            lng: typeof p?.lng === 'number' ? p.lng : undefined,
            // 음수라도 그대로 전송 (서버에서 -1 인식)
            walkTime: Number(p?.walkTime),
            driveTime: Number(p?.driveTime),
            transitTime: Number(p?.transitTime),
          }))
        : [],
    };

    // undefined 필드만 제거
    const cleaned = JSON.parse(JSON.stringify(base));
    return cleaned;
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
  const method = (opts.method || 'PUT').toUpperCase(); // 기본 PUT
  const url = `${BASE_URL}/schedule/resave/${scheduleId}`;

  const token = await loadToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const payload = {
    days: sanitizeDays(days),
  };

  // 🔎 진단 로그
  console.log('🌐 [resaveSchedule][REQ]', JSON.stringify({ url, method, scheduleId }, null, 2));
  console.log('🧾 [resaveSchedule][BODY]', JSON.stringify(payload, null, 2));

  try {
    const res =
      method === 'POST'
        ? await axios.post(url, payload, { headers })
        : await axios.put(url, payload, { headers });

    const data = res?.data ?? {};
    console.log('✅ [resaveSchedule][RES]', JSON.stringify({ status: res?.status, data }, null, 2));
    if (typeof data?.scheduleId !== 'number') {
      console.warn('⚠️ [resaveSchedule] 응답에 scheduleId(number)가 없습니다:', data);
    }
    return data;
  } catch (error) {
    const status = error?.response?.status;
    const errData = error?.response?.data;
    console.error('❌ [resaveSchedule][ERR]', JSON.stringify({ status, errData, message: error?.message }, null, 2));
    // 호출 측에서 에러 핸들링 가능하도록 throw
    throw error;
  }
}

export default resaveSchedule;
