// api/fetchPlanList.js (파일명 유지 OK)
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';

/**
 * 플랜(여행 일정) 리스트 조회 API
 * GET /schedule/list
 * @returns {Promise<Array>} 플랜 리스트 배열 반환
 */
export const fetchPlanList = async () => {
  try {
    const token = await AsyncStorage.getItem('jwt');
    if (!token) throw new Error('JWT 토큰이 없습니다. 로그인이 필요합니다.');

    const url = `${BASE_URL}/schedule/list`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log('✅ 플랜 리스트 조회 성공:', response.data.length, '건');
      return response.data;
    }
    console.warn('⚠️ 플랜 리스트 조회 비정상 응답:', response.status, response.data);
    return [];
  } catch (error) {
    console.error('❌ 플랜 리스트 조회 오류:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    return [];
  }
};
