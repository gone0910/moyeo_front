import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경

/**
 * 🗑️ 일정 삭제 요청 함수
 * @param {string|number} scheduleId - 삭제할 일정의 ID
 * @returns {Promise<Object>} 서버 응답 데이터
 */
export async function deleteSchedule(scheduleId) {
  try {
    const token = await AsyncStorage.getItem('jwt');
    if (!token) throw new Error('JWT 토큰이 없습니다');
    const response = await axios.delete(
      `${BASE_URL}/schedule/delete/${scheduleId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }
    );
    console.log('✅ 일정 삭제 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 일정 삭제 실패:', error.response?.data || error.message);
    throw error;
  }
}
