// 📁 utils/mockMode.js
import AsyncStorage from '@react-native-async-storage/async-storage';

/** 테스트 계정인 mock.
 * mock 모드 여부를 판단하는 헬퍼 함수
 * @returns {Promise<boolean>} true면 mock 상태
 */
export const isMockMode = async () => {
  const flag = await AsyncStorage.getItem('mock');
  const isMock = flag === 'true';
  if (isMock) console.log('🧪 [MockMode] 현재 mock 상태로 앱이 작동 중입니다.');
  return isMock;
};
