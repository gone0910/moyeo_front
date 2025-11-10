// /api/getScheduleDetail.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';
import api from './AxiosInstance';

/**
 * 여행 일정 상세 조회
 * GET /schedule/full/{scheduleId}
 *
 * @param {number|string} scheduleId - 조회할 일정의 ID
 * @returns {Promise<Object>} 백엔드에서 반환한 일정 데이터
 */
export async function getScheduleDetail(scheduleId) {
  // ⬇️ [제거] api 인스턴스가 토큰을 자동으로 주입하므로 수동 조회 로직 제거
  // const token =
  //   (await AsyncStorage.getItem('accessToken')) ||
  //   (await AsyncStorage.getItem('access')) ||
  //   (await AsyncStorage.getItem('jwt'));
  //
  // if (!token) {
  //   const e = new Error('NO_TOKEN');
  //   e.code = 'NO_TOKEN';
  //   throw e;
  // }

  const idNum = Number(String(scheduleId ?? '').match(/^\d+$/)?.[0]);
  if (!Number.isFinite(idNum)) {
    throw new Error(`유효하지 않은 scheduleId: ${scheduleId}`);
  }

  const url = `${BASE_URL}/schedule/full/${idNum}`;
  const cacheBuster = Date.now(); // 캐시 무력화용
  console.log('🌐 [getScheduleDetail] 요청 URL:', url);

  try {
    // ⬇️ [변경] axios.get -> api.get
    const res = await api.get(url, {
      headers: {
        // ⬅️ [제거] Authorization: `Bearer ${token}` (api가 자동 주입)
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
    // ⬇️ [동작] api.get()이 401 재발급 실패 등으로 오류를 throw한 경우 여기서 잡힙니다.
    const status = err?.response?.status;
    const message = err?.message || '알 수 없는 오류';
    console.warn('❌ [getScheduleDetail] 실패:', { status, message });
    throw err;
  }
}