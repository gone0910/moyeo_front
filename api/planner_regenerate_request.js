import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const regenerateSchedule = async ({
  startDate,
  endDate,
  destination,
  mbti,
  travelStyle,
  peopleGroup,
  budget,
  excludedNames = []
}) => {
  try {
    const token = await AsyncStorage.getItem('jwt');
    if (!token) {
      throw new Error('JWT 토큰이 없습니다.');
    }

    const requestBody = {
      request: {
        startDate,
        endDate,
        destination,
        mbti,
        travelStyle,
        peopleGroup,
        budget
      },
      excludedNames
    };

    const response = await axios.post(
      'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080/schedule/recreate', // 엔드포인트 수정!
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.status === 200) {
      console.log('✅ 일정 재생성 성공:', response.data);
      // 필요시 Alert로도
      // Alert.alert('성공', '일정이 재생성되었습니다!');
    } else {
      console.warn('⚠️ 일정 재생성: 정상 응답이 아니거나 데이터 없음');
    }

    return response.data;
  } catch (err) {
    console.error('❌ 일정 재생성 실패:', err.response?.data || err.message);
    // 필요시 Alert.alert('오류', '일정 재생성에 실패했습니다.');
    throw err;
  }
};
