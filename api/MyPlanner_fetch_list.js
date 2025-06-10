import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 플랜(여행 일정) 리스트 조회 API
 * GET /schedule/list
 * @returns {Promise<Array>} 플랜 리스트 배열 반환
 */
export const fetchPlanList = async () => {
  try {
    // JWT 토큰 가져오기 (jwt 또는 token 키로 저장된 값)
    const token = await AsyncStorage.getItem('jwt');
    if (!token) {
      throw new Error('JWT 토큰이 없습니다. 로그인이 필요합니다.');
    }

    // API 호출
    const response = await axios.get(
      'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080/schedule/list',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 성공 시 결과 반환
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

