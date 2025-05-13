import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * 📦 여행 일정 생성 요청 함수 (리팩토링 + 토큰 없음 시 Alert 제거)
 *
 * @param {string} startDate - 출발일 (예: "2024-06-01")
 * @param {string} endDate - 도착일 (예: "2024-06-03")
 * @param {string[]} destination - 도/시 단위 목적지 리스트 (예: ["SEOUL", "JEJU"])
 * @param {string} mbti - 사용자의 MBTI (예: "ENFP")
 * @param {string[]} travelStyle - 여행 스타일 리스트 (예: ["ACTIVITY", "NATURE"])
 * @param {string} peopleGroup - 인원 수 그룹 ("ALONE", "DUO", "GROUP")
 * @param {number} budget - 예산 (단위: 원)
 */
export const createSchedule = async (
  startDate,
  endDate,
  destination,
  mbti,
  travelStyle,
  peopleGroup,
  budget
) => {
  try {
    // ✅ 1. 날짜 필수 검사
    if (!startDate || !endDate) {
      console.warn("❌ 출발일과 도착일은 필수입니다.");
      return;
    }

    // ✅ 2. 토큰 확인
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.warn("❌ 토큰 없음 - 요청 중단");
      return;
    }

    // ✅ 3. 데이터 정제
    const cleanDestination = destination && destination.length > 0
      ? [...new Set(destination.map((d) => d.toUpperCase()))]
      : ['NONE'];

    const cleanMbti = !mbti || mbti === '선택안함' ? 'NONE' : mbti.toUpperCase();

    const cleanTravelStyle = travelStyle && travelStyle.length > 0 && travelStyle[0] !== 'NONE'
      ? travelStyle.map((s) => s.toUpperCase())
      : ['NONE'];

    const cleanPeopleGroup = !peopleGroup || peopleGroup === '선택안함'
      ? 'NONE'
      : peopleGroup.toUpperCase();

    const cleanBudget = budget || 0;

    // ✅ 4. 요청 데이터
    const requestData = {
      startDate,
      endDate,
      destination: cleanDestination,
      mbti: cleanMbti,
      travelStyle: cleanTravelStyle,
      peopleGroup: cleanPeopleGroup,
      budget: cleanBudget,
    };

    console.log('📤 요청 데이터:', requestData);

    // ✅ 5. 헤더 및 URL
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const apiUrl = 'https://your-api-server.com/gpt/schedule/detail/create';

    // ✅ 6. 요청 전송
    const response = await axios.post(apiUrl, requestData, { headers });

    // ✅ 7. 응답 처리
    if (response.status === 200) {
      console.log('✅ 일정 생성 성공:', response.data);
      Alert.alert('성공', '여행 일정이 성공적으로 생성되었습니다!');
      return response.data;
    } else {
      console.warn('⚠️ 일정 생성 실패:', response.status, response.data);
      Alert.alert('실패', '일정 생성에 실패했습니다. 다시 시도해 주세요.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.response?.data || error.message);
    Alert.alert('오류', '일정 생성 중 문제가 발생했습니다.');
  }
};
