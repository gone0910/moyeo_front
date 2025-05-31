import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      `http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080/schedule/delete/${scheduleId}`,
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
