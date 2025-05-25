import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 📝 일정 편집(수정) 요청 함수
 * 
 * @param {Array<string>} names - 새로 반영할 장소 이름 목록
 * @returns {Promise<Object>} - 서버 응답 데이터
 */
export async function editSchedule(names) {
  try {
    // JWT 토큰 가져오기
    const token = await AsyncStorage.getItem('jwt');
    if (!token) {
      throw new Error('JWT 토큰이 없습니다. 로그인이 필요합니다.');
    }

    // 요청 본문 및 헤더
    const requestBody = { names };
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    // 실제 API 엔드포인트로 POST 요청 (baseURL 필요 시 수정)
    const response = await axios.post(
      'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080/schedule/edit', // 실제 서버 주소
      requestBody,
      { headers }
    );

    // 결과 반환
    console.log('✏️ 일정 편집 성공:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ 일정 편집 실패:', error.response?.data || error.message);
    throw error;
  }
}

// ✅ 사용 예시
// (수정할 장소 이름들을 배열로 전달)
editSchedule([
  "한라산",
  "성산일출봉",
  "천지연폭포",
  "제주도립미술관"
]);
