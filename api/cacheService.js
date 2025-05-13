// 📦 cacheService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ✅ 캐싱 키 목록
 * 
 * 캐싱이 필요한 주요 시점을 구분하기 위해 사용하는 고정된 키입니다.
 * 각 키는 AsyncStorage에 저장될 항목을 구분하는 이름으로 사용됩니다.
 */
export const CACHE_KEYS = {
  PLAN_INITIAL: 'plan_initial',       // 플랜 생성 직후 생성된 일정 정보
  PLAN_EDITED: 'plan_edited',         // 사용자가 장소를 추가/수정한 이후의 데이터
  PLAN_DETAIL: 'plan_detail',         // 상세보기 진입 시 사용하는 데이터
  PLAN_SAVE_READY: 'plan_save_ready', // 최종적으로 DB에 저장하기 직전의 데이터
};

/**
 * 🔐 데이터 저장 함수
 *
 * 주어진 키에 대해 데이터를 AsyncStorage에 JSON 문자열로 변환하여 저장합니다.
 *
 * @param {string} key - 저장할 항목의 키 (CACHE_KEYS 중 하나를 권장)
 * @param {any} value - 저장할 데이터 (객체 또는 문자열 등)
 */
export const saveCacheData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value); // 객체를 문자열로 직렬화
    await AsyncStorage.setItem(key, jsonValue); // 저장
    console.log(`✅ [${key}] 데이터 캐싱 완료`);
  } catch (e) {
    console.error(`❌ [${key}] 캐싱 실패:`, e);
  }
};

/**
 * 📥 데이터 불러오기 함수
 *
 * 주어진 키에 해당하는 값을 AsyncStorage에서 불러와 JSON으로 파싱합니다.
 *
 * @param {string} key - 불러올 데이터의 키
 * @returns {any|null} - 저장된 데이터 객체 (없으면 null 반환)
 */
export const getCacheData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key); // 문자열 조회
    return jsonValue ? JSON.parse(jsonValue) : null;   // 존재하면 JSON 파싱
  } catch (e) {
    console.error(`❌ [${key}] 불러오기 실패:`, e);
    return null;
  }
};

/**
 * 🗑️ 데이터 삭제 함수
 *
 * 주어진 키에 해당하는 데이터를 AsyncStorage에서 제거합니다.
 *
 * @param {string} key - 삭제할 데이터의 키
 */
export const removeCacheData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`🗑️ [${key}] 캐시 삭제 완료`);
  } catch (e) {
    console.error(`❌ [${key}] 삭제 실패:`, e);
  }
};
