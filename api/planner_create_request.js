import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    console.log('🔑 토큰값:', token);
    if (!token) {
      console.warn('❌ 토큰 없음');
      return;
    }

    const requestData = {
      startDate,
      endDate,
      destination: destination[0],
      mbti,
      travelStyle,
      peopleGroup,
      budget,
    };

    console.log('📤 실제 요청 데이터:', requestData);

    const response = await axios.post(
      'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080/schedule/create',
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
      return response.data;
    } else {
      console.warn('⚠️ 경고 응답:', response.status);
    }
  } catch (error) {
    console.error('❌ 예외 발생:', error.response?.data || error.message);
  }
};
