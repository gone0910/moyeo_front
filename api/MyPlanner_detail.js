// /api/getScheduleDetail.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경

/**
 * 여행 일정 상세 조회
 * GET /schedule/full/{scheduleId}
 *
 * @param {number|string} scheduleId - 조회할 일정의 ID
 * @returns {Promise<Object>} 백엔드에서 반환한 일정 데이터
 */
export async function getScheduleDetail(scheduleId) {
  // 🔐 토큰 키 혼재 대응
  const token =
    (await AsyncStorage.getItem('accessToken')) ||
    (await AsyncStorage.getItem('access')) ||
    (await AsyncStorage.getItem('jwt'));

  if (!token) {
    const e = new Error('NO_TOKEN');
    e.code = 'NO_TOKEN';
    throw e;
  }

  // 🆔 숫자만 추출
  const idNum = Number(String(scheduleId ?? '').match(/^\d+$/)?.[0]);
  if (!Number.isFinite(idNum)) {
    throw new Error(`유효하지 않은 scheduleId: ${scheduleId}`);
  }

  // 📡 상세 조회 요청
  const url = `${BASE_URL}/schedule/full/${idNum}`;
  console.log('LOG  [getScheduleDetail] 요청 URL:', url);

  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('LOG  ✅ [getScheduleDetail] 성공:', res.status);
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const message = err?.message || '알 수 없는 오류';
    console.warn('WARN  [getScheduleDetail] 실패:', { status, message });
    throw err;
  }
}
