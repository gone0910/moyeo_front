// api/planner_edit_request.js
import axios from 'axios';
import { BASE_URL } from './config/api_Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 일정 편집 API
 * 명세: POST /schedule/edit
 * body: { names: string[] }
 * res: { places: Place[], totalEstimatedCost?: number }
 */
export async function editSchedule({ names }) {
  const token = await AsyncStorage.getItem('jwt');
  const url = `${BASE_URL}/schedule/edit`;
  const headers = { Authorization: `Bearer ${token}` };

  // ✅ 요청 로그
  console.log('🌐 [editSchedule][REQ]', { names, url });

  try {
    // ✅ 응답 로그
    const { data, status } = await axios.post(url, { names }, { headers, timeout: 20000 });
    console.log(
      '✅ [editSchedule][RES]',
      status,
      Array.isArray(data?.places) ? data.places.length : 'no places'
    );
    return data;
  } catch (e) {
    const st = e?.response?.status;
    const body = e?.response?.data;
    // ✅ 에러 로그
    console.warn('❌ [editSchedule][ERR]', st, body?.error || body);
    // ⚠️ 서버(Tmap) 쿼터 초과 등 → 보강 스킵 신호
    return { quotaExceeded: true };
  }
}
