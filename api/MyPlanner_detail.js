// api/getScheduleDetail.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경

/**
 * 플랜 상세 조회 (GET)
 * @param {string|number} scheduleId - 조회할 플랜의 id
 * @returns {Promise<Object>} 서버 응답 데이터
 */
export const getScheduleDetail = async (scheduleId) => {
  try {
    const token = await AsyncStorage.getItem('jwt');
    if (!token) {
      throw new Error('JWT 토큰이 없습니다.');
    }

    const response = await axios.get(
      `${BASE_URL}/schedule/full/${scheduleId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 200) {
      console.log('✅ 플랜 상세 조회 성공:', response.data);
      return response.data;
    } else {
      console.warn('⚠️ 플랜 상세 조회 실패:', response.status);
    }
  } catch (error) {
    console.error('❌ 플랜 상세 조회 예외:', error.response?.data || error.message);
    throw error;
  }
};
