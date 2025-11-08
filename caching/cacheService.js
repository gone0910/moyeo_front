import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_KEYS = {
  PLAN_INITIAL: 'plan_initial',       // 플랜 생성 직후
  PLAN_EDITED: 'plan_edited',         // 장소 추가/수정 후(저장 전 편집본)
  PLAN_DETAIL: 'plan_detail',         // 상세보기 진입 시(서버 기준)
  PLAN_SAVE_READY: 'plan_save_ready', // DB 저장 직전 스냅샷(옵션)
  PLAN_REQUEST: 'PLAN_REQUEST',       // 생성/편집 요청 바디 보관(옵션)
};

// ---------- 기본 CRUD ----------
export const saveCacheData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('❌ 캐싱 저장 오류:', e);
  }
};

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

export const removeCacheData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('❌ 캐싱 삭제 오류:', e);
  }
};

export const clearAllCache = async () => {
  try {
    await Promise.all(
      Object.values(CACHE_KEYS).map((key) => AsyncStorage.removeItem(key))
    );
  } catch (e) {
    console.warn('❌ 전체 캐시 삭제 오류:', e);
  }
};

// ---------- 플랜 편집용 캐시 헬퍼 ----------
export const snapshotInitialOnce = async (initialData) => {
  const exists = await getCacheData(CACHE_KEYS.PLAN_INITIAL);
  if (!exists) {
    await saveCacheData(CACHE_KEYS.PLAN_INITIAL, initialData);
  }
};

export const loadWorkingDraft = async () => {
  const edited = await getCacheData(CACHE_KEYS.PLAN_EDITED);
  if (edited) return edited;
  const initial = await getCacheData(CACHE_KEYS.PLAN_INITIAL);
  return initial ?? null;
};

export const writeEditedDraft = async (nextData) => {
  await saveCacheData(CACHE_KEYS.PLAN_EDITED, nextData);
  return nextData;
};

export const snapshotSaveReady = async (data) => {
  await saveCacheData(CACHE_KEYS.PLAN_SAVE_READY, data);
};

export const clearDraftCaches = async () => {
  await removeCacheData(CACHE_KEYS.PLAN_EDITED);
  await removeCacheData(CACHE_KEYS.PLAN_INITIAL);
  await removeCacheData(CACHE_KEYS.PLAN_SAVE_READY);
};

// 장소 추가
export const addPlace = async (dayIndex, newPlace) => {
  const base = await loadWorkingDraft();
  if (!base) return null;

  const next = {
    ...base,
    days: (base.days ?? []).map((d, i) => {
      if (i !== dayIndex) return d;
      const places = Array.isArray(d.places) ? d.places.slice() : [];
      const placeOrder = places.length + 1;
      places.push({ ...newPlace, placeOrder });
      return { ...d, places };
    }),
  };
  return writeEditedDraft(next);
};

// 장소 수정
export const updatePlace = async (dayIndex, placeIndex, patch) => {
  const base = await loadWorkingDraft();
  if (!base) return null;

  const next = {
    ...base,
    days: (base.days ?? []).map((d, i) => {
      if (i !== dayIndex) return d;
      const places = Array.isArray(d.places) ? d.places.slice() : [];
      if (!places[placeIndex]) return d;
      places[placeIndex] = { ...places[placeIndex], ...patch };
      return { ...d, places };
    }),
  };
  return writeEditedDraft(next);
};

// 장소 삭제
export const removePlace = async (dayIndex, placeIndex) => {
  const base = await loadWorkingDraft();
  if (!base) return null;

  const next = {
    ...base,
    days: (base.days ?? []).map((d, i) => {
      if (i !== dayIndex) return d;
      const places = Array.isArray(d.places) ? d.places.slice() : [];
      if (!places[placeIndex]) return d;
      places.splice(placeIndex, 1);
      const re = places.map((p, idx) => ({ ...p, placeOrder: idx + 1 }));
      return { ...d, places: re };
    }),
  };
  return writeEditedDraft(next);
};

// ===== 드래프트 세션 관리 (중복 노출 방지) =====
const DRAFT_ID_KEY = 'plan_draft_id';

export const beginNewDraft = async (initialData) => {
  try {
    await clearDraftCaches();
    await removeCacheData(CACHE_KEYS.PLAN_DETAIL);
    const draftId = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    await AsyncStorage.setItem(DRAFT_ID_KEY, draftId);
    await saveCacheData(CACHE_KEYS.PLAN_INITIAL, initialData);
    await saveCacheData(CACHE_KEYS.PLAN_EDITED, initialData);
    return draftId;
  } catch (e) {
    console.warn('❌ beginNewDraft 실패:', e);
    return null;
  }
};

export const getCurrentDraftId = async () => {
  try {
    return await AsyncStorage.getItem(DRAFT_ID_KEY);
  } catch (e) {
    console.warn('❌ getCurrentDraftId 실패:', e);
    return null;
  }
};
// ====== 리스트/홈 캐시 키 ======
export const EXTRA_CACHE_KEYS = {
  PLAN_LIST: 'PLAN_LIST_CACHE',     // (프로젝트에서 리스트 캐시 키로 쓰는 이름으로 바꿔도 됨)
  HOME_NEAREST: 'HOME_NEAREST_TRIP' // (홈 카드 캐시 키)
};

// 리스트/홈 캐시 일괄 무효화
export const invalidateListAndHomeCaches = async () => {
  try {
    await AsyncStorage.multiRemove([
      EXTRA_CACHE_KEYS.PLAN_LIST,
      EXTRA_CACHE_KEYS.HOME_NEAREST,
    ]);
  } catch (e) {
    console.warn('❌ 리스트/홈 캐시 무효화 오류:', e);
  }
};


// (선택) 이벤트 발행 헬퍼
export const emitTripsUpdated = (DeviceEventEmitter, payload = {}) => {
  try {
    DeviceEventEmitter?.emit?.(TRIPS_UPDATED_EVENT, payload);
  } catch (e) {
    // RN이 아니면 무시
  }
};

// 편집본/조회본 비교용 시그니처 (덮어쓰기 가드)
export const signatureOf = (obj) => {
  try {
    const days = (obj?.days ?? []).map(d => ({
      date: d.date,
      places: (d.places ?? []).map(p => ({
        name: p?.name ?? '',
        type: p?.type ?? '',
        estimatedCost: p?.estimatedCost ?? null,
        placeOrder: p?.placeOrder ?? null,
      })),
    }));
    return JSON.stringify(days);
  } catch {
    return '';
  }
};
