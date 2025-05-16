import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

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
      destination: destination[0],
      mbti,
      travelStyle: travelStyle[0],
      peopleGroup,
      budget,
    };

    console.log('📤 실제 요청 데이터:', requestData);

    const response = await axios.post(
      'https://your-api-server.com/gpt/schedule/detail/create',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      console.log('✅ 실제 서버 응답:', response.data);
      Alert.alert('성공', '일정 생성이 완료되었습니다!');
      return response.data;
    } else {
      console.warn('⚠️ 실패 응답:', response.status);
      Alert.alert('실패', '일정 생성 실패');
    }
  } catch (error) {
    console.error('❌ 예외 발생:', error.response?.data || error.message);
    Alert.alert('오류', '서버 요청 중 문제가 발생했습니다.');
  }
};
