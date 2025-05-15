import { createSchedule } from './createSchedule';

// 🔄 axios 인스턴스를 직접 덮어쓰기 (mock response)
import axiosInstance from './axiosInstance';

axiosInstance.post = async (url, data, config) => {
  console.log('📌 Mock axios 호출됨:', url);
  return {
    status: 200,
    data: {
      message: 'Mock 일정 생성 완료',
      scheduleId: 12345,
    },
  };
};

// 📦 토큰도 강제로 설정
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.setItem('token', 'mock-token');

// 🧪 테스트 실행
createSchedule(
  '2024-06-01',
  '2024-06-03',
  ['JEJU'],
  'ENFP',
  ['NATURE'],
  'DUO',
  200000
);
