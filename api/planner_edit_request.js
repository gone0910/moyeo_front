// 📁 api/planner_edit_request.js
// (파일 상단부 import들 아래에 붙이세요)
import AsyncStorage from '@react-native-async-storage/async-storage';

// 단일 키로 scheduleId만 보관 (다른 캐시 유틸 변경 없이 로컬에서 해결)
export const SCHEDULE_ID_KEY = 'schedule_id';

/** 생성/재저장 등으로 얻은 scheduleId를 캐시 */
export async function cacheScheduleId(id) {
  try {
    if (Number.isFinite(id)) {
      await AsyncStorage.setItem(SCHEDULE_ID_KEY, String(id));
      return id;
    }
    return null;
  } catch (e) {
    console.warn('❌ cacheScheduleId 실패:', e);
    return null;
  }
}

/** 캐시된 scheduleId 읽기 */
export async function getCachedScheduleId() {
  try {
    const v = await AsyncStorage.getItem(SCHEDULE_ID_KEY);
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch (e) {
    console.warn('❌ getCachedScheduleId 실패:', e);
    return null;
  }
}

/** scheduleId 캐시 제거 */
export async function clearCachedScheduleId() {
  try {
    await AsyncStorage.removeItem(SCHEDULE_ID_KEY);
  } catch (e) {
    console.warn('❌ clearCachedScheduleId 실패:', e);
  }
}
