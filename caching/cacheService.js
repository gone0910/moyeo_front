import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_KEYS = {
  PLAN_INITIAL: 'plan_initial',       // 플랜 생성 직후
  PLAN_EDITED: 'plan_edited',         // 장소 추가/수정 후
  PLAN_DETAIL: 'plan_detail',         // 상세보기 진입 시
  PLAN_SAVE_READY: 'plan_save_ready', // DB 저장 직전
  PLAN_REQUEST: 'PLAN_REQUEST',
};

// ✅ 저장
export const saveCacheData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    // console.log(`✅ 캐시 저장 완료: ${key}`);
  } catch (e) {
    console.warn('❌ 캐싱 저장 오류:', e);
  }
};

// ✅ 불러오기
export const getCacheData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (!jsonValue) return null;
    return JSON.parse(jsonValue);
  } catch (e) {
    console.warn('❌ 캐싱 불러오기 오류:', e);
    return null;
  }
};

// ✅ 삭제
export const removeCacheData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    // console.log(`🗑️ 캐시 삭제 완료: ${key}`);
  } catch (e) {
    console.warn('❌ 캐싱 삭제 오류:', e);
  }
};

// ✅ 전체 캐시 초기화 
export const clearAllCache = async () => {
  try {
    await Promise.all(
      Object.values(CACHE_KEYS).map((key) => AsyncStorage.removeItem(key))
    );
    // console.log('🧹 모든 캐시 삭제 완료');
  } catch (e) {
    console.warn('❌ 전체 캐시 삭제 오류:', e);
  }
};
