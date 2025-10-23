// api/planner_delete_request.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';

/**
 * 🗑️ 여행 플랜 삭제 API
 * @param {string|number} rawId - 삭제할 일정의 ID
 * @returns {Promise<Object>} - 서버 응답 데이터
 */
export async function deleteSchedule(rawId) {
  // 1) id 정규화 (undefined, null, 0, 공백 방지)
  const scheduleId = (rawId ?? '').toString().trim();
  if (!scheduleId) {
    const msg = '삭제할 scheduleId가 필요합니다.';
    console.error('❌ deleteSchedule:', msg, { rawId });
    throw new Error(msg);
  }

  // 2) JWT 확인
  const token = await AsyncStorage.getItem('jwt');
  if (!token) {
    throw new Error('JWT 토큰이 존재하지 않습니다.');
  }

  // 3) URL 안전 처리 (encodeURIComponent)
  const url = `${BASE_URL.replace(/\/+$/, '')}/schedule/delete/${encodeURIComponent(scheduleId)}`;
  console.log('🗑️ DELETE 요청 →', url, '| id =', scheduleId);

  try {
    const response = await axios.delete(url, {
      headers: { Authorization: `Bearer ${token}` },
      // timeout 지정 안 함 (요청하신 대로 시간초 제거)
    });

    console.log('✅ 일정 삭제 성공:', response.data);
    return response.data ?? { success: true };
  } catch (error) {
    // 4) 디테일 로그 (상태/메시지/서버 바디)
    const status = error?.response?.status;
    const data = error?.response?.data;
    const message = error?.message;
    console.error('❌ 일정 삭제 실패:', { status, data, message, url, scheduleId });

    // 서버가 에러 메시지를 내려주면 그걸 표면화
    const serverMsg =
      typeof data === 'string'
        ? data
        : data?.message || data?.error || message || '삭제 중 오류가 발생했습니다.';

    const err = new Error(serverMsg);
    err.status = status;
    throw err;
  }
}
