// 📄 components/planner/PlannerResponseHome2.jsx
// (기존 로직/스타일 유지, 해시태그 증가 버그만 차단)

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

// ===== API & cache (프로젝트 경로에 맞게 조정) =====
import { getCacheData, saveCacheData, CACHE_KEYS } from '../../caching/cacheService';
import { editSchedule } from '../../api/planner_edit_request';
import { regenerateSchedule } from '../../api/planner_regenerate_request';
import { saveSchedule } from '../../api/planner_save_request';
import { deleteSchedule } from '../../api/planner_delete_request';
import { getScheduleDetail } from '../../api/MyPlanner_detail';

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
// 일반 헬퍼
// =====================

// ✅ 해시태그 정규화: '#제주  제주  #바다' → '제주 바다'
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

// =====================
// 컴포넌트
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
  const savingTimerRef = useRef(null);

  const scrollRef = useRef();
  const listRef = useRef(null);
  const [newlyAddedIndex, setNewlyAddedIndex] = useState(-1);
  const [originalScheduleData, setOriginalScheduleData] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [listVersion, setListVersion] = useState(0);
  const dayIdxRef = useRef(selectedDayIndex);
  useEffect(() => { dayIdxRef.current = selectedDayIndex; }, [selectedDayIndex]);

  // ✅ onEndEditing 중복 호출 가드
  const lastSubmittedNameRef = useRef({});

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
    // ✅ 다시 진입 시 편집 관련 상태 초기화
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

  // ====== place 필드 보정 ======
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
          // ✅ append 금지: 항상 대체 + 정규화
          gptOriginalName: normalizeHashtags(place?.gptOriginalName ?? place?.hashtag ?? ''),
        };
      }),
    })),
  });
  function ensurePlaceFields(place = {}, prev = {}) {
    const name = (place.name ?? prev.name ?? '').trim();
    return {
      ...prev,
      ...place,
      name,
      type: place.type ?? prev.type ?? '',
      // ✅ append 금지: place 우선으로 대체 + 정규화
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

  // ====== 상세 재조회 버전 관리 ======
  const requestVersionRef = useRef(0);
  const lastAppliedVersionRef = useRef(0);

  // 저장 전/후 서명 관리
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

    // 저장 직후 구응답 드랍
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

  // ====== id util ======
  const getNumericScheduleId = () => {
    if (isValidId(numericScheduleId)) return numericScheduleId;
    const fromState = extractNumericScheduleId(scheduleData);
    if (isValidId(fromState)) return fromState;
    const fromRoute = coerceNumericScheduleId(route?.params?.scheduleId ?? route?.params);
    if (isValidId(fromRoute)) return fromRoute;
    return null;
  };
  const resolveScheduleId = () => (scheduleData?.id ?? scheduleData?.scheduleId ?? route?.params?.scheduleId ?? null);

  // ====== initial data load ======
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
        if (cached) {
          const ensured = ensurePlaceIds(cached);
          setScheduleData(ensured);
          const numCached = extractNumericScheduleId(cached);
          if (Number.isFinite(numCached)) setNumericScheduleId(numCached);
        } else if (Number.isFinite(parsedId)) {
          await applyDetailWithVersion(() => getScheduleDetail(parsedId), 'initial-id');
        }
      } catch (err) {
        console.error('❌ 초기 데이터 로드 실패', err);
      }
    };
    loadData();
  }, [from, route.params?.scheduleId, scheduleId]);

  // ====== focus sync ======
  useFocusEffect(
    useCallback(() => {
      if (isEditing) return;
      const id = getNumericScheduleId();
      if (Number.isFinite(id)) {
        applyDetailWithVersion(() => getScheduleDetail(id), 'focus');
      }
    }, [isEditing])
  );

  // ====== 필드 보정 안전망 ======
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

  // ====== recreate params (기존 흐름 유지) ======
  const buildRecreateParams_ = async () => {
    let base = null;
    try { base = await getCacheData(CACHE_KEYS.PLAN_INITIAL); } catch (_) {}
    const src = base || scheduleData || {};
    const startDate   = src.startDate   || scheduleData?.startDate || '';
    const endDate     = src.endDate     || scheduleData?.endDate   || '';
    const destination = scheduleData?.destination || src.destination || 'JEJU_SI';
    const mbti        = (src.mbti || scheduleData?.mbti || 'ENTJ').toUpperCase();
    const travelStyle = (src.travelStyle || scheduleData?.travelStyle || 'ACTIVITY').toUpperCase();
    const peopleGroup = (src.peopleGroup || scheduleData?.peopleGroup || 'SOLO').toUpperCase();
    const budget      = Number(src.budget ?? scheduleData?.budget ?? 0);
    const excludedNames = (scheduleData?.days ?? [])
      .flatMap(d => (d?.places ?? []).map(p => p?.name).filter(Boolean));
    return { startDate, endDate, destination, mbti, travelStyle, peopleGroup, budget, excludedNames };
  };

  // ====== render 대상 ======
  const selectedDay = isEditing
    ? editDraft?.days?.[selectedDayIndex]
    : scheduleData?.days?.[selectedDayIndex];
  const places = selectedDay?.places ?? [];

  const enterEditMode = () => {
  // 🔹추가: 편집 세션 시작 전에 미완 입력 흔적 제거
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
    // 🔹추가: 편집 종료 시 초기화
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

  // ====== add/delete ======
const handleAddPlace = (insertIndex) => {
  // 🔒 비어있는 입력란이 있으면 추가 금지
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
    setEditedPlaces((p) => ({ ...p, [newPlaceId]: '' })); // 입력란 초기화
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

  // ====== 개별 입력 확정 ======
  const handleEndEditing = async (placeId) => {
    const newName = (editedPlaces[placeId] ?? '').trim();
    if (!newName) {
      Alert.alert('입력 필요', '장소명을 입력해주세요.');
      return;
    }

    // ✅ 같은 값으로 중복 호출되면 무시 (iOS onEndEditing 두 번 방지)
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
    setEditDraft(draft);
    setScheduleData(draft);

    const placeNames = effectivePlaces.map((p) => (p?.name ?? '').trim()).filter(Boolean);
    if (placeNames.length === 0) {
      setEditedPlaces(prev => { const n = { ...prev }; delete n[placeId]; return n; });
      setListVersion(v => v + 1);
      return;
    }

    const numericId = getNumericScheduleId();
    const sid = numericId ?? resolveScheduleId();
    console.log('[editSchedule][REQ]', JSON.stringify({ scheduleId: sid, dayIndex: idx, namesCount: placeNames.length, names: placeNames }));

    try {
      const result = await editSchedule(placeNames, { scheduleId: sid, dayIndex: idx });

      const norm = (s) => (s ?? '').replace(/\s+/g, '').trim();
      let nextPlaces = effectivePlaces;

      if (result?.places && result.totalEstimatedCost !== undefined) {
        const serverMap = new Map(
          result.places.map((srv) => {
            const ensured = ensurePlaceIds({ days: [{ places: [srv] }] }).days[0].places[0];
            return [norm(ensured?.name), ensured];
          })
        );
        nextPlaces = effectivePlaces.map((cli) => {
          const hit = serverMap.get(norm(cli?.name));
          // ✅ append 금지: hit(서버) 우선으로 대체 + 정규화
          const replaced = ensurePlaceFields(
            hit ? { ...hit, gptOriginalName: normalizeHashtags(hit.gptOriginalName) }
                : { ...cli, gptOriginalName: normalizeHashtags(cli.gptOriginalName) },
            cli
          );
          return replaced;
        });
        // 최종 안전망(혹시라도 gptOriginalName에 공백/중복 남으면 정리)
        nextPlaces = nextPlaces.map(p => ({ ...p, gptOriginalName: normalizeHashtags(p.gptOriginalName) }));

        const merged = {
          ...draft,
          days: draft.days.map((d, i) =>
            i === idx ? { ...d, places: (nextPlaces.length ? nextPlaces : d.places), totalEstimatedCost: result.totalEstimatedCost } : d
          ),
        };
        setScheduleData(merged);
        setEditDraft(merged);
      } else if (Array.isArray(result)) {
        const serverMap = new Map(
          result.map((srv) => {
            const srvObj = typeof srv === 'string' ? { name: srv } : srv;
            const ensured = ensurePlaceIds({ days: [{ places: [srvObj] }] }).days[0].places[0];
            return [norm(ensured?.name), ensured];
          })
        );
        nextPlaces = effectivePlaces.map((cli) => {
          const hit = serverMap.get(norm(cli?.name));
          const replaced = ensurePlaceFields(
            hit ? { ...hit, gptOriginalName: normalizeHashtags(hit.gptOriginalName) }
                : { ...cli, gptOriginalName: normalizeHashtags(cli.gptOriginalName) },
            cli
          );
          return replaced;
        });
        nextPlaces = nextPlaces.map(p => ({ ...p, gptOriginalName: normalizeHashtags(p.gptOriginalName) }));

        const merged = {
          ...draft,
          days: draft.days.map((d, i) =>
            i === idx ? { ...d, places: (nextPlaces.length ? nextPlaces : d.places) } : d
          ),
        };
        setScheduleData(merged);
        setEditDraft(merged);
      } else {
        console.warn('[merge][unknown] result=', result);
      }

      setEditedPlaces(prev => { const n = { ...prev }; delete n[placeId]; return n; });
      setListVersion(v => v + 1);
    } catch (e) {
      console.warn('editSchedule 실패, 로컬 보강만 반영:', e?.message);
      setEditDraft(prev => {
        const d = JSON.parse(JSON.stringify(prev));
        d.days[idx].places = d.days[idx].places.map(p => ensurePlaceFields(p, p));
        d.days[idx].places = d.days[idx].places.map(p => ({ ...p, gptOriginalName: normalizeHashtags(p.gptOriginalName) }));
        setScheduleData(d);
        return d;
      });
    }
  };

  // ====== multi-day 저장 관련 유틸 (기존 유지) ======
  const DAY_INDEX_BASE = 0;
  const ENABLE_DAYINDEX_FALLBACK = true;

  async function postDays({ sid, draft, base = 0 }) {
    for (let i = 0; i < draft.days.length; i++) {
      const dayNames = draft.days[i].places.map(p => (p.name ?? '').trim()).filter(Boolean);
      const sendIndex = i + base;
      try {
        await editSchedule(dayNames, { scheduleId: sid, dayIndex: sendIndex });
      } catch (e) {
        console.warn(`[EditDone][postDays] day=${sendIndex} 실패:`, e?.message);
      }
    }
  }

  const waitServerConsistency = async (sid, expectedSig, maxTry = 6, delayMs = 250) => {
    for (let i = 0; i < maxTry; i++) {
      const fresh = await getScheduleDetail(sid);
      const ensured = ensurePlaceIds(fresh?.id ? fresh : { ...fresh, id: sid });
      const gotSig = signatureOf(ensured);
      if (gotSig && gotSig === expectedSig) return ensured;
      await new Promise(r => setTimeout(r, delayMs));
    }
    return null;
  };

  // ====== 저장(편집 완료) ======
  const onPressSave = () => { handleEditDone(); };

  const handleEditDone = async () => {
    try { Object.values(inputRefs.current || {}).forEach(r => r?.blur?.()); } catch {}
    if (!editDraft?.days?.length) {
      Alert.alert('오류', '편집본이 비어 있어 저장할 수 없습니다.');
      return;
    }
    const sid = getNumericScheduleId();
    if (!Number.isFinite(sid)) {
      Alert.alert('오류', '유효한 일정 ID가 없습니다.');
      return;
    }
    setIsRegenerating(true);
    const closeAllLoading = () => { setIsRegenerating(false); };

    // 입력 중 값 반영 + 빈 이름 제거
    const mergedDraft = JSON.parse(JSON.stringify(editDraft));
    for (let i = 0; i < mergedDraft.days.length; i++) {
      mergedDraft.days[i].places = mergedDraft.days[i].places
        .map(p => {
          const pending = (editedPlaces?.[p.id] ?? '').trim();
          const name = pending || p.name || '';
          return { ...p, name, gptOriginalName: normalizeHashtags(p.gptOriginalName) };
        })
        .filter(p => (p.name ?? '').trim().length > 0);
    }
    const expectedSig = signatureOf(mergedDraft);

    try {
      await saveCacheData(CACHE_KEYS.PLAN_EDITED, mergedDraft);

      await postDays({ sid, draft: mergedDraft, base: DAY_INDEX_BASE });
      let ensured = await waitServerConsistency(sid, expectedSig, 6, 250);
      if (!ensured && ENABLE_DAYINDEX_FALLBACK) {
        await postDays({ sid, draft: mergedDraft, base: DAY_INDEX_BASE === 0 ? 1 : 0 });
        ensured = await waitServerConsistency(sid, expectedSig, 6, 250);
      }

      const finalData = ensured || mergedDraft;
      setScheduleData(finalData);
      setEditDraft(finalData);
      setIsEditing(false);
      setOriginalScheduleData(null);

      try {
        await AsyncStorage.removeItem(CACHE_KEYS.PLAN_INITIAL);
        await AsyncStorage.removeItem(CACHE_KEYS.PLAN_EDITED);
      } catch {}

      lastSavedSigRef.current = signatureOf(finalData) || expectedSig;
      lastSavedAtRef.current = Date.now();

      DeviceEventEmitter.emit('TRIPS_UPDATED', { scheduleId: sid, ts: Date.now() });
      closeAllLoading();
    } catch (e) {
      console.warn('[EditDone] 전체 처리 실패:', e?.message);
      setScheduleData(editDraft);
      setIsEditing(false);
      setOriginalScheduleData(null);
      closeAllLoading();
    }
  };

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
                                // ✅ 렌더에서도 Set 유니크 처리 (서버가 중복 보내도 중복 노출 X)
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
                        <View style={styles.iconSlot}><MaterialCommunityIcons name="walk" size={normalize(17)} color="#6B7280" /></View>
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
                          // ✅ 읽기 모드 렌더도 유니크 처리
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

        {/* 하단 버튼들 (기존 유지) */}
        {isEditing ? (
          <View style={styles.fixedDoneButtonWrapper}>
            <TouchableOpacity style={styles.fixedDoneButton} onPress={onPressSave}>
              <Text style={styles.fixedDoneButtonText}>플랜 수정 완료</Text>
            </TouchableOpacity>
          </View>
        ) : (from === 'Home' || isReadOnly || isSaved) ? (
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
                          const fallback = /^[0-9]+$/.test(String(scheduleId ?? '')) ? Number(scheduleId) : null;
                          const finalId = Number.isFinite(numericId) ? numericId : fallback;
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
                    const params = await buildRecreateParams_();
                    const response = await regenerateSchedule(params);
                    if (response?.days?.length) {
                      const next = ensurePlaceIds(response);
                      setScheduleData(next);
                      setSelectedDayIndex(0);
                    }
                  } catch (err) {
                    console.error('재조회 실패:', err?.response?.data || err?.message);
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
                    const current = scheduleData?.id ? scheduleData : { ...(scheduleData || {}), id: uuid.v4() };
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
                            navigation.replace('PlannerResponse', { scheduleId: finalId, mode: 'read', from: 'PlannerCreate' });
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
    paddingVertical: 0,                 // 배경 제거 -> 여백도 최소화
    borderRadius: 0
  },
  regenerateButton: { backgroundColor: '#4F46E5', borderRadius: normalize(10), paddingVertical: normalize(12), alignItems: 'center', borderWidth: 1, borderColor: '#4F46E5' },
  regenerateButtonText: { color: '#fff', fontSize: normalize(16) },
  fixedDoneButtonWrapper: { position: 'absolute', bottom: normalize(5), left: normalize(20), right: normalize(20), backgroundColor: '#4F46E5', borderRadius: normalize(12), paddingVertical: normalize(14), alignItems: 'center' },
  fixedDoneButton: { width: '100%', alignItems: 'center' },
  fixedDoneButtonText: { color: '#fff', fontSize: normalize(18) },
});