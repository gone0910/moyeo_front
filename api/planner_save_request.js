import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경


/**
 * 💾 일정 저장 요청 함수
 */
export async function saveSchedule(request) {
  try {
    const token = await AsyncStorage.getItem('jwt');
    if (!token) throw new Error('JWT 토큰이 없습니다');
    const response = await axios.post(
      `${BASE_URL}/schedule/save`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      }
    );
    console.log('✅ 일정 저장 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 일정 저장 실패:', error.response?.data || error.message);
    throw error;
  }
}
