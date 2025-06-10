import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 💾 일정 저장 요청 함수
 */
export async function saveSchedule(request) {
  try {
    const token = await AsyncStorage.getItem('jwt');
    if (!token) throw new Error('JWT 토큰이 없습니다');
    const response = await axios.post(
      'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080/schedule/save',
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
