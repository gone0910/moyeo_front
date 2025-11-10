// 📁 /caching/cacheService.js
// - AsyncStorage 기반 캐시 유틸 통합
// - 드래프트 시작/정리, 단건 저장, 리스트 무효화
// - 저장 후 리스트 반영(upsert) & 새로고침 이벤트

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

/* ==============================
 * 캐시 키
 * ============================== */
export const CACHE_KEYS = {
  PLAN_INITIAL: 'plan_initial',       // 플랜 생성 직후 스냅샷(초안)
  PLAN_EDITED: 'plan_edited',         // 편집 중 최신본
  PLAN_DETAIL: 'plan_detail',         // 상세 화면 입장 시 보관
  PLAN_SAVE_READY: 'plan_save_ready', // 서버 저장 직전(옵션)
  PLAN_REQUEST: 'PLAN_REQUEST',       // 생성 요청 스냅샷(옵션)
};

const DRAFT_ID_KEY = 'plan_draft_id';

/* ==============================
 * 공통 JSON 저장/읽기/삭제
 * ============================== */
export const saveCacheData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[cache] save error:', key, e);
  }
};

export const getCacheData = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[cache] get error:', key, e);
    return null;
  }
};

export const removeCacheData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('[cache] remove error:', key, e);
  }
};

/* ==============================
 * 리스트/홈 무효화(옵션)
 * ============================== */
export const invalidateListAndHomeCaches = async () => {
  try {
    // 실제로 사용 중인 리스트 캐시 키가 있으면 여기서 삭제
    // 예: await AsyncStorage.removeItem('PLAN_LIST_CACHE');
    // 예: await AsyncStorage.removeItem('HOME_LIST_CACHE');
  } catch (e) {
    console.warn('[cache] invalidate error:', e);
  }
};

/* ==============================
 * 드래프트 세션 제어
 * ============================== */
/** 새 드래프트 시작: 과거 흔적 정리 → 이번 생성 결과로 초기화 */
export const beginNewDraft = async (initialData) => {
  try {
    await clearDraftCaches();                     // 과거 드래프트 흔적 제거
    await removeCacheData(CACHE_KEYS.PLAN_DETAIL); // 혹시 남은 상세 캐시 제거

    const draftId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await AsyncStorage.setItem(DRAFT_ID_KEY, draftId);

    await saveCacheData(CACHE_KEYS.PLAN_INITIAL, initialData);
    await saveCacheData(CACHE_KEYS.PLAN_EDITED, initialData);
  } catch (e) {
    console.warn('[draft] begin error:', e);
  }
};

/** 편집 시 최신본 쓰기 */
export const writeEditedDraft = async (nextData) => {
  await saveCacheData(CACHE_KEYS.PLAN_EDITED, nextData);
};

/** 초기 스냅샷 1회만 */
export const snapshotInitialOnce = async (data) => {
  const has = await getCacheData(CACHE_KEYS.PLAN_INITIAL);
  if (!has) await saveCacheData(CACHE_KEYS.PLAN_INITIAL, data);
};

/** 저장 직전 스냅샷(옵션) */
export const snapshotSaveReady = async (data) => {
  await saveCacheData(CACHE_KEYS.PLAN_SAVE_READY, data);
};

/* ==============================
 * 🔔 화면 새로고침 이벤트
 * ============================== */
/** Home/MyTrips 등에서 수신: DeviceEventEmitter.addListener('TRIPS_UPDATED', ...) */
export const emitTripsUpdated = (emitter = DeviceEventEmitter, payload = {}) => {
  try {
    emitter.emit('TRIPS_UPDATED', { at: Date.now(), ...payload });
  } catch (e) {
    console.warn('[event] emit error:', e);
  }
};

/* ==============================
 * 💾 저장 후 리스트 반영(upsert)
 * ============================== */
const keyOf = (obj) => {
  const raw = obj?.serverId ?? obj?.scheduleId ?? obj?.scheduleNo ?? obj?.id;
  return raw == null ? null : String(raw).trim();
};

/** 서버 저장/재저장 성공 후, MY_TRIPS에 upsert(교체 or 추가) */
export async function upsertMyTrip(savedItem) {
  try {
    // 1) id 키 결정
    const rawId =
      savedItem?.serverId ??
      savedItem?.scheduleId ??
      savedItem?.scheduleNo ??
      savedItem?.id;
    if (rawId == null) return;

    const idNum = Number(rawId);
    const idStr = String(rawId).trim();

    // 2) 화면/클램프 기준으로 쓸 "완전한 스냅샷" 형태로 정리
    const shaped = {
      // 기본 필수
      id: idNum,
      title: savedItem?.title ?? '',
      startDate: savedItem?.startDate ?? '',
      endDate: savedItem?.endDate ?? '',
      totalEstimatedCost: savedItem?.totalEstimatedCost ?? 0,

      // ✅ 가장 중요: days 전체를 반드시 포함
      days: Array.isArray(savedItem?.days) ? savedItem.days.map((d, di) => {
        const places = Array.isArray(d?.places) ? d.places.map((p, pi) => ({
          ...p,
          // placeOrder가 없으면 만들어서 저장 (서버 재정렬 트리거 방지)
          placeOrder: Number(p?.placeOrder) || (pi + 1),
        })) : [];
        return {
          day: d?.day ?? `${di + 1}일차`,
          date: d?.date ?? savedItem?.startDate ?? '',
          totalEstimatedCost: d?.totalEstimatedCost ?? places.reduce((acc, x) => acc + (Number(x?.estimatedCost) || 0), 0),
          places,
        };
      }) : [],

      // (옵션) meta가 있으면 병합
      ...(savedItem?.meta || {}),
    };

    // 3) 기존 목록에 upsert
    const raw = await AsyncStorage.getItem('MY_TRIPS');
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? [...list] : [];

    const idx = next.findIndex(it => {
      const k =
        it?.serverId ?? it?.scheduleId ?? it?.scheduleNo ?? it?.id;
      return String(k).trim() === idStr;
    });

    if (idx >= 0) {
      // 기존 항목에 days 포함 전체 스냅샷을 덮어쓴다
      next[idx] = { ...next[idx], ...shaped };
    } else {
      // 새로 추가
      next.unshift(shaped);
    }

    await AsyncStorage.setItem('MY_TRIPS', JSON.stringify(next));
  } catch (e) {
    console.warn('[mytrips] upsert error:', e);
  }
}

/* ==============================
 * 🧹 저장 후 불필요 캐시 정리(강화판)
 * ============================== */
export async function clearDraftCaches() {
  try {
    await removeCacheData(CACHE_KEYS.PLAN_EDITED);
    await removeCacheData(CACHE_KEYS.PLAN_INITIAL);
    await removeCacheData(CACHE_KEYS.PLAN_SAVE_READY);
    await removeCacheData(CACHE_KEYS.PLAN_DETAIL);       // 상세 캐시도 함께 제거
    await AsyncStorage.removeItem(DRAFT_ID_KEY);         // 드래프트 세션 ID 제거
  } catch (e) {
    console.warn('[draft] clear error:', e);
  }
}
