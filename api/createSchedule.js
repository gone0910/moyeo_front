// 🔁 createSchedule.js (mock 버전)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// 👉 실제 axios 요청 대신 mock 응답
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
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.warn('❌ 토큰 없음');
      return;
    }

    const requestData = {
      startDate,
      endDate,
      destination: destination[0], // 첫 번째 목적지만 사용
      mbti,
      travelStyle: travelStyle[0],
      peopleGroup,
      budget,
    };

    console.log('📤 Mock 요청 데이터:', requestData);

    // ✅ 여기가 실제 서버 대신 mock 응답
    const response = {
      status: 200,
      data: {
        message: 'Mock 일정 생성 성공!',
        scheduleId: 9999,
      },
    };

    if (response.status === 200) {
      console.log('✅ Mock 일정 생성 성공:', response.data);
      Alert.alert('성공', `일정 생성 성공!\nID: ${response.data.scheduleId}`);
      return response.data;
    } else {
      console.warn('⚠️ 실패 응답:', response.status);
      Alert.alert('실패', '일정 생성 실패');
    }
  } catch (error) {
    console.error('❌ 예외 발생:', error.message);
    Alert.alert('오류', '예외가 발생했습니다.');
  }
};
