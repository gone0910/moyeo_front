// api/planner_edit_request.js
import axios from 'axios';
import { BASE_URL } from './config/api_Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './AxiosInstance';

/**
 * 일정 편집 API
 * 명세: POST /schedule/edit
 * body: { names: string[] }
 * res: { places: Place[], totalEstimatedCost?: number }
 */
export async function editSchedule({ names }) {
  // ⬇️ [제거] api가 토큰을 자동 관리합니다.
  // const token = await AsyncStorage.getItem('jwt');
  const url = `${BASE_URL}/schedule/edit`;
  // ⬇️ [제거] api가 헤더를 자동 주입합니다.
  // const headers = { Authorization: `Bearer ${token}` };

  // ✅ 요청 로그
  console.log('🌐 [editSchedule][REQ]', { names, url });

  try {
    // ⬇️ [변경] axios.post -> api.post, headers 제거
    const { data, status } = await api.post(
      url,
      { names },
      { timeout: 20000 } // ⬅️ [유지] 타임아웃 설정은 config 객체에 유지
    );
    
    console.log(
      '✅ [editSchedule][RES]',
      status,
      Array.isArray(data?.places) ? data.places.length : 'no places'
    );
    return data;
  } catch (e) {
    // ⬇️ [동작] 401/403 재발급 실패 시 에러도 여기서 잡힙니다.
    const st = e?.response?.status;
    const body = e?.response?.data;
    // ✅ 에러 로그
    console.warn('❌ [editSchedule][ERR]', st, body?.error || body);
    // ⚠️ 서버(Tmap) 쿼터 초과 등 → 보강 스킵 신호
    return { quotaExceeded: true };
  }
}