// /api/getScheduleDetail.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';

/**
 * 여행 일정 상세 조회
 * GET /schedule/full/{scheduleId}
 *
 * @param {number|string} scheduleId - 조회할 일정의 ID
 * @returns {Promise<Object>} 백엔드에서 반환한 일정 데이터
 */
export async function getScheduleDetail(scheduleId) {
  const token =
    (await AsyncStorage.getItem('accessToken')) ||
    (await AsyncStorage.getItem('access')) ||
    (await AsyncStorage.getItem('jwt'));

  if (!token) {
    const e = new Error('NO_TOKEN');
    e.code = 'NO_TOKEN';
    throw e;
  }

  const idNum = Number(String(scheduleId ?? '').match(/^\d+$/)?.[0]);
  if (!Number.isFinite(idNum)) {
    throw new Error(`유효하지 않은 scheduleId: ${scheduleId}`);
  }

  const url = `${BASE_URL}/schedule/full/${idNum}`;
 const cacheBuster = Date.now(); // 캐시 무력화용
  console.log('🌐 [getScheduleDetail] 요청 URL:', url);

  try {
    const res = await axios.get(url, {
     headers: {
       Authorization: `Bearer ${token}`,
       'Cache-Control': 'no-cache',
       Pragma: 'no-cache',
     },
     params: { t: cacheBuster }, // URL에 ?t= 타임스탬프
   });

    // 여기서 반환 데이터 길이와 주요 키를 로깅
    const data = res.data;
    console.log('✅ [getScheduleDetail] 성공:', {
      status: res.status,
      keys: Object.keys(data || {}),
      daysCount: data?.days?.length,
      totalEstimatedCost: data?.totalEstimatedCost,
    });
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const message = err?.message || '알 수 없는 오류';
    console.warn('❌ [getScheduleDetail] 실패:', { status, message });
    throw err;
  }
}
