// 📄 components/planner/PlannerResponseHome.jsx
// 로컬 편집 보존 + 캐시 기반 저장 + /schedule/resave/{id} 반영 버전
// - 편집 중 추가/삭제/수정은 전부 PLAN_EDITED에 저장
// - '플랜 수정 완료' 시 캐시 최신본을 화면에 확정 반영하고, 숫자 id가 있으면 resave 호출
// - '내 여행으로 저장'은 PLAN_EDITED(또는 working draft) 최신본을 사용하여 저장
// - 저장/재조회 직후에 이전 스냅샷으로 덮어쓰지 않도록 버전/시그니처 가드

import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  UIManager,
  findNodeHandle,
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===== API =====
import { getScheduleDetail } from '../../api/MyPlanner_detail';
import { regenerateSchedule } from '../../api/planner_regenerate_request';
import { saveSchedule } from '../../api/planner_save_request';
import { deleteSchedule } from '../../api/planner_delete_request';
import { resaveSchedule } from '../../api/planner_resave_request';
import { editSchedule, cacheScheduleId } from '../../api/planner_edit_request';

// ===== cache helpers =====
import {
  CACHE_KEYS,
  getCacheData,
  saveCacheData,
  loadWorkingDraft,
  writeEditedDraft,
  snapshotInitialOnce,
  clearDraftCaches,
  invalidateListAndHomeCaches, 
  emitTripsUpdated, 
  TRIPS_UPDATED_EVENT,
  removeCacheData
} from '../../caching/cacheService';

import SplashScreen from '../../components/common/SplashScreen';
import { MAIN_TAB_ID, defaultTabBarStyle } from '../../navigation/BottomTabNavigator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
}

// =====================
// helpers
// =====================

// 원본 day에서 이름 리스트 (원본 순서 그대로)
function namesFromOriginalDay(day) {
  if (!day?.places) return [];
  return day.places.map(p => String(p?.name ?? '').trim()).filter(Boolean);
}

// 편집본 day에서 이름 리스트 (현재 화면 배열 순서 그대로)
function namesFromMergedDay(day) {
  if (!day?.places) return [];
  return day.places.map(p => String(p?.name ?? '').trim()).filter(Boolean);
}

/**
 * 최종 names 생성 규칙:
 *  - base: 원본(original) 이름 배열(순서 유지)
 *  - merged에만 존재하는 신규 이름들은 merged에서의 index 자리에 '끼워 넣기'
 *  - 결과적으로: 원본 순서는 그대로, 새 항목만 해당 위치에 삽입
 */
function composeNamesPreservingOriginalOrder(mergedDay, originalDay) {
  const origNames   = namesFromOriginalDay(originalDay); // base
  const mergedNames = namesFromMergedDay(mergedDay);

  // 빠른 비교를 위해 집합 구성
  const origSet = new Set(origNames);

  // 신규 항목(= 원본에 없고, merged에는 있는 이름들)만 추출 [이름, 위치]
  const mergedOnly = [];
  (mergedDay?.places || []).forEach((p, idx) => {
    const nm = String(p?.name ?? '').trim();
    if (nm && !origSet.has(nm)) mergedOnly.push({ name: nm, index: idx });
  });

  // 결과 배열: 원본을 기준으로 시작
  const result = [...origNames];

  // 신규를 '현재 화면상의 index' 기준으로 삽입.
  // 원본엔 그 index가 없으니, result의 해당 index 위치에 맞춰 splice.
  // 단, 원본 길이보다 큰 index면 맨 뒤에 붙임.
  mergedOnly.sort((a, b) => a.index - b.index).forEach(({ name, index }, k) => {
    const pos = Math.min(index, result.length);
    result.splice(pos, 0, name);
  });

  return result;
}

/** 이 날이 서버 보강(edit)이 필요한지 판단 */
function shouldEnrichDay(day) {
  if (!day?.places) return false;
  return day.places.some(p => !p?.type || !p?.gptOriginalName || !p?.fromPrevious);
}

// 편집본 day에서 이름 리스트(정렬 포함)
function namesFromDay(day) {
  if (!day?.places) return [];
  const arr = [...day.places].sort((a,b) => {
    const ao = Number.isFinite(a?.placeOrder) ? a.placeOrder : Number.MAX_SAFE_INTEGER;
    const bo = Number.isFinite(b?.placeOrder) ? b.placeOrder : Number.MAX_SAFE_INTEGER;
    return ao - bo;
  });
  return arr.map(p => String(p?.name ?? '').trim()).filter(Boolean);
}

// merged(현재 편집본) 기준으로 만들되, 만약 길이가 이상하면 original에서 누락분 보충
function composeFullNamesForEdit(mergedDay, originalDay) {
  const merged = namesFromDay(mergedDay);
  const orig   = namesFromDay(originalDay);

  // 정상이라면 merged가 이미 전체여야 함
  if (merged.length >= orig.length) return merged;

  // 누락 보충: merged에 없는 original 이름을 뒤에 붙임(순서 유지)
  const set = new Set(merged);
  const filled = [...merged];
  for (const n of orig) if (!set.has(n)) filled.push(n);

  return filled;
}

function applyEditResultToState(draft, dayIndex, apiDay) {
  if (!draft?.days?.[dayIndex]) return draft;

  const prevPlaces = draft.days[dayIndex].places || [];
  const srcPlaces  = apiDay?.places || [];
  const num = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

  const mapped = prevPlaces.map((p, i) => {
    const s = srcPlaces[i] || {};
    return {
      ...p,
      type: s.type ?? p.type ?? '',
      estimatedCost: num(s.estimatedCost, num(p.estimatedCost, 0)),
      gptOriginalName: String((s.hashtag ?? s.gptOriginalName ?? p.gptOriginalName ?? ''))
        .replace(/#/g, ' ')
        .trim(),
      fromPrevious: {
        car:             num(s.driveTime,       num(p?.fromPrevious?.car, 0)),
        publicTransport: num(s.transitTime,     num(p?.fromPrevious?.publicTransport, 0)),
        walk:            num(s.walkTime,        num(p?.fromPrevious?.walk, 0)),
      },
      lat: typeof s.lat === 'number' ? s.lat : p.lat,
      lng: typeof s.lng === 'number' ? s.lng : p.lng,
    };
  });

  const totalEstimatedCost = mapped.reduce((acc, x) => acc + (Number(x.estimatedCost) || 0), 0);
  draft.days[dayIndex] = { ...draft.days[dayIndex], places: mapped, totalEstimatedCost };
  return draft;
}


const normalizeHashtags = (val) => {
  if (!val) return '';
  if (Array.isArray(val)) val = val.join(' ');
  return Array.from(
    new Set(
      String(val)
        .replace(/#/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
    )
  ).join(' ');
};

const extractNumericScheduleId = (obj) => {
  if (!obj) return null;
  const candidates = [
    obj.scheduleId, obj.schedule_id,
    obj.scheduleNo, obj.schedule_no,
    obj.scheduleIdx, obj.schedule_idx,
    obj.serverId,   obj.server_id,
    obj.serverNo,   obj.server_no,
    obj.id,
  ];
  for (const v of candidates) {
    const s = String(v ?? '').match(/\d+/)?.[0];
    if (s && /^[0-9]+$/.test(s)) return Number(s);
  }
  return null;
};
const coerceNumericScheduleId = (raw) => {
  const toNum = (s) => {
    if (typeof s === 'number') return s;
    if (typeof s === 'string') {
      const n = Number(s.match(/\d+/)?.[0]);
      return Number.isFinite(n) ? n : NaN;
    }
    if (typeof s === 'object' && s) return extractNumericScheduleId(s);
    return NaN;
  };
  const n = toNum(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const isValidId = (n) => Number.isFinite(n) && n > 0;

// ===== 재저장 payload =====
function buildResaveDaysPayload(fromData) {
  if (!fromData?.days?.length) return { days: [] };

  const timeOrUndef = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return undefined;
    return Math.round(n); // -1 허용
  };

  const nonNegCost = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n);
  };

  

  const distKm = (a, b) => {
    if (!a || !b) return 0;
    const [lat1, lon1] = a, [lat2, lon2] = b;
    if (![lat1, lon1, lat2, lon2].every(x => typeof x === 'number')) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;
    const s1 = Math.sin(dLat/2)**2 +
      Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
      (Math.sin(dLon/2)**2);
    const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
    return R * c;
  };

  let baseCenter = null;
  outer:
  for (const day of (fromData?.days ?? [])) {
    for (const p of (day?.places ?? [])) {
      if (typeof p?.lat === 'number' && typeof p?.lng === 'number') {
        baseCenter = [p.lat, p.lng];
        break outer;
      }
    }
  }
  const OUTLIER_KM = 60;

  const days = fromData.days.map((day, i) => {
    const places = (day?.places ?? []).map(p => {
      const car  = timeOrUndef(p?.fromPrevious?.car ?? p?.driveTime);
      const bus  = timeOrUndef(p?.fromPrevious?.publicTransport ?? p?.transitTime);
      const walk = timeOrUndef(p?.fromPrevious?.walk ?? p?.walkTime);
      let lat = (typeof p?.lat === 'number') ? p.lat : undefined;
      let lng = (typeof p?.lng === 'number') ? p.lng : undefined;
      if (baseCenter && typeof lat === 'number' && typeof lng === 'number') {
        const d = distKm(baseCenter, [lat, lng]);
        if (d > OUTLIER_KM) {
          lat = undefined;
          lng = undefined;
        }
      }
      return {
        type: p?.type ?? '',
        name: (p?.name ?? '').trim(),
        hashtag: (p?.gptOriginalName ?? p?.hashtag ?? '').toString(),
        estimatedCost: nonNegCost(p?.estimatedCost),
        lat,
        lng,
        walkTime: walk,
        driveTime: car,
        transitTime: bus,
      };
    });

    const totalEstimatedCost = places.reduce((acc, x) => acc + nonNegCost(x?.estimatedCost), 0);
    const dayLabel = day?.day || `${i + 1}일차`;
    const date = day?.date || fromData?.startDate;

    return { day: dayLabel, date, totalEstimatedCost, places };
  });

  return { days };
}

// Day 객체에서 edit API용 전체 이름 배열을 만든다 (빈 이름은 제외/트림)
function buildFullNamesForEdit(day) {
  if (!day?.places) return [];
  // placeOrder가 있으면 그 순서대로, 없으면 현 배열 순서대로
  const arr = [...day.places].sort((a,b) => {
    const ao = Number.isFinite(a?.placeOrder) ? a.placeOrder : Number.MAX_SAFE_INTEGER;
    const bo = Number.isFinite(b?.placeOrder) ? b.placeOrder : Number.MAX_SAFE_INTEGER;
    return ao - bo;
  });
  return arr
    .map(p => String(p?.name ?? '').trim())
    .filter(n => n.length > 0);
}

function ensurePlaceFields(place = {}, prev = {}) {
  const name = (place.name ?? prev.name ?? '').trim();
  return {
    ...prev,
    ...place,
    name,
    type: place.type ?? prev.type ?? '',
    gptOriginalName: normalizeHashtags(place.gptOriginalName ?? prev.gptOriginalName ?? ''),
    estimatedCost: Number.isFinite(Number(place.estimatedCost))
      ? Number(place.estimatedCost)
      : (Number.isFinite(Number(prev.estimatedCost)) ? Number(prev.estimatedCost) : 0),
    fromPrevious: {
      car: Number.isFinite(Number(place?.fromPrevious?.car))
        ? Number(place.fromPrevious.car)
        : (Number.isFinite(Number(prev?.fromPrevious?.car)) ? Number(prev.fromPrevious.car) : 0),
      publicTransport: Number.isFinite(Number(place?.fromPrevious?.publicTransport))
        ? Number(place.fromPrevious.publicTransport)
        : (Number.isFinite(Number(prev?.fromPrevious?.publicTransport)) ? Number(prev.fromPrevious.publicTransport) : 0),
      walk: Number.isFinite(Number(place?.fromPrevious?.walk))
        ? Number(place.fromPrevious.walk)
        : (Number.isFinite(Number(prev?.fromPrevious?.walk)) ? Number(prev.fromPrevious.walk) : 0),
    },
  };
}

const _safePlaceForLog = (p = {}) => ({
  id: p?.id ?? null,
  name: (p?.name ?? '').trim(),
  type: p?.type ?? '',
  estimatedCost: Number.isFinite(Number(p?.estimatedCost)) ? Number(p.estimatedCost) : 0,
  gptOriginalName: (p?.gptOriginalName ?? '').toString(),
  fromPrevious: {
    car: Number.isFinite(Number(p?.fromPrevious?.car)) ? Number(p.fromPrevious.car) : 0,
    publicTransport: Number.isFinite(Number(p?.fromPrevious?.publicTransport)) ? Number(p.fromPrevious.publicTransport) : 0,
    walk: Number.isFinite(Number(p?.fromPrevious?.walk)) ? Number(p.fromPrevious.walk) : 0,
  },
});


function mergeAndCleanDraft(base, editedNameOverlays = {}) {
  if (!base?.days?.length) return base;
  const next = JSON.parse(JSON.stringify(base));
  next.days = next.days.map((d) => {
    const places = (d.places ?? [])
      .map((p) => {
        const name = (editedNameOverlays[p.id] ?? p.name ?? '').trim();
        if (!name) return null; // ✅ 빈 카드 제거
        return {
          ...p,
          name,
          gptOriginalName: (p.gptOriginalName ?? '').toString().replace(/#/g, ' ').trim(),
        };
      })
      .filter(Boolean)
      .map((p, idx) => ({ ...p, placeOrder: idx + 1 })); // ✅ 순서 재부여
    return { ...d, places };
  });
  return next;
}


// =====================
// Component
// =====================
export default function PlannerResponseHome() {
  const navigation = useNavigation();
  const route = useRoute?.() || { params: {} };
  const params = route?.params ?? {};
  const { from = 'mock', mode = 'draft', scheduleId, mock } = params;
  const isMock = mock === true;

  // UI state
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const initialEditing = route.params?.mode === 'edit';
  const [isEditing, setIsEditing] = useState(!!initialEditing);
  const [newlyAddedPlaceId, setNewlyAddedPlaceId] = useState(null);
  const [editedPlaces, setEditedPlaces] = useState({});
  const [editedPlaceId, setEditedPlaceId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const isReadOnly = mode === 'read';
  const [numericScheduleId, setNumericScheduleId] = useState(null);
  const showEditDeleteButtons =
    (from === 'Home' && !isMock) || (isReadOnly && !isMock) || isSaved;
  const hasPendingEmpty = Object.values(editedPlaces || {}).some(v => (v ?? '').trim() === '');

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const savingTimerRef = useRef(null);

  const scrollRef = useRef();
  const listRef = useRef(null);
  const [newlyAddedIndex, setNewlyAddedIndex] = useState(-1);
  const [originalScheduleData, setOriginalScheduleData] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [listVersion, setListVersion] = useState(0);
  const dayIdxRef = useRef(selectedDayIndex);

  useEffect(() => {
  // ✅ 저장 직후 replace로 넘어온 경우: 서버 재조회 전에 내가 넘긴 편집본을 먼저 화면에 확정
  if (route?.params?.initialData) {
    const ensured = ensurePlaceIds(route.params.initialData);
    setScheduleData(ensured);
    try { snapshotInitialOnce(ensured); } catch {}
  }
}, [route?.params?.initialData]);

  useEffect(() => { dayIdxRef.current = selectedDayIndex; }, [selectedDayIndex]);

  // ===== Tab bar hide/show =====
  useLayoutEffect(() => {
    const p1 = navigation.getParent?.(MAIN_TAB_ID);
    const p2 = navigation.getParent?.();
    console.log('[tab-parent]', Boolean(p1), Boolean(p2));
  }, [navigation]);
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent?.(MAIN_TAB_ID) ?? navigation.getParent?.();
      parent?.setOptions?.({ tabBarStyle: { display: 'none' } });
      return () => parent?.setOptions?.({ tabBarStyle: defaultTabBarStyle });
    }, [navigation])
  );

  useFocusEffect(
    useCallback(() => {
      setEditedPlaces({});
      setEditedPlaceId(null);
      setNewlyAddedPlaceId(null);
      setNewlyAddedIndex(-1);
      return () => {};
    }, [])
  );

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      setEditedPlaces({});
      setEditedPlaceId(null);
      setNewlyAddedPlaceId(null);
      setNewlyAddedIndex(-1);
    });
    return unsub;
  }, [navigation]);

  // ====== saving overlay controls ======
  const openSaving = (timeoutMs = 15000) => {
    try { if (savingTimerRef.current) clearTimeout(savingTimerRef.current); } catch {}
    setIsSaving(true);
    savingTimerRef.current = setTimeout(() => {
      setIsSaving(false);
      Alert.alert('네트워크 지연', '저장이 지연됩니다. 잠시 후 다시 시도해주세요.');
    }, timeoutMs);
  };
  const closeSaving = () => {
    try { if (savingTimerRef.current) clearTimeout(savingTimerRef.current); } catch {}
    setIsSaving(false);
  };
  useEffect(() => () => {
    try { if (savingTimerRef.current) clearTimeout(savingTimerRef.current); } catch {}
  }, []);

  // ====== 필드 보정 ======
  const ensurePlaceIds = (data) => ({
    ...data,
    days: (data?.days ?? []).map(day => ({
      ...day,
      places: (day?.places ?? []).map(place => {
        const car = Number.isFinite(Number(place?.driveTime)) ? Number(place.driveTime) : 0;
        const publicTransport = Number.isFinite(Number(place?.transitTime)) ? Number(place.transitTime) : 0;
        const walk = Number.isFinite(Number(place?.walkTime)) ? Number(place.walkTime) : 0;
        return {
          ...place,
          id: place?.id ? String(place.id) : uuid.v4(),
          fromPrevious: place?.fromPrevious ?? { car, publicTransport, walk },
          gptOriginalName: normalizeHashtags(
            place?.gptOriginalName ??
            place?.hashtag ??
            (Array.isArray(place?.hashtags) ? place.hashtags.join(' ') : '') ??
            (Array.isArray(place?.tags) ? place.tags.join(' ') : '') ??
            place?.keywords ?? place?.keyword ?? ''
          ),
        };
      }),
    })),
  });

  function ensurePlaceFields2(place = {}, prev = {}) {
    const name = (place.name ?? prev.name ?? '').trim();
    return {
      ...prev,
      ...place,
      name,
      type: place.type ?? prev.type ?? '',
      gptOriginalName: normalizeHashtags(place.gptOriginalName ?? prev.gptOriginalName ?? ''),
      estimatedCost: Number.isFinite(Number(place.estimatedCost))
        ? Number(place.estimatedCost)
        : (Number.isFinite(Number(prev.estimatedCost)) ? Number(prev.estimatedCost) : 0),
      fromPrevious: {
        car: Number.isFinite(Number(place?.fromPrevious?.car))
          ? Number(place.fromPrevious.car)
          : (Number.isFinite(Number(prev?.fromPrevious?.car)) ? Number(prev.fromPrevious.car) : 0),
        publicTransport: Number.isFinite(Number(place?.fromPrevious?.publicTransport))
          ? Number(place.fromPrevious.publicTransport)
          : (Number.isFinite(Number(prev?.fromPrevious?.publicTransport)) ? Number(prev.fromPrevious.publicTransport) : 0),
        walk: Number.isFinite(Number(place?.fromPrevious?.walk))
          ? Number(place.fromPrevious.walk)
          : (Number.isFinite(Number(prev?.fromPrevious?.walk)) ? Number(prev.fromPrevious.walk) : 0),
      },
    };
  }

  // ====== 상세 재조회 버전/시그니처 가드 ======
  const requestVersionRef = useRef(0);
  const lastAppliedVersionRef = useRef(0);
  const preEditSigRef = useRef('');
  const lastSavedSigRef = useRef('');
  const lastSavedAtRef = useRef(0);

  const signatureOf = (sch) => {
    try {
      return (sch?.days ?? [])
        .map(d => (d?.places ?? []).map(p => (p?.name ?? '').trim()).join('|'))
        .join('||');
    } catch { return ''; }
  };

  const applyDetailWithVersion = async (fetcher, tag='') => {
    const myVer = ++requestVersionRef.current;
    const detail = await fetcher();
    const ensured = ensurePlaceIds(detail?.id ? detail : { ...detail });

    try {
      const routeNumericId = coerceNumericScheduleId(route?.params?.scheduleId ?? scheduleId);
      const hasNumericInEnsured = Number.isFinite(extractNumericScheduleId(ensured));
      if (!hasNumericInEnsured && Number.isFinite(routeNumericId)) {
        ensured.serverId = routeNumericId;
      }
    } catch {}

    const justSaved = (Date.now() - lastSavedAtRef.current) <= 4000;
    const sig = signatureOf(ensured);
    const isOldOriginal = preEditSigRef.current && sig === preEditSigRef.current;
    const expectSaved  = lastSavedSigRef.current && sig === lastSavedSigRef.current;

    if (myVer < lastAppliedVersionRef.current) return null;
    if (justSaved && isOldOriginal && !expectSaved) return null;

    lastAppliedVersionRef.current = myVer;
    setScheduleData(ensured);
    const n = extractNumericScheduleId(ensured);
    if (Number.isFinite(n)) setNumericScheduleId(n);
    return ensured;
  };

  const getNumericScheduleId = () => {
    if (isValidId(numericScheduleId)) return numericScheduleId;
    const fromState = extractNumericScheduleId(scheduleData);
    if (isValidId(fromState)) return fromState;
    const fromRoute = coerceNumericScheduleId(route?.params?.scheduleId ?? route?.params);
    if (isValidId(fromRoute)) return fromRoute;
    return null;
  };

  // ===== initial load =====
  useEffect(() => {
    const loadData = async () => {
      try {
        const rawId = route.params?.scheduleId ?? scheduleId;
        const parsedId = coerceNumericScheduleId(rawId);
        const comeFromList = from === 'Home' || from === 'MyTrips';
        if (comeFromList && Number.isFinite(parsedId)) {
          await applyDetailWithVersion(() => getScheduleDetail(parsedId), 'initial-home');
          return;
        }
        const cached = await getCacheData(CACHE_KEYS.PLAN_INITIAL);
 // 🔒 리스트/읽기모드 진입 + 숫자 ID가 있으면 캐시 사용 금지
 const fromList = (from === 'Home' || from === 'MyTrips');
 if (cached && !(fromList && Number.isFinite(parsedId))) {
          const ensured = ensurePlaceIds(cached);
          try {
            const routeNumericId = coerceNumericScheduleId(route?.params?.scheduleId ?? scheduleId);
            const hasNumericInEnsured = Number.isFinite(extractNumericScheduleId(ensured));
            if (!hasNumericInEnsured && Number.isFinite(routeNumericId)) {
              ensured.serverId = routeNumericId;
            }
          } catch {}
          setScheduleData(ensured);
          const numCached = extractNumericScheduleId(cached);
          if (Number.isFinite(numCached)) setNumericScheduleId(numCached);
          try { await snapshotInitialOnce(ensured); } catch(e) { console.warn('snapshotInitialOnce fail', e?.message); }
        } else if (Number.isFinite(parsedId)) {
          await applyDetailWithVersion(() => getScheduleDetail(parsedId), 'initial-id');
        }
      } catch (err) {
        console.error('❌ 초기 데이터 로드 실패', err);
      }
    };
    loadData();
  }, [from, route.params?.scheduleId, scheduleId]);

  useEffect(() => {
   (async () => {
     try {
       // 🔒 MyTrips/Home에서 읽기모드로 들어온 경우엔 캐시 적용 금지
       const fromList = (route?.params?.from === 'MyTrips' || route?.params?.from === 'Home');
       const isRead = (route?.params?.mode === 'read');
       const hasNumericId = Number.isFinite(Number(String(route?.params?.scheduleId ?? '').match(/^\d+$/)?.[0]));
       if (fromList || isRead || hasNumericId) return;  // ⛔️ 캐시 덮어쓰기 금지

       const cached = await loadWorkingDraft();
       if (cached) {
         console.log('💾 [cache] 편집 캐시 기반 진입');
         setScheduleData(cached);
         setEditDraft(cached);
         setListVersion(v => v + 1);
       }
     } catch (e) {
       console.warn('⚠️ loadWorkingDraft 실패:', e);
     }
   })();
 // from, mode, scheduleId 변화에도 안전하게 동작
}, [route?.params?.from, route?.params?.mode, route?.params?.scheduleId]);

  useFocusEffect(
  useCallback(() => {
    const mustForce = route?.params?.forceFetch === true;
    if (mustForce) {
      console.log('🔁 forceFetch: 서버 상세 재조회 강제');
      const id = getNumericScheduleId();
      if (Number.isFinite(id)) {
        getScheduleDetail(id).then(detail => {
          setScheduleData(detail);
          setEditDraft(detail);
          setListVersion(v => v + 1);
        });
      }
      navigation.setParams({ ...(route.params || {}), forceFetch: undefined });
      return;
    }

    if (isEditing || isEditingLoading) return;

    if (route?.params?.skipFirstFetch) {
      navigation.setParams({ ...route.params, skipFirstFetch: undefined });
      return;
    }

    const id = getNumericScheduleId();
    if (Number.isFinite(id)) {
      applyDetailWithVersion(() => getScheduleDetail(id), 'focus');
    }
  }, [isEditing, isEditingLoading, route?.params?.forceFetch])
);

  useEffect(() => {
    if (!scheduleData?.days?.length) return;
    const hasMissing = scheduleData.days.some(day =>
      (day?.places ?? []).some(p =>
        !p?.fromPrevious ||
        typeof p?.fromPrevious?.car === 'undefined' ||
        typeof p?.fromPrevious?.publicTransport === 'undefined' ||
        typeof p?.fromPrevious?.walk === 'undefined' ||
        typeof p?.gptOriginalName === 'undefined'
      )
    );
    if (hasMissing) {
      const ensured = ensurePlaceIds(scheduleData);
      setScheduleData(ensured);
    }
  }, [scheduleData]);

  // ===== render state =====
  const selectedDay = isEditing
    ? editDraft?.days?.[selectedDayIndex]
    : scheduleData?.days?.[selectedDayIndex];
  const places = selectedDay?.places ?? [];

  // ===== Edit mode =====
  const enterEditMode = () => {
    setEditedPlaces({});
    setEditedPlaceId(null);
    setNewlyAddedPlaceId(null);
    setNewlyAddedIndex(-1);
    setOriginalScheduleData(JSON.parse(JSON.stringify(scheduleData)));
    setEditDraft(JSON.parse(JSON.stringify(scheduleData)));
    preEditSigRef.current = signatureOf(scheduleData);
    setIsEditing(true);
  };

  const handleBack = () => {
    if (isEditing) {
      setEditedPlaces({});
      setEditedPlaceId(null);
      setNewlyAddedPlaceId(null);
      setNewlyAddedIndex(-1);
      setEditDraft(null);
      setIsEditing(false);
      return;
    }
    const tabNav = navigation.getParent();
    if (from === 'Home') {
      if (tabNav?.reset) tabNav.reset({ index: 0, routes: [{ name: 'Home' }] });
      else navigation.navigate('Home');
    } else if (tabNav && tabNav.navigate) {
      tabNav.navigate('MyTrips');
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MyTrips');
    }
  };

  const handleDragEnd = ({ data }) => {
    setEditDraft(prev => {
      const updatedDays = prev.days.map((day, idx) =>
        idx === selectedDayIndex ? { ...day, places: [...data] } : day
      );
      return { ...prev, days: updatedDays };
    });
    setListVersion(v => v + 1);
  };

  const inputRefs = useRef({});
  const cardRefs  = useRef({});
  const setInputRef = (id) => (ref) => { if (ref) inputRefs.current[id] = ref; };
  const setCardRef  = (id) => (ref) => { if (ref) cardRefs.current[id]  = ref; };

  const focusAndScroll = (placeId, index) => {
    const input = inputRefs.current[placeId];
    const card  = cardRefs.current[placeId];
    try {
      listRef.current?.scrollToIndex?.({ index, animated: true, viewPosition: 0.2 });
    } catch (e) {
      if (card && listRef.current) {
        const scrollNode = listRef.current?.getScrollableNode?.() ?? findNodeHandle(listRef.current);
        UIManager.measureLayout(
          findNodeHandle(card),
          scrollNode,
          () => {},
          (x, y) => {
            listRef.current?.scrollToOffset?.({ offset: Math.max(0, y - 80), animated: true });
          }
        );
      }
    }
    requestAnimationFrame(() => { input?.focus?.(); });
  };

  useEffect(() => {
    if (!newlyAddedPlaceId) return;
    requestAnimationFrame(() => {
      const input = inputRefs.current[newlyAddedPlaceId];
      input?.focus?.();
    });
  }, [newlyAddedPlaceId]);

  useEffect(() => {
    if (isEditing && scheduleData && !editDraft) {
      setOriginalScheduleData(JSON.parse(JSON.stringify(scheduleData)));
      setEditDraft(JSON.parse(JSON.stringify(scheduleData)));
    }
  }, [isEditing, scheduleData, editDraft]);

  const handleAddPlace = (insertIndex) => {
    const hasEmpty = Object.values(editedPlaces).some((v) => (v ?? '').trim() === '');
    if (hasEmpty) {
      Alert.alert('입력 필요', '이전 추가된 장소의 이름을 먼저 입력해주세요.');
      return;
    }
    setEditDraft((prev) => {
      const currentPlaces = [...prev.days[selectedDayIndex].places];
      const newPlaceId = uuid.v4();
      const newPlace = {
        id: newPlaceId,
        name: '',
        type: '',
        estimatedCost: 0,
        gptOriginalName: '',
        fromPrevious: { car: 0, publicTransport: 0, walk: 0 },
      };
      console.log('🆕 [addPlace] 새 장소 초안 생성', _safePlaceForLog(newPlace), 'insertIndex=', insertIndex + 1, 'day=', selectedDayIndex + 1);
      const updatedPlaces = [
        ...currentPlaces.slice(0, insertIndex + 1),
        newPlace,
        ...currentPlaces.slice(insertIndex + 1),
      ];
      const updatedDays = prev.days.map((day, i) =>
        i === selectedDayIndex ? { ...day, places: updatedPlaces } : day
      );
      setNewlyAddedPlaceId(newPlaceId);
      setNewlyAddedIndex(insertIndex + 1);
      setEditedPlaceId(newPlaceId);
      setEditedPlaces((p) => ({ ...p, [newPlaceId]: '' }));
      return { ...prev, days: updatedDays };
    });
    setListVersion((v) => v + 1);
  };

  const handleDeletePlace = (placeId) => {
    setEditDraft(prev => {
      const currentPlaces = [...prev.days[selectedDayIndex].places];
      const updatedPlaces = currentPlaces.filter((p) => p.id !== placeId);
      const updatedDays = prev.days.map((day, i) =>
        i === selectedDayIndex ? { ...day, places: updatedPlaces } : day
      );
      return { ...prev, days: updatedDays };
    });
    if (newlyAddedPlaceId === placeId) setNewlyAddedPlaceId(null);
    setEditedPlaces((prev) => {
      const updated = { ...prev };
      delete updated[placeId];
      return updated;
    });
    setListVersion(v => v + 1);
  };

  const lastSubmittedNameRef = useRef({});
  const handleEndEditing = async (placeId) => {
    const newName = (editedPlaces[placeId] ?? '').trim();
    if (!newName) {
      Alert.alert('입력 필요', '장소명을 입력해주세요.');
      return;
    }
    if (lastSubmittedNameRef.current[placeId] === newName) {
      setEditedPlaceId(null);
      setEditedPlaces(prev => { const n = { ...prev }; delete n[placeId]; return n; });
      return;
    }
    lastSubmittedNameRef.current[placeId] = newName;

    const idx = dayIdxRef.current;
    const base = editDraft ?? scheduleData;
    const draft = JSON.parse(JSON.stringify(base));
    const effectivePlaces = draft.days[idx].places.map((p) => {
      if (p.id === placeId) return { ...p, name: newName };
      const overlay = editedPlaces[p.id];
      return overlay != null ? { ...p, name: overlay } : p;
    });
    draft.days[idx].places = effectivePlaces;

    const nextPlaces = effectivePlaces.map(cli => ensurePlaceFields(cli, cli)).map(p => ({
      ...p,
      gptOriginalName: normalizeHashtags(p.gptOriginalName),
    }));
    const committed = nextPlaces.find(p => p.id === placeId);
console.log('✏️ [endEditing] 장소명 확정', _safePlaceForLog(committed), 'idx=', idx, 'day=', idx + 1);

    const merged = {
      ...draft,
      days: draft.days.map((d, i) =>
        i === idx ? { ...d, places: nextPlaces } : d
      ),
    };
    setScheduleData(merged);
    setEditDraft(merged);

    setEditedPlaces(prev => { const n = { ...prev }; delete n[placeId]; return n; });
    setListVersion(v => v + 1);

    try { await writeEditedDraft(merged); } catch(e) { console.warn('writeEditedDraft fail', e?.message); }
    console.log('💾 [cache] PLAN_EDITED 업데이트 완료');
  };

  // ====== 편집 완료 → 서버로 필드 보강(edit) → 화면/캐시만 반영 ======
  
const handleEditDone = async () => {
  // 0) 포커스 정리
  try { Object.values(inputRefs.current || {}).forEach(r => r?.blur?.()); } catch {}

  // 1) 편집본 유효성
  if (!editDraft?.days?.length) {
    Alert.alert('오류', '편집본이 비어 있어 반영할 수 없습니다.');
    return;
  }

  // 2) 편집본 머지(빈 카드 제거, 해시태그 정리)
  let mergedDraft = JSON.parse(JSON.stringify(editDraft));
  for (let i = 0; i < mergedDraft.days.length; i++) {
    mergedDraft.days[i].places = mergedDraft.days[i].places
      .map(p => {
        const pending = (editedPlaces?.[p.id] ?? '').trim();
        const name = pending || p.name || '';
        return {
          ...p,
          name,
          gptOriginalName: normalizeHashtags(p.gptOriginalName),
        };
      })
      .filter(p => (p.name ?? '').trim().length > 0)
      .map((p, idx) => ({ ...p, placeOrder: idx + 1 }));
  }

  // 3) 캐시에 우선 확정 저장 + 화면 상태 갱신
  await writeEditedDraft(mergedDraft);
  setScheduleData(mergedDraft);
  setEditDraft(mergedDraft);

  // ✅ [여기에 아래 코드 추가] 👇👇👇
lastSavedSigRef.current = signatureOf(mergedDraft);
lastSavedAtRef.current  = Date.now();
navigation.setParams({ ...(route.params || {}), skipFirstFetch: true }); // 1회 재조회 스킵
// ✅ [여기까지 추가]

  // 4) 현재 선택된 Day만 /schedule/edit 호출 (명세: names[]만 전송)
  try {
    openSaving();

    const activeDay = selectedDayIndex;
    const names = (mergedDraft?.days?.[activeDay]?.places || [])
      .map(p => (p?.name ?? '').trim())
      .filter(Boolean);

    if (names.length === 0) {
      // 보낼게 없으면 바로 종료
      setIsEditing(false);
      return;
    }

    const res = await editSchedule({ names }); // ✅ names만 전송

    // 429(쿼터) → 보강 스킵, 로컬본 확정
    if (res?.quotaExceeded) {
      await writeEditedDraft(mergedDraft);
      setScheduleData(mergedDraft);
      setEditDraft(mergedDraft);
      // 필요시 토스트/스낵: “일부 정보는 잠시 후 채워져요”
      setIsEditing(false);
      return;
    }

    // 5) 정상 응답이면 해당 Day에만 places/totalEstimatedCost 반영
    if (Array.isArray(res?.places)) {
      const next = { ...mergedDraft };
      next.days = mergedDraft.days.map((d, i) =>
        i === activeDay
          ? {
              ...d,
              places: res.places,
              totalEstimatedCost: res.totalEstimatedCost ?? d.totalEstimatedCost,
            }
          : d
      );

      await writeEditedDraft(next);
      setScheduleData(next);
      setEditDraft(next);
    }
  } catch (e) {
    console.error('❌ [editDone] 실패:', e);
    Alert.alert('오류', '네트워크 문제로 편집 반영에 실패했습니다.');
  } finally {
    closeSaving();
  }

  // 6) 편집 종료
  setIsEditing(false);
  setOriginalScheduleData(null);
};


  const onPressSave = () => { handleEditDone(); };

  // =====================
  // Render
  // =====================
  if (!scheduleData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <Text style={styles.loadingText}>⏳ 데이터를 불러오는 중입니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: normalize(16), paddingVertical: normalize(12) }}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#111111" style={{ marginTop: -12 }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>여행플랜</Text>
          <View style={{ width: normalize(24) }} />
        </View>

        {/* 여행 정보 */}
        <View style={styles.tripInfo}>
          <View style={styles.tripInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tripTitle}>{scheduleData.title}</Text>
              <Text style={styles.dateText}>
                {scheduleData.startDate} ~ {scheduleData.endDate}
              </Text>
            </View>
            {selectedDay && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.budget}>
                  {selectedDay.totalEstimatedCost?.toLocaleString()}
                  <Text style={styles.budgetUnit}>원</Text>
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 탭 */}
        {isEditing ? (
          <View style={{ alignItems: 'center', backgroundColor: '#FAFAFA', paddingVertical: normalize(10) }}>
            <View style={styles.tabBox}>
              <Text style={[styles.tabText, styles.tabTextSelected]}>
                Day - {selectedDayIndex + 1}
              </Text>
              <View style={styles.activeBar} />
            </View>
          </View>
        ) : (
          <View style={styles.tabScrollWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
              {scheduleData.days.map((_, idx) => (
                <TouchableOpacity key={idx} onPress={() => !isEditing && setSelectedDayIndex(idx)} disabled={isEditing}>
                  <View style={styles.tabBox}>
                    <Text
                      style={[
                        styles.tabText,
                        selectedDayIndex === idx && styles.tabTextSelected,
                        isEditing && selectedDayIndex !== idx && { opacity: 0.3 },
                      ]}
                    >
                      Day - {idx + 1}
                    </Text>
                    {selectedDayIndex === idx && <View style={styles.activeBar} />}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 본문 */}
        <View style={{ flex: 1 }}>
          {isEditing ? (
            <DraggableFlatList
              ref={listRef}
              data={places}
              keyExtractor={(item, idx) => item.id ? String(item.id) : `temp-${idx}`}
              onDragEnd={handleDragEnd}
              extraData={[editDraft, scheduleData, newlyAddedPlaceId, selectedDayIndex, listVersion]}
              containerStyle={styles.container}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: normalize(160, 'height') }}
              renderItem={({ item: place, index, drag }) => {
                const currentIndex = places.findIndex((p) => p.id === place.id);
                const isEditingItem = newlyAddedPlaceId === place.id || editedPlaceId === place.id;
                return (
                  <View key={place.id}>
                    <View style={styles.placeRow}>
                      <View style={styles.timeline} />
                      <View style={styles.placeContent}>
                        {/* 드래그 */}
                        <TouchableOpacity style={styles.dragHandle} onLongPress={drag} delayLongPress={100}>
                          <Ionicons name="reorder-two-outline" size={normalize(30)} color={place.type === '식사' ? '#1270B0' : '#4F46E5'} />
                        </TouchableOpacity>
                        {/* 삭제 */}
                        <TouchableOpacity
                          style={{ position: 'absolute', top: normalize(25), right: 0, backgroundColor: '#F87171', borderRadius: normalize(20), padding: normalize(4), zIndex: 10 }}
                          onPress={() => handleDeletePlace(place.id)}
                        >
                          <Ionicons name="remove" size={normalize(16)} color="#fff" />
                        </TouchableOpacity>

                        {/* placeCard */}
                        <TouchableOpacity
                          ref={setCardRef(place.id)}
                          style={[styles.placeCard3, { marginLeft: normalize(24) }]}
                          disabled={newlyAddedPlaceId === place.id}
                          onPress={() => {
                            if (isEditing && !newlyAddedPlaceId) {
                              setEditedPlaceId(place.id);
                              setEditedPlaces((prev) => ({ ...prev, [place.id]: place.name ?? '' }));
                              requestAnimationFrame(() => focusAndScroll(place.id, index));
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          {isEditingItem ? (
                            <TextInput
                              ref={setInputRef(place.id)}
                              style={styles.placeNameInput}
                              value={editedPlaces[place.id] ?? (place?.name ?? '')}
                              placeholder="장소명을 입력하세요"
                              onFocus={() => focusAndScroll(place.id, index)}
                              onChangeText={(text) => setEditedPlaces((prev) => ({ ...prev, [place.id]: text }))}
                              onEndEditing={() => { handleEndEditing(place.id); setEditedPlaceId(null); }}
                              autoFocus
                              underlineColorAndroid="transparent"
                              placeholderTextColor="#C0C0C0"
                            />
                          ) : (
                            <View style={{ minHeight: normalize(60, 'height'), justifyContent: 'center' }}>
                              <View style={styles.placeHeader}>
                                <Text style={styles.placeName}>{place.name}</Text>
                              </View>
                              {place.name && place.type && (
                                <Text style={styles.placeType}>{place.type}</Text>
                              )}
                              {place.name && place.gptOriginalName && (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
                                  {Array.from(new Set(
                                    String(place.gptOriginalName || '')
                                      .replace(/#/g, ' ')
                                      .split(/\s+/)
                                      .filter(Boolean)
                                  )).map((tag, i) => (
                                    <Text key={`${tag}-${i}`} style={{ color: '#606060', fontSize: 12, marginRight: 4, fontWeight: '400', lineHeight: 19 }}>
                                      #{tag}
                                    </Text>
                                  ))}
                                </View>
                              )}
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* 카드 아래에 추가 버튼 */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#A19CFF',
                        paddingVertical: normalize(4),
                        borderRadius: normalize(16),
                        marginTop: normalize(16),
                        marginBottom: currentIndex === places.length - 1 ? normalize(28) : normalize(10),
                        alignSelf: 'flex-start',
                        width: '50%',
                        marginLeft: normalize(90),
                        opacity: 1,
                      }}
                      disabled={hasPendingEmpty}
                      onPress={() => handleAddPlace(currentIndex)}
                    >
                      <Text style={{ color: '#fff', fontSize: normalize(15), textAlign: 'center', lineHeight: normalize(20) }}>
                        장소추가
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.container}
              contentContainerStyle={{ paddingTop: normalize(20), paddingBottom: normalize(160, 'height') }}
            >
              {places.map((place, idx) => (
                <View key={place.id ? String(place.id) : `temp-${idx}`}>
                  {/* 교통정보 (맨 위 카드 제외) */}
                  {idx !== 0 && place.fromPrevious && (
                    <View style={styles.transportRow}>
                      <View className="car" style={styles.transportItem}>
                        <View style={styles.iconSlot}><Ionicons name="car-outline" size={normalize(19)} color="#6B7280" /></View>
                        <Text style={styles.timeText}>{place.fromPrevious.car}분</Text>
                      </View>
                      <View className="bus" style={styles.transportItem}>
                        <View style={styles.iconSlot}><Ionicons name="bus-outline" size={normalize(17)} color="#6B7280" /></View>
                        <Text style={styles.timeText}>{place.fromPrevious.publicTransport}분</Text>
                      </View>
                      <View className="walk" style={styles.transportItem}>
                        <View className="walk" style={styles.iconSlot}><MaterialCommunityIcons name="walk" size={normalize(17)} color="#6B7280" /></View>
                        <Text style={styles.timeText}>{place.fromPrevious.walk}분</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.placeRow}>
                    <View style={styles.timeline}>
                      <View style={[styles.dot, { backgroundColor: place.type === '식사' ? '#1270B0' : '#4F46E5' }, { width: normalize(20), height: normalize(20), borderRadius: normalize(10), top: normalize(31) }]} />
                      {idx !== places.length - 1 && <View style={[styles.verticalLine, { left: normalize(13), width: normalize(4), height: normalize(330, 'height') }]} />}
                    </View>

                    <View style={styles.placeContent}>
                      <TouchableOpacity style={styles.placeCard} onPress={() => navigation.navigate('PlaceDetail', { place })}>
                        <View style={styles.placeHeader}>
                          <Text style={styles.placeName}>{place.name}</Text>
                          <Text style={[styles.placeCost, { color: '#4F46E5' }]}>
                            {place.estimatedCost === 0 ? '무료' : `${place.estimatedCost?.toLocaleString()}원`}
                          </Text>
                        </View>
                        <Text style={styles.placeType}>{place.type}</Text>
                        {place.gptOriginalName && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
                            {Array.from(new Set(
                              String(place.gptOriginalName || '')
                                .replace(/#/g, ' ')
                                .split(/\s+/)
                                .filter(Boolean)
                            )).map((tag, i) => (
                              <Text key={`${tag}-${i}`} style={{ color: '#606060', fontSize: 12, marginRight: 4, fontWeight: '400', lineHeight: 19 }}>
                                #{tag}
                              </Text>
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 마지막 카드 아래 교통정보 (마지막 day 제외) */}
                  {idx === places.length - 1 && place.fromPrevious && selectedDayIndex !== scheduleData.days.length - 1 && (
                    <View style={styles.transportRow}>
                      <View style={styles.transportItem}>
                        <View style={styles.iconSlot}><Ionicons name="car-outline" size={normalize(19)} color="#6B7280" /></View>
                        <Text style={styles.timeText}>{place.fromPrevious.car}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <View style={styles.iconSlot}><Ionicons name="bus-outline" size={normalize(17)} color="#6B7280" /></View>
                        <Text style={styles.timeText}>{place.fromPrevious.publicTransport}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <View style={styles.iconSlot}><MaterialCommunityIcons name="walk" size={normalize(17)} color="#6B7280" /></View>
                        <Text style={styles.timeText}>{place.fromPrevious.walk}분</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 하단 버튼들 */}
        {isEditing ? (
          <View style={styles.fixedDoneButtonWrapper}>
            <TouchableOpacity style={styles.fixedDoneButton} onPress={handleEditDone}>
              <Text style={styles.fixedDoneButtonText}>플랜 수정 완료</Text>
            </TouchableOpacity>
          </View>
        ) : (from === 'Home' || isReadOnly || isSaved) ? (
          <>
    {/* 내 여행으로 재저장 */}
    <View style={styles.resaveBox}>
{/* ✅ 내 여행으로 재저장 */}
<TouchableOpacity
  style={styles.resaveButton}
  onPress={async () => {
    try {
      openSaving?.();

      // 1) 최신 편집본: PLAN_EDITED만 1순위로 사용
      const latest =
        (await getCacheData(CACHE_KEYS.PLAN_EDITED)) || editDraft;
      if (!latest?.days?.length) {
        closeSaving?.();
        Alert.alert('재저장 불가', '재저장할 일정이 없습니다.');
        return;
      }

      // 2) 숫자 scheduleId 강제 획득
      const id = getNumericScheduleId();
      if (!Number.isFinite(id)) {
        closeSaving?.();
        Alert.alert('재저장 불가', 'scheduleId를 찾을 수 없습니다.');
        return;
      }

      // 3) payload 생성 (빈/삭제 항목 제거 + 순서 재정렬 + 시간/좌표 정리)
      const { days } = buildResaveDaysPayload(latest);
      console.log('📤 [resave payload names]', days.map(d => d.places.map(p => p.name)));

      // 4) 서버 전송
      const res = await resaveSchedule(id, days);
      console.log('✅ 재저장 성공:', res);

      // ✅ (재저장 직후 서버 상세 재조회 로그)
const after = await getScheduleDetail(id);
console.log('🔎 post-resave server detail names',
  after?.days?.map(d => (d.places || []).map(p => p.name))
);

// ✅ 상세 캐시 제거
await removeCacheData?.(CACHE_KEYS.PLAN_DETAIL);

      // 5) 편집/리스트/홈 캐시 무효화 + 새로고침 이벤트
      await clearDraftCaches?.();              // PLAN_EDITED/INITIAL 정리
      await invalidateListAndHomeCaches?.();   // 리스트/홈 캐시 무효화
      emitTripsUpdated(DeviceEventEmitter, { id, reason: 'resave' });

      // 6) 내여행으로 이동 (1회성 새로고침 파라미터)
      navigation.navigate('MyTrips', { refreshAt: Date.now() });

      closeSaving?.();
      Alert.alert('완료', '플랜이 성공적으로 재저장되었습니다.');
    } catch (e) {
      closeSaving?.();
      console.warn('❌ 재저장 오류:', e);
      Alert.alert('오류', '재저장에 실패했습니다.');
    }
  }}
>
  <Text style={styles.resaveButtonText}>내 여행으로 재저장</Text>
</TouchableOpacity>
    </View>

    {/* 기존: 플랜 삭제 / 플랜 수정 */}
    <View style={styles.bottomButtonContainer}>
      <TouchableOpacity
        style={[styles.editButton, { flex: 1, marginRight: normalize(8), backgroundColor: '#fff', borderColor: '#F97575' }]}
        onPress={() => {
          Alert.alert(
            '플랜 삭제',
            '정말로 이 여행 플랜을 삭제하시겠습니까?',
            [
              { text: '취소', style: 'cancel' },
              {
                text: '삭제', style: 'destructive',
                onPress: async () => {
                  try {
                    setIsDeleting(true);
                    const numericId = getNumericScheduleId();
                    const fallback  = /^[0-9]+$/.test(String(scheduleId ?? '')) ? Number(scheduleId) : null;
                    const finalId   = Number.isFinite(numericId) ? numericId : fallback;
                    if (!Number.isFinite(finalId)) {
                      setIsDeleting(false);
                      Alert.alert('삭제 불가', '삭제할 숫자 ID를 찾을 수 없습니다.');
                      return;
                    }
                    await deleteSchedule(finalId);
                    setIsDeleting(false);
                    if (navigation.canGoBack()) navigation.goBack();
                    else navigation.navigate('MyTrips');
                  } catch (e) {
                    setIsDeleting(false);
                    Alert.alert('삭제 실패', e?.message ?? '플랜 삭제에 실패했습니다.');
                  }
                },
              },
            ]
          );
        }}
      >
        <Text style={[styles.editButtonText, { color: '#F97575' }]}>플랜 삭제</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.editButton, { flex: 1, backgroundColor: '#fff', borderColor: '#4F46E5' }]}
        onPress={enterEditMode}
      >
        <Text style={[styles.editButtonText, { color: '#4F46E5' }]}>플랜 수정</Text>
      </TouchableOpacity>
    </View>
  </>
        ) : (
          <>
            <View style={styles.bottomButtonContainer1}>
              <TouchableOpacity style={[styles.editButton, { marginRight: normalize(2) }]} onPress={enterEditMode}>
                <Text style={styles.editButtonText}>플랜 수정</Text>
              </TouchableOpacity>

              {/* 플랜 전체 재조회 */}
              <TouchableOpacity
                style={[styles.saveButton, { marginLeft: normalize(8) }]}
                onPress={async () => {
                  try {
                    setIsRegenerating(true);
                    const scheduleDataLocal = scheduleData;
                    const paramsFromRoute = route?.params || {};
                    const startDate = scheduleDataLocal?.startDate || paramsFromRoute?.startDate;
                    const endDate   = scheduleDataLocal?.endDate   || paramsFromRoute?.endDate;
                    const destination =
                      scheduleDataLocal?.destination ||
                      paramsFromRoute?.destination ||
                      scheduleDataLocal?.regionCode ||
                      paramsFromRoute?.regionCode ||
                      null;
                    const travelStyle = paramsFromRoute?.travelStyle || scheduleDataLocal?.travelStyle || 'NONE';
                    const mbti        = paramsFromRoute?.mbti        || scheduleDataLocal?.mbti        || 'NONE';
                    const peopleGroup = paramsFromRoute?.peopleGroup || scheduleDataLocal?.peopleGroup || 'NONE';
                    const budget =
                      (scheduleDataLocal?.days || [])
                        .reduce((acc, d) => acc + (Number(d?.totalEstimatedCost) || 0), 0) ||
                      paramsFromRoute?.budget ||
                      0;
                    if (!startDate || !endDate) {
                      Alert.alert('재조회 불가', '여행 시작/종료 날짜를 찾을 수 없습니다.');
                      setIsRegenerating(false);
                      return;
                    }
                    if (!destination) {
                      Alert.alert('재조회 불가', '목적지 정보가 없어 재조회할 수 없습니다. (destination)');
                      setIsRegenerating(false);
                      return;
                    }
                    const payload = { budget, destination, startDate, endDate, mbti, peopleGroup, travelStyle };
                    const response = await regenerateSchedule(payload);
                    if (response?.days?.length) {
                      const next = ensurePlaceIds(response);
                      setScheduleData(next);
                      setSelectedDayIndex(0);
                    } else {
                      Alert.alert('재조회 실패', '서버에서 유효한 일정이 오지 않았습니다.');
                    }
                  } catch (err) {
                    console.warn('❌ 재조회 오류', err);
                    Alert.alert('오류', '플랜 재조회 중 오류가 발생했습니다.');
                  } finally {
                    setIsRegenerating(false);
                  }
                }}
              >
                <Text style={styles.saveButtonText}>플랜 전체 재조회</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.regenerateButtonWrapper}>
              {/* 내 여행으로 저장 */}
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={async () => {
                  try {
                    const cachedEdited = await getCacheData(CACHE_KEYS.PLAN_EDITED);
                    const working     = await loadWorkingDraft();
                    const latestBase  = working || cachedEdited || editDraft || scheduleData;
                    if (!latestBase?.days?.length) {
                      Alert.alert('저장 불가', '저장할 일정이 없습니다.');
                      return;
                    }
                    const mergedClean = mergeAndCleanDraft(latestBase, editedPlaces);
 const latest = ensurePlaceIds(mergedClean);

                    const current = latest?.id ? latest : { ...(latest || {}), id: uuid.v4() };
                    const extractId = (obj) => {
                      const raw = obj?.serverId ?? obj?.scheduleId ?? obj?.scheduleNo ?? obj?.id;
                      const n = Number(String(raw ?? '').match(/^\d+$/)?.[0]);
                      return Number.isFinite(n) ? n : NaN;
                    };
                    let finalId = extractId(current);

                    try {
                      if (typeof saveSchedule === 'function') {
                        const saved = await saveSchedule(current);
                        const raw = saved?.id ?? saved?.scheduleId ?? saved?.scheduleNo;
                        const parsed = Number(String(raw ?? '').match(/^\d+$/)?.[0]);
                        if (Number.isFinite(parsed)) finalId = parsed;
                      }
                    } catch (apiErr) {}

                    const forLocal = { ...current };
                    if (Number.isFinite(finalId)) forLocal.serverId = finalId;

                    const existing = await AsyncStorage.getItem('MY_TRIPS');
                    let trips = existing ? JSON.parse(existing) : [];
                    const idx = trips.findIndex(t => Number(t?.serverId ?? t?.id) === finalId);
                    if (idx !== -1) trips[idx] = { ...trips[idx], ...forLocal };
                    else trips.push(forLocal);
                    await AsyncStorage.setItem('MY_TRIPS', JSON.stringify(trips));

                    Alert.alert('저장 완료', '내 여행에 저장되었습니다.', [
                      {
                        text: '확인',
                        onPress: () => {
                          if (Number.isFinite(finalId)) {
       navigation.replace('PlannerResponse', {
         scheduleId: finalId,
         mode: 'read',
         from: 'PlannerCreate',
         initialData: latest,      // ✅ 내가 방금 저장한 편집본을 같이 전달
         skipFirstFetch: true,     // ✅ 첫 렌더에서는 서버 재조회 스킵
       });
     }
                        },
                      },
                    ]);
                  } catch (e) {
                    Alert.alert('오류', '저장에 실패했습니다.');
                  }
                }}
              >
                <Text style={styles.regenerateButtonText}>내 여행으로 저장</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* 로딩 모달 */}
        <Modal visible={isRegenerating} transparent animationType="fade">
          <SplashScreen />
        </Modal>
        <Modal visible={isSaving} transparent animationType="fade">
          <SplashScreen />
        </Modal>
        <Modal visible={isEditingLoading} transparent animationType="fade">
          <SplashScreen />
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#Fafafa' },
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingText: { marginTop: normalize(100, 'height'), textAlign: 'center', fontSize: normalize(16) },
  headerTitle: { flex: 1, textAlign: 'left', fontSize: normalize(20), fontWeight: '700', color: '#111827', marginLeft: normalize(10), marginTop: normalize(-10) },
  tripInfo: { backgroundColor: '#FAFAFA', padding: normalize(16), paddingBottom: normalize(4) },
  tripInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tripTitle: { fontSize: normalize(20), fontWeight:'500', color: '#1E1E1E' },
  budget: { color: '#4F46E5', fontSize: normalize(16), marginTop: normalize(4), position: 'relative', top: normalize(-10), left: normalize(-20) },
  budgetUnit: { color: '#4F46E5', fontSize: normalize(16) },
  dateText: { fontSize: normalize(14), color: '#7E7E7E', marginTop: normalize(4), marginBottom: 0 },
  tabScrollWrapper: { backgroundColor: '#FAFAFA' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: normalize(6), paddingVertical: normalize(6) },
  tabBox: { alignItems: 'center', marginHorizontal: normalize(6), paddingHorizontal: normalize(10) },
  tabText: { fontSize: normalize(18), color: '#9CA3AF' },
  tabTextSelected: { color: '#4F46E5', fontWeight: 'bold' },
  activeBar: { marginTop: normalize(5), height: normalize(4), width: normalize(80), backgroundColor: '#4F46E5', borderRadius: 2 },
  container: { paddingHorizontal: normalize(16), marginBottom: -normalize(70), marginTop: normalize(0), backgroundColor: '#FAFAFA' },
  bottomButtonContainer1: {
    flexDirection: 'row',
    paddingVertical: 0,
    paddingHorizontal: normalize(16),
    borderRadius: 0,
    marginBottom: normalize(8)
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: normalize(10),
  },
  placeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: normalize(32) },
  timeline: { width: normalize(30), alignItems: 'center', position: 'relative' },
  dot: { width: normalize(20), height: normalize(20), borderRadius: normalize(10), backgroundColor: '#6366F1', position: 'absolute', top: normalize(40), zIndex: 2 },
  verticalLine: { position: 'absolute', top: -normalize(20), left: normalize(13), width: normalize(4), height: normalize(330, 'height'), backgroundColor: '#A19CFF' },
  placeContent: { flex: 1, marginLeft: normalize(10) },
  placeCard: { backgroundColor: '#fff', padding: normalize(16), paddingBottom: normalize(10), borderRadius: normalize(20), marginBottom: -normalize(25), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  placeCard3: { backgroundColor: '#fff', padding: normalize(16), paddingRight: normalize(5), paddingLeft: normalize(16), paddingBottom: normalize(6), borderRadius: normalize(20), marginBottom: -normalize(40), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4, width: '88%', left: -normalize(20) },
  placeHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  placeName: { fontSize: normalize(16), marginBottom: normalize(4), color: '#373737' },
  placeCost: { fontSize: normalize(15), fontWeight: '600', fontStyle: 'Inter', color: '#353537ff', bottom: -normalize(15) },
  placeType: { fontSize: normalize(11), color: '#9CA3AF', marginBottom: normalize(4), top: normalize(2) },
  keywords: { fontSize: normalize(12), color: '#333333', marginBottom: normalize(6) },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(12),
    marginTop: normalize(16),
    marginBottom: normalize(12),
    gap: normalize(12),
    paddingLeft: normalize(50),
  },
  placeNameInput: { fontSize: normalize(18), marginBottom: normalize(19), color: '#373737', paddingVertical: normalize(4), paddingTop: normalize(18) },
  transportItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
  iconSlot: { width: normalize(22), alignItems: 'center', marginRight: normalize(6) },
  timeText: { fontSize: normalize(14), width: normalize(44), textAlign: 'left', color: '#000' },
  dragHandle: { position: 'absolute', left: -normalize(45), top: normalize(25), padding: normalize(4), zIndex: 5 },
  editButton: {
    flex: 1,
    height: normalize(45),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: '#4F46E5',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: normalize(8),
  },
  editButtonText: { fontSize: normalize(16), color: '#4F46E5' },
  saveButton: { flex: 1, height: normalize(45), borderRadius: normalize(12), borderWidth: 1, borderColor: '#4F46E5', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { textAlign: 'center', color: '#4F46E5', fontSize: normalize(16) },
  regenerateButtonWrapper: {
    position: 'absolute',
    bottom: normalize(60),
    left: normalize(16),
    right: normalize(16),
    paddingVertical: 0,
    borderRadius: 0
  },
  regenerateButton: { backgroundColor: '#4F46E5', borderRadius: normalize(10), paddingVertical: normalize(12), alignItems: 'center', borderWidth: 1, borderColor: '#4F46E5' },
  regenerateButtonText: { color: '#fff', fontSize: normalize(16) },
  fixedDoneButtonWrapper: { position: 'absolute', bottom: normalize(5), left: normalize(20), right: normalize(20), backgroundColor: '#4F46E5', borderRadius: normalize(12), paddingVertical: normalize(14), alignItems: 'center' },
  fixedDoneButton: { width: '100%', alignItems: 'center' },
  fixedDoneButtonText: { color: '#fff', fontSize: normalize(18) },

  resaveBox: {
  paddingHorizontal: normalize(16),
  marginTop: normalize(10),
  marginBottom: normalize(6),
},
resaveButton: {
  backgroundColor: '#4F46E5',
  borderRadius: normalize(10),
  paddingVertical: normalize(12),
  alignItems: 'center',
},
resaveButtonText: {
  color: '#fff',
  fontSize: normalize(16),
  fontWeight: '600',
},
});