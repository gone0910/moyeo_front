import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경
import api from './AxiosInstance';

/**
 * 플랜(여행 일정) 리스트 조회 API
 * GET /schedule/list
 * @returns {Promise<Array>} 플랜 리스트 배열 반환
 */
export const fetchPlanList = async () => {
  try {
    // [REMOVED] 수동 토큰 조회 및 Authorization 부착 (전부 인터셉터가 처리)
    // const token = await AsyncStorage.getItem('jwt');
    // if (!token) throw new Error('JWT 토큰이 없습니다. 로그인이 필요합니다.');

    // [UPDATED] 전역 api 인스턴스로 호출 → 401이면 AxiosInstance에서 자동 재발급 후 재시도
    const response = await api.get('/schedule/list');

    if (response.status === 200) {
      console.log('✅ 플랜 리스트 조회 성공:', response.data);
      return response.data;
    } else {
      console.warn('⚠️ 플랜 리스트 조회 실패:', response.status);
      return [];
    }
  } catch (error) {
    console.error('❌ 플랜 리스트 조회 예외:', error.response?.data || error.message);
    return [];
  }
};

