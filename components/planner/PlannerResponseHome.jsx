import React, { useEffect, useState, useRef,useCallback  } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { getCacheData } from '../../caching/cacheService';
import { CACHE_KEYS } from '../../caching/cacheService';
import { saveCacheData } from '../../caching/cacheService';
import { editSchedule } from '../../api/planner_edit_request';
import { regenerateSchedule } from '../../api/planner_regenerate_request';
import { saveSchedule } from '../../api/planner_save_request';
import { deleteSchedule } from '../../api/planner_delete_request';
import { getScheduleDetail } from '../../api/MyPlanner_detail';
import { useRoute } from '@react-navigation/native';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '../../components/common/SplashScreen';
import { Modal } from 'react-native';
import { useLayoutEffect } from 'react';
import { Alert, InteractionManager, KeyboardAvoidingView, Platform } from 'react-native';
import { UIManager, findNodeHandle } from 'react-native';
import { MAIN_TAB_ID, defaultTabBarStyle } from '../../navigation/BottomTabNavigator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
}

const saveTripToList = async (tripData) => {
  try {
    const existing = await AsyncStorage.getItem('MY_TRIPS');
    let trips = [];
    if (existing) trips = JSON.parse(existing);
    const idx = trips.findIndex(
      t => t.title === tripData.title && t.startDate === tripData.startDate
    );
    if (idx !== -1) trips[idx] = tripData;
    else trips.push(tripData);
    await AsyncStorage.setItem('MY_TRIPS', JSON.stringify(trips));
  } catch (e) {
    console.warn('저장 실패:', e);
  }
};

/* ============================
   🧪 MOCK DATA (주석 처리)
============================ */
/*
const MOCK_SCHEDULE = {
  title: '🧪 목데이터 플랜',
  startDate: '2025-07-01',
  endDate: '2025-07-03',
  days: [
    {
      places: [
        {
          id: uuid.v4(),
          name: '목 장소 1',
          type: '관광',
          estimatedCost: 0,
          gptOriginalName: 'mock-tag',
          fromPrevious: { car: 0, publicTransport: 0, walk: 0 },
        },
        {
          id: uuid.v4(),
          name: '목 장소 2',
          type: '식사',
          estimatedCost: 10000,
          gptOriginalName: 'mock-food',
          fromPrevious: { car: 5, publicTransport: 8, walk: 12 },
        },
      ],
    },
  ],
};
*/

export default function PlannerResponseHome() {
  function diagTransportInfo(schedule) {
  try {
    if (!schedule?.days?.length) {
      console.log('[diag][transport] days 없음');
      return;
    }
    let total = 0, withFP = 0, withoutFP = 0;
    const samples = [];

    schedule.days.forEach((day, dIdx) => {
      (day?.places ?? []).forEach((p, pIdx) => {
        total += 1;
        const has = !!p?.fromPrevious;
        if (has) withFP += 1; else withoutFP += 1;

        // 앞쪽 일부 샘플만 포착
        if (samples.length < 5) {
          samples.push({
            day: dIdx + 1,
            idx: pIdx,
            name: p?.name,
            fromPrevious: p?.fromPrevious ?? null,
          });
        }
      });
    });

    console.log('[diag][transport] 총 place 수:', total);
  } catch (e) {
    console.log('[diag][transport] 진단 중 오류:', e?.message);
  }
}
  const navigation = useNavigation();
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
    // 편집 중에는 건드리지 않음
    if (isEditing) return;

    const id = getNumericScheduleId();
    if (Number.isFinite(id)) {
      // 화면으로 다시 돌아오면 최신 서버 데이터로 동기화
      loadDetail(id);
    }
  }, [isEditing])
);

  // ✅ C. 진단용 로그
  useLayoutEffect(() => {
    const p1 = navigation.getParent?.(MAIN_TAB_ID);
    const p2 = navigation.getParent?.();
    console.log('[tab-parent]', Boolean(p1), Boolean(p2));
  }, [navigation]);


  const route = useRoute?.() || { params: {} };
  const params = route?.params ?? {};
  const { from = 'mock', mode = 'draft', scheduleId, mock } = params;
  const isMock = mock === true;
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const initialEditing = route.params?.mode === 'edit';
  const [isEditing, setIsEditing] = useState(!!initialEditing);
  const [newlyAddedPlaceId, setNewlyAddedPlaceId] = useState(null);
  const [editedPlaces, setEditedPlaces] = useState({});
  const [editedPlaceId, setEditedPlaceId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const isReadOnly = mode === 'read'; // read는 정말 '저장본'만
  // [ADDED] 삭제용 숫자 ID 캐시
  const [numericScheduleId, setNumericScheduleId] = useState(null);
  const showEditDeleteButtons =
    (from === 'Home' && !isMock) ||
    (isReadOnly && !isMock) ||
    isSaved;
  // (기존)
const [isRegenerating, setIsRegenerating] = useState(false);

// [ADDED] 저장 전용 스플래시 상태 + 타이머 (무한 로딩 방지)
const [isSaving, setIsSaving] = useState(false);
const savingTimerRef = useRef(null);

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

// 언마운트 시 타이머 정리
useEffect(() => () => {
  try { if (savingTimerRef.current) clearTimeout(savingTimerRef.current); } catch {}
}, []);
  const scrollRef = useRef();
  const listRef = useRef(null);
  const [newlyAddedIndex, setNewlyAddedIndex] = useState(-1);
  const [originalScheduleData, setOriginalScheduleData] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const inputRefs = useRef({});
  const placeRefs = useRef({});
  const cardRefs  = useRef({});
  const [scheduleData, setScheduleData] = useState(null);
const [draftMerged, setDraftMerged] = useState(null);
const [version, setVersion] = useState(0);
const latestScheduleRef = useRef(null);
const [listVersion, setListVersion] = useState(0); // [ADDED] 리스트 강제 리렌더 키

const onPressSave = () => {
  console.log('[EditDone] pressed');
  handleEditDone();
};

useEffect(() => {
  if (!newlyAddedPlaceId) return;
  requestAnimationFrame(() => {
    const input = inputRefs.current[newlyAddedPlaceId];
    input?.focus?.();
  });
}, [newlyAddedPlaceId]);

useEffect(() => { latestScheduleRef.current = scheduleData; }, [scheduleData]);

  const resolveScheduleId = () => {
    return (
      scheduleData?.id ??
      scheduleData?.scheduleId ??
      route?.params?.scheduleId ??
      null
    );
  };

  // ref setter
  const setInputRef = (id) => (ref) => { if (ref) inputRefs.current[id] = ref; };
  const setCardRef  = (id) => (ref) => { if (ref) cardRefs.current[id]  = ref; };

  const focusAndScroll = (placeId, index) => {
    const input = inputRefs.current[placeId];
    const card  = cardRefs.current[placeId];

    try {
      listRef.current?.scrollToIndex?.({
        index,
        animated: true,
        viewPosition: 0.2,
      });
    } catch (e) {
      if (card && listRef.current) {
        const scrollNode =
          listRef.current?.getScrollableNode?.() ?? findNodeHandle(listRef.current);

        UIManager.measureLayout(
          findNodeHandle(card),
          scrollNode,
          () => {},
          (x, y) => {
            listRef.current?.scrollToOffset?.({
              offset: Math.max(0, y - 80),
              animated: true,
            });
          }
        );
      }
    }

    requestAnimationFrame(() => {
      input?.focus?.();
    });
  };

  async function loadDetail(scheduleIdRaw) {
   const parsedId = coerceNumericScheduleId(scheduleIdRaw);
   if (!Number.isFinite(parsedId)) {
     console.warn('[detail] 잘못된 scheduleId(숫자 아님):', scheduleIdRaw);
     Alert.alert('오류', '올바르지 않은 일정 ID입니다.');
     return;
   }
   try {
     const detail = await getScheduleDetail(parsedId);
      setScheduleData(ensurePlaceIds(detail)); // 화면 상태 갱신
    } catch (e) {
      if (e?.code === 'NO_TOKEN') {
        Alert.alert('로그인이 필요합니다', '다시 로그인 후 이용해 주세요.');
        return;
      }
      console.warn('[detail] 조회 실패:', e?.message);
      Alert.alert('불러오기 실패', '일정 정보를 불러오지 못했습니다.');
    }
  }
  useEffect(() => {
  const raw = route.params?.scheduleId;
  const num = coerceNumericScheduleId(raw);
  if (Number.isFinite(num)) {
    loadDetail(num);
  } else if (raw != null) {
    console.warn('[detail] 잘못된 scheduleId(숫자 아님):', raw);
    Alert.alert('오류', '올바르지 않은 일정 ID입니다.');
  }
}, [route.params?.scheduleId]);


  // ===========================================
  // [PATCH] 숫자형 scheduleId 추출 헬퍼 보강
const extractNumericScheduleId = (obj) => {
  if (!obj) return null;

  // 서버가 내려줄 수 있는 다양한 후보 키를 폭넓게 커버
  const candidates = [
    obj.scheduleId, obj.schedule_id,
    obj.scheduleNo, obj.schedule_no,
    obj.scheduleIdx, obj.schedule_idx,
    obj.serverId,   obj.server_id,
    obj.serverNo,   obj.server_no,
    obj.id, // 숫자면 통과, UUID면 무시됨
  ];

  for (const v of candidates) {
    // 문자열 안에 숫자가 섞여 있어도 첫 숫자 토큰만 뽑아서 시도
    const s = String(v ?? '').match(/\d+/)?.[0];
    if (s && /^[0-9]+$/.test(s)) return Number(s);
  }
  return null;
};

// ✅ 무엇이 와도 숫자형 scheduleId로 강제 변환 (최상위 스코프!)
const coerceNumericScheduleId = (raw) => {
  if (raw == null) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const n = Number(raw.match(/\d+/)?.[0]);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof raw === 'object') {
    return extractNumericScheduleId(raw);
  }
  return null;
};

// ===========================================
// ✅ 숫자형 scheduleId 동기 리졸버 (캐시/로컬 우선, 네트워크 X)
// ===========================================
const getNumericScheduleId = () => {
  if (Number.isFinite(numericScheduleId)) return numericScheduleId;

  const fromState = extractNumericScheduleId(scheduleData);
  if (Number.isFinite(fromState)) return fromState;

  const fromRoute = coerceNumericScheduleId(route?.params?.scheduleId ?? route?.params);
  if (Number.isFinite(fromRoute)) return fromRoute;

  return null;
};

  useEffect(() => {
    if (isEditing && scheduleData && !editDraft) {
      setOriginalScheduleData(JSON.parse(JSON.stringify(scheduleData)));
      setEditDraft(JSON.parse(JSON.stringify(scheduleData)));
    }
  }, [isEditing, scheduleData, editDraft]);


  useEffect(() => {
    if (!isEditing && scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [selectedDayIndex, isEditing]);

  const ensurePlaceIds = (data) => ({
  ...data,
  days: (data?.days ?? []).map(day => ({
    ...day,
    places: (day?.places ?? []).map(place => {
      // 🔁 백엔드 → 프론트 렌더링용 교통 시간 매핑
      const car = Number.isFinite(Number(place?.driveTime)) ? Number(place.driveTime) : 0;
      const publicTransport = Number.isFinite(Number(place?.transitTime)) ? Number(place.transitTime) : 0;
      const walk = Number.isFinite(Number(place?.walkTime)) ? Number(place.walkTime) : 0;

      return {
        ...place,
        id: place?.id ? String(place.id) : uuid.v4(),
        fromPrevious: place?.fromPrevious ?? { car, publicTransport, walk },
        // (선택) 서버 hashtag → 화면 gptOriginalName 키 통일
        gptOriginalName: place?.gptOriginalName ?? place?.hashtag ?? '',
      };
    }),
  })),
});

  // [ADDED] 모든 장소에 필수 필드 보강
  function ensurePlaceFields(place = {}, prev = {}) {
    const name = (place.name ?? prev.name ?? '').trim();
    return {
      ...prev,
      ...place,
      name,
      type: place.type ?? prev.type ?? '',
      gptOriginalName: place.gptOriginalName ?? prev.gptOriginalName ?? '',
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

  /* ============================
     초기 데이터 로드
     (기존 mock 강제 삽입은 주석 처리)
  ============================ */
  useEffect(() => {
  const loadData = async () => {
    try {
      const rawId = route.params?.scheduleId ?? scheduleId;
const parsedId = coerceNumericScheduleId(rawId);

      // ✅ 홈(Home) / 내 여행(MyTrips) 카드에서 들어올 때는 항상 서버 우선
      const comeFromList = from === 'Home' || from === 'MyTrips';

      if (comeFromList && Number.isFinite(parsedId)) {
        // 📡 서버에서 최신 일정 불러오기
        const detail = await getScheduleDetail(parsedId);
        const detailWithId = detail?.id ? detail : { ...detail, id: parsedId };
        const ensured = ensurePlaceIds(detailWithId);

        setScheduleData(ensured);
        diagTransportInfo(ensured);

        const numFromDetail = extractNumericScheduleId(detailWithId);
        if (Number.isFinite(numFromDetail)) setNumericScheduleId(numFromDetail);
        return; // 🔚 서버 우선 로직 끝
      }

      // ✅ 그 외 (플랜 생성 직후 등)에서는 캐시 우선
      const cached = await getCacheData(CACHE_KEYS.PLAN_INITIAL);
      if (cached) {
        const ensured = ensurePlaceIds(cached);
        setScheduleData(ensured);
        diagTransportInfo(ensured);

        const numCached = extractNumericScheduleId(cached);
        if (Number.isFinite(numCached)) setNumericScheduleId(numCached);
      } else if (Number.isFinite(parsedId)) {
        const detail = await getScheduleDetail(parsedId);
        const detailWithId = detail?.id ? detail : { ...detail, id: parsedId };
        const ensured = ensurePlaceIds(detailWithId);

        setScheduleData(ensured);
        diagTransportInfo(ensured);

        const numFromDetail = extractNumericScheduleId(detailWithId);
        if (Number.isFinite(numFromDetail)) setNumericScheduleId(numFromDetail);
      }
    } catch (err) {
      console.error('❌ 초기 데이터 로드 실패', err);
    }
  };

  loadData();
  // 👇 from, scheduleId 값이 바뀌면 다시 실행되도록
}, [from, route.params?.scheduleId, scheduleId]);

  useEffect(() => {
  console.log('🔥 PlannerResponseHome mounted!', route.params);
  const fetchDetail = async () => {
    const num = coerceNumericScheduleId(scheduleId);
    if (Number.isFinite(num)) {
      try {
        const detail = await getScheduleDetail(num);
        let detailWithId = detail?.id ? detail : { ...detail, id: num };
        const ensured = ensurePlaceIds(detailWithId);
        setScheduleData(ensured);
        diagTransportInfo(ensured);

        const n = extractNumericScheduleId(detailWithId);
        if (Number.isFinite(n)) setNumericScheduleId(n);
      } catch (e) {
        console.warn('[detail] 조회 실패:', e?.message);
        Alert.alert('불러오기 실패', '네트워크가 불안정하거나 서버 응답이 늦습니다.\n잠시 후 다시 시도해 주세요.');
      }
    }
  };
  fetchDetail();
}, [route.params?.scheduleId]);

const dayIdxRef = useRef(selectedDayIndex);
useEffect(() => { dayIdxRef.current = selectedDayIndex; }, [selectedDayIndex]);

  // [PATCH] 해시태그(gptOriginalName) / 교통정보(fromPrevious) 누락 보정
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
    console.log('[patch] 누락된 gptOriginalName/fromPrevious 필드 감지 → ensurePlaceIds로 보강');
    const ensured = ensurePlaceIds(scheduleData);
    setScheduleData(ensured);
  }
}, [scheduleData]);

  // ✅ 재조회 파라미터 빌더 (캐시 우선 → 현재 화면 보조)
  const buildRecreateParams = async () => {
    let base = null;
    try {
      base = await getCacheData(CACHE_KEYS.PLAN_INITIAL);
    } catch (_) {}

    const src = base || scheduleData || {};
    const startDate   = src.startDate   || scheduleData?.startDate || '';
    const endDate     = src.endDate     || scheduleData?.endDate   || '';
    const destination = src.destination || scheduleData?.destination || 'JEJU_SI';
    const mbti        = (src.mbti || scheduleData?.mbti || 'ENTJ').toUpperCase();
    const travelStyle = (src.travelStyle || scheduleData?.travelStyle || 'ACTIVITY').toUpperCase();
    const peopleGroup = (src.peopleGroup || scheduleData?.peopleGroup || 'SOLO').toUpperCase();
    const budget      = Number(src.budget ?? scheduleData?.budget ?? 0);

    const excludedNames = (scheduleData?.days ?? [])
      .flatMap(d => (d?.places ?? []).map(p => p?.name).filter(Boolean));

    return {
      startDate,
      endDate,
      destination,
      mbti,
      travelStyle,
      peopleGroup,
      budget,
      excludedNames,
    };
  };

  if (!scheduleData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <Text style={styles.loadingText}>⏳ 데이터를 불러오는 중입니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 편집모드면 임시본에서, 아니면 원본에서 읽어옴
const selectedDay = isEditing
  ? editDraft?.days[selectedDayIndex]
  : scheduleData.days[selectedDayIndex];
const places = selectedDay?.places ?? [];
console.log('[RENDER][day=%d][editing=%s] places(%d): %o',
  selectedDayIndex, isEditing, places.length, places.map(p => p?.name));


  // 수정모드 진입
  const enterEditMode = () => {
    setOriginalScheduleData(JSON.parse(JSON.stringify(scheduleData))); // 원본 백업
    setEditDraft(JSON.parse(JSON.stringify(scheduleData))); // 편집본 생성
    setIsEditing(true);
  };

  // 뒤로가기
  const handleBack = () => {
    if (isEditing) {
      setEditDraft(null);
      setIsEditing(false);
      return;
    }
    const tabNav = navigation.getParent();

    if (from === 'Home') {
      if (tabNav?.reset) {
        tabNav.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        navigation.navigate('Home');
      }
    } else if (tabNav && tabNav.navigate) {
      tabNav.navigate('MyTrips');
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MyTrips');
    }
  };

  const handleDragEnd = ({ data }) => {
    console.log('[DRAG][before] len=%d order=%o', places.length, places.map(p=>p.id));
   setEditDraft(prev => {
     const updatedDays = prev.days.map((day, idx) =>
       idx === selectedDayIndex ? { ...day, places: [...data] } : day
     );
     return { ...prev, days: updatedDays };
   });
   setListVersion(v => v + 1);
   console.log('[DRAG][after]  len=%d order=%o', data.length, data.map(p=>p.id));
 };


  // 장소 추가
const handleAddPlace = (insertIndex) => {
  if (newlyAddedPlaceId) return;
  setEditDraft(prev => {
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
console.log('[ADD] day=%d insertAt=%d -> before=%d after=%d newId=%s',
     selectedDayIndex, insertIndex + 1, currentPlaces.length, updatedPlaces.length, newPlaceId);
    const updatedDays = prev.days.map((day, i) =>
      i === selectedDayIndex ? { ...day, places: updatedPlaces } : day
    );
    setNewlyAddedPlaceId(newPlaceId);
    setNewlyAddedIndex(insertIndex + 1);
    setEditedPlaceId(newPlaceId);
    setEditedPlaces(p => ({ ...p, [newPlaceId]: '' }));
    return { ...prev, days: updatedDays };
  });
  setListVersion(v => v + 1); // [ADDED]
  console.log('[ADD][post] places(len) =',
   (isEditing ? editDraft : scheduleData)?.days?.[selectedDayIndex]?.places?.length);
};

  // 삭제
const handleDeletePlace = (placeId) => {
  setEditDraft(prev => {
    const currentPlaces = [...prev.days[selectedDayIndex].places];
    const updatedPlaces = currentPlaces.filter((p) => p.id !== placeId);
    console.log('[DEL] day=%d placeId=%s -> before=%d after=%d',
     selectedDayIndex, placeId, currentPlaces.length, updatedPlaces.length);
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
  setListVersion(v => v + 1); // [ADDED]
  console.log('[DEL][post] places(len) =',
   (isEditing ? editDraft : scheduleData)?.days?.[selectedDayIndex]?.places?.length);
};

  // 인풋 편집 완료 (이름만 갱신 + 서버 반영 + 필수 필드 보강)
const handleEndEditing = async (placeId) => {
  // 0) 입력값 읽기
  const newName = (editedPlaces[placeId] ?? '').trim();
  if (!newName) {
    Alert.alert('입력 필요', '장소명을 입력해주세요.');
    return;
  }

  // 1) "현재 화면 상태"를 기준으로 즉시 로컬 반영 + API에 쓸 draft를 동기 생성
  //    (setState 비동기성으로 인한 레이스 방지)
  const idx = dayIdxRef.current; // 🔒 고정
  const base = editDraft ?? scheduleData;
  const draft = JSON.parse(JSON.stringify(base));

  // 화면 기준(editedPlaces 오버레이 포함)으로 places 갱신본 만들기
  const effectivePlaces = draft.days[idx].places.map((p) => {
    if (p.id === placeId) return { ...p, name: newName };
    // 아직 입력창에 남아있는 값이 있으면 그걸 우선
    const overlay = editedPlaces[p.id];
    return overlay != null ? { ...p, name: overlay } : p;
  });

  draft.days[idx].places = effectivePlaces; // 로컬 적용본

  // 즉시 화면 반영(사용자 체감용)
  setEditDraft(draft);
  setScheduleData(draft);

  // 2) 서버 요청용 이름 배열 (빈 문자열 제외)
  const placeNames = effectivePlaces
    .map((p) => (p?.name ?? '').trim())
    .filter(Boolean);

  // 이름이 하나도 없으면 서버 호출 무의미 → 여기서 종료
  if (placeNames.length === 0) {
    setEditedPlaces(prev => { const n = { ...prev }; delete n[placeId]; return n; });
    setListVersion(v => v + 1);
    return;
  }

  // 3) 서버 호출
  const numericId = getNumericScheduleId();
  const sid = numericId ?? resolveScheduleId();

  console.log('[editSchedule][REQ]', JSON.stringify({
    scheduleId: sid, dayIndex: idx, namesCount: placeNames.length, names: placeNames
  }));

  try {
    const result = await editSchedule(placeNames, { scheduleId: sid, dayIndex: idx });
    console.log('[editSchedule][RES:ok]', { keys: Object.keys(result || {}) });

    // 4) 병합: 이름-매칭(공백 무시) + 필수필드 보강
    const norm = (s) => (s ?? '').replace(/\s+/g, '').trim();
    let nextPlaces = effectivePlaces; // 기본은 방금 반영한 로컬본(안전)

    if (result?.places && result.totalEstimatedCost !== undefined) {
      const serverMap = new Map(
        result.places.map((srv) => {
          const ensured = ensurePlaceIds({ days: [{ places: [srv] }] }).days[0].places[0];
          return [norm(ensured?.name), ensured];
        })
      );

      // 기존 순서 유지 + 이름 일치 시 서버값으로 덮어쓰기
      nextPlaces = effectivePlaces.map((cli) => {
        const hit = serverMap.get(norm(cli?.name));
        return ensurePlaceFields(hit ? hit : cli, cli);
      });

      // 🚫 방어: 서버가 빈 places를 주면 덮어쓰지 않음
      const merged = {
        ...draft,
        days: draft.days.map((d, i) =>
          i === idx
            ? {
                ...d,
                places: (Array.isArray(nextPlaces) && nextPlaces.length > 0) ? nextPlaces : d.places,
                totalEstimatedCost: result.totalEstimatedCost,
              }
            : d
        ),
      };
      setScheduleData(merged);
      setEditDraft(merged);
      console.log('[merge][object] totalEstimatedCost=%s places=%d',
        result.totalEstimatedCost,
        merged?.days?.[idx]?.places?.length ?? -1
      );

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
        return ensurePlaceFields(hit ? hit : cli, cli);
      });

      const merged = {
        ...draft,
        days: draft.days.map((d, i) =>
          i === idx
            ? {
                ...d,
                places: (Array.isArray(nextPlaces) && nextPlaces.length > 0) ? nextPlaces : d.places,
              }
            : d
        ),
      };
      setScheduleData(merged);
      setEditDraft(merged);
      console.log('[merge][array] places=%d', merged?.days?.[idx]?.places?.length ?? -1);
    } else {
      console.warn('[merge][unknown] result=', result);
      // unknown → draft 그대로 유지(이미 1단계에서 반영함)
    }

    // 5) 입력 오버레이 제거 + 리렌더
    setEditedPlaces(prev => { const n = { ...prev }; delete n[placeId]; return n; });
    setListVersion(v => v + 1);
    console.log('[END][done] places(len)=',
      (editDraft ?? scheduleData)?.days?.[idx]?.places?.length ?? -1
    );
  } catch (e) {
    console.warn('editSchedule 실패, 로컬 보강만 반영:', e?.message);
    // 실패 시에도 최소 필드 보강으로 안정화
    setEditDraft(prev => {
      const d = JSON.parse(JSON.stringify(prev));
      d.days[idx].places = d.days[idx].places.map(p => ensurePlaceFields(p, p));
      setScheduleData(d);
      return d;
    });
  }
};

  // ✨ 수정 완료
const handleEditDone = async () => {
  // 0) 모든 입력창 blur
  try {
    Object.values(inputRefs.current || {}).forEach(r => r?.blur?.());
  } catch {}

  // [GUARD-1] 편집본/선택 일자 유효성
  if (!editDraft?.days?.[selectedDayIndex]?.places) {
    Alert.alert('오류', '편집본이 비어 있어 저장할 수 없습니다.');
    return;
  }

  // [GUARD-2] 빈 장소 이름 존재 여부 (빈 항목 있으면 여기서 종료)
  const emptyPlaces = draftMerged.days[selectedDayIndex].places
    .filter(p => !p.name?.trim());
  if (emptyPlaces.length > 0) {
    Alert.alert('빈 장소가 있어요', '장소명을 입력하지 않은 항목이 있어요. 수정 후 저장해주세요');
    return;
  }

  // [ADDED] 저장 스플래시 시작 (무한로딩 방지 타이머 포함)
  openSaving();

  await new Promise(r => setTimeout(r, 0));

  let refreshed = false;
  let freshEnsured = null;

  setNewlyAddedPlaceId(null);
  setNewlyAddedIndex(-1);
  setEditedPlaces({});

  // 1) ‘입력 중인 값’(editedPlaces)을 편집본에 강제 반영
  const mergedDraft = JSON.parse(JSON.stringify(editDraft));
  mergedDraft.days[selectedDayIndex].places =
    mergedDraft.days[selectedDayIndex].places.map(p => {
      const pending = (editedPlaces?.[p.id] ?? '').trim();
      return pending ? { ...p, name: pending } : p;
    });

  const uniq = (arr) => Array.from(new Set(arr.map(s => (s ?? '').trim()).filter(Boolean)));
  const sid = getNumericScheduleId();

  // 저장/재조회 진행
  setIsRegenerating(true);

  try {
    await saveCacheData(CACHE_KEYS.PLAN_EDITED, editDraft);

    // 2) 모든 Day를 dayIndex 별로 반영 (0-based 우선)
    if (Number.isFinite(sid)) {
      for (let i = 0; i < (mergedDraft.days?.length ?? 0); i++) {
        const dayNames = uniq((mergedDraft.days[i]?.places ?? []).map(p => p?.name));
        if (!dayNames.length) continue;
        await editSchedule(dayNames, { scheduleId: sid, dayIndex: i });
      }

      // ★★★ 저장 직후 상세 재조회로 화면 상태 교체
      const fresh = await getScheduleDetail(sid);

      // 화면 소스 교체
      setScheduleData(fresh);
      setDraftMerged(fresh);

      // 이전 캐시가 다시 덮어쓰는 걸 방지
      await saveCacheData(CACHE_KEYS.PLAN_INITIAL, null);
      await saveCacheData(CACHE_KEYS.PLAN_EDITED, null);

      // 리스트 강제 리렌더
      setVersion(v => v + 1);

      // 서버 계산값 보강
      freshEnsured = ensurePlaceIds(fresh);
      setScheduleData(freshEnsured);
      setEditDraft(freshEnsured);
      refreshed = true;

      // ✅ 검증(읽기 전용)
      const norm = (s) => (s ?? '').replace(/\s+/g, '').trim();
      const want = Array.from(new Set((mergedDraft.days[selectedDayIndex]?.places ?? [])
        .map(p => norm(p?.name)).filter(Boolean)));
      const got  = Array.from(new Set((freshEnsured?.days?.[selectedDayIndex]?.places ?? [])
        .map(p => norm(p?.name)).filter(Boolean)));
      const missing = want.filter(n => !new Set(got).has(n));
      if (missing.length) {
        console.warn('[EditDone][verify] server missing:', missing);
        // 필요 시 Alert 등 추가 가능
      }
    } else {
      console.warn('[EditDone] scheduleId 없음 → 서버 동기화 생략');
      setScheduleData(editDraft); // 서버 호출을 못하면 편집본 유지
    }

    // 편집 종료 상태 정리
    setIsEditing(false);
    setOriginalScheduleData(null);

    // 4) 캐시 무효화 + 홈/내여행 목록 갱신
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.PLAN_INITIAL);
      await new Promise((resolve) =>
        InteractionManager.runAfterInteractions(() => resolve())
      );

      const base = refreshed ? freshEnsured : (latestScheduleRef.current || scheduleData || {});
      const current = base?.id ? base : { ...(base || {}), id: uuid.v4() };
      await saveTripToList(current);

      console.log('[EditDone] PLAN_INITIAL 제거 및 MY_TRIPS 갱신 완료');
    } catch (e) {
      console.warn('[EditDone] 캐시/목록 갱신 실패:', e?.message || e);
    }

  } catch (e) {
    console.warn('⚠️ PLAN_EDITED 캐시 저장 or API 호출 실패:', e);
    setScheduleData(editDraft); // 실패 시 화면은 편집본 유지
  } finally {
    // ✅ 어떤 경로로든 모달/플래그를 반드시 종료
    setIsRegenerating(false);
    closeSaving();
    setIsEditing(false);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: normalize(16),
          paddingVertical: normalize(12),
        }}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons
              name="chevron-back"
              size={24}
              color="#111111"
              style={{ marginTop: -12 }}
            />
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
          <View style={{
            alignItems: 'center',
            backgroundColor: '#FAFAFA',
            paddingVertical: normalize(10)
          }}>
            <View style={styles.tabBox}>
              <Text style={[styles.tabText, styles.tabTextSelected]}>
                Day - {selectedDayIndex + 1}
              </Text>
              <View style={styles.activeBar} />
            </View>
          </View>
        ) : (
          <View style={styles.tabScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabContainer}
            >
              {scheduleData.days.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => !isEditing && setSelectedDayIndex(idx)}
                  disabled={isEditing}
                >
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
                        {/* 드래그 아이콘 */}
                        <TouchableOpacity
                          style={styles.dragHandle}
                          onLongPress={drag}
                          delayLongPress={100}
                        >
                          <Ionicons name="reorder-two-outline" size={normalize(30)} color={place.type === '식사' ? '#1270B0' : '#4F46E5'} />
                        </TouchableOpacity>
                        {/* 삭제 버튼 */}
                        <TouchableOpacity
                          style={{
                            position: 'absolute',
                            top: normalize(25),
                            right: 0,
                            backgroundColor: '#F87171',
                            borderRadius: normalize(20),
                            padding: normalize(4),
                            zIndex: 10,
                          }}
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
                              onChangeText={(text) =>
                                setEditedPlaces((prev) => ({ ...prev, [place.id]: text }))
                              }
                              onEndEditing={() => {
                                handleEndEditing(place.id);
                                setEditedPlaceId(null);
                              }}
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
                                <Text style={styles.keywords}>#{place.gptOriginalName}</Text>
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
                        marginBottom: currentIndex === places.length - 1
                          ? normalize(28)
                          : normalize(10),
                        alignSelf: 'flex-start',
                        width: '50%',
                        marginLeft: normalize(90),
                        opacity: newlyAddedPlaceId ? 0.5 : 1,
                      }}
                      disabled={!!newlyAddedPlaceId}
                      onPress={() => handleAddPlace(currentIndex)}
                    >
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: normalize(15),
                          textAlign: 'center',
                          lineHeight: normalize(20),
                        }}
                      >
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
              contentContainerStyle={{ paddingBottom: normalize(160, 'height') }}
            >
              {places.map((place, idx) => (
                <View key={place.id ? String(place.id) : `temp-${idx}`}>
                  {/* 교통정보 (맨 위 카드 제외) */}
                  {idx !== 0 && place.fromPrevious && (
                    <View style={styles.transportRow}>
                      <View style={styles.transportItem}>
                        <Ionicons name="car-outline" size={normalize(19)} color="#6B7280" style={{ marginRight: normalize(-10) }}/>
                        <Text style={styles.transportTextss}>{place.fromPrevious.car}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <Ionicons name="bus-outline" size={normalize(17)} color="#6B7280" />
                        <Text style={styles.transportText}>{place.fromPrevious.publicTransport}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <MaterialCommunityIcons name="walk" size={normalize(17)} color="#6B7280" style={{ marginRight: normalize(30) }}/>
                        <Text style={styles.transportTexts}>{place.fromPrevious.walk}분</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.placeRow}>
                    <View style={styles.timeline}>
                      <View style={[
                        styles.dot,
                        { backgroundColor: place.type === '식사' ? '#1270B0' : '#4F46E5' },
                        { width: normalize(20), height: normalize(20), borderRadius: normalize(10), top: normalize(40) }
                      ]} />
                      {idx !== places.length - 1 && <View style={[styles.verticalLine, { left: normalize(13), width: normalize(4), height: normalize(330, 'height') }]} />}
                    </View>

                    <View style={styles.placeContent}>
                      <TouchableOpacity
                        style={styles.placeCard}
                        onPress={() => navigation.navigate('PlaceDetail', { place })}
                      >
                        <View style={styles.placeHeader}>
                          <Text style={styles.placeName}>{place.name}</Text>
                          <Text style={styles.placeCost}>
                            {place.estimatedCost === 0 ? '무료' : `${place.estimatedCost?.toLocaleString()}원`}
                          </Text>
                        </View>
                        <Text style={styles.placeType}>{place.type}</Text>
                        {place.gptOriginalName && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
                            {place.gptOriginalName.split(' ').map((tag, i) => (
                              <Text
                                key={i}
                                style={{
                                  color: '#606060',
                                  fontSize: 14,
                                  marginRight: 4,
                                  fontWeight: '400',
                                  lineHeight: 19,
                                }}
                              >
                                #{tag}
                              </Text>
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 마지막 카드라면 교통정보를 아래 한 번 더 (마지막 day 제외) */}
                  {idx === places.length - 1 && place.fromPrevious && selectedDayIndex !== scheduleData.days.length - 1 && (
                    <View style={styles.transportRow}>
                      <View style={styles.transportItem}>
                        <Ionicons name="car-outline" size={normalize(19)} color="#6B7280" style={{ marginRight: normalize(-10)}}/>
                        <Text style={styles.transportTextss}>{place.fromPrevious.car}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <Ionicons name="bus-outline" size={normalize(17)} color="#6B7280" />
                        <Text style={styles.transportText}>{place.fromPrevious.publicTransport}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <MaterialCommunityIcons name="walk" size={normalize(17)} color="#6B7280" style={{ marginRight: normalize(30) }}/>
                        <Text style={styles.transportTexts}>{place.fromPrevious.walk}분</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 하단 버튼 */}
        {isEditing ? (
          <View style={styles.fixedDoneButtonWrapper}>
            <TouchableOpacity style={styles.fixedDoneButton} onPress={onPressSave}>
              <Text style={styles.fixedDoneButtonText}>플랜 수정 완료</Text>
            </TouchableOpacity>
          </View>
        ) : (from === 'Home' || isReadOnly || isSaved) ? (
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={[
                styles.editButton,
                { flex: 1, marginRight: normalize(8), backgroundColor: '#fff', borderColor: '#F97575' }
              ]}
              onPress={() => {
                console.log('[UI] delete button tapped');
                Alert.alert(
                  '플랜 삭제',
                  '정말로 이 여행 플랜을 삭제하시겠습니까?',
                  [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '삭제',
                      style: 'destructive',
                      onPress: async () => {
                        console.log('[UI] alert destructive tapped');
                        try {
                          setIsDeleting(true);

                          // 동기 리졸버로 숫자 ID 확보
                          const numericId = getNumericScheduleId();
                          const fallback =
                            /^[0-9]+$/.test(String(scheduleId ?? '')) ? Number(scheduleId) : null;

                          const finalId = Number.isFinite(numericId) ? numericId : fallback;
                          console.log('[delete] finalId =', finalId);

                          if (!Number.isFinite(finalId)) {
                            setIsDeleting(false);
                            Alert.alert('삭제 불가', '삭제할 숫자 ID를 찾을 수 없습니다.');
                            return;
                          }

                          console.log('🗑️ call deleteSchedule(', finalId, ')');
                          await deleteSchedule(finalId);
                          console.log('✅ deleteSchedule success');

                          setIsDeleting(false);
                          if (navigation.canGoBack()) navigation.goBack();
                          else navigation.navigate('MyTrips');
                        } catch (e) {
                          console.log('[delete] failed:', e?.message);
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
              <TouchableOpacity
                style={[styles.editButton, { marginRight: normalize(2) }]}
                onPress={enterEditMode}
              >
                <Text style={styles.editButtonText}>플랜 수정</Text>
              </TouchableOpacity>

              {/* ======================================
                  플랜 전체 재조회 → 실제 API 연결
                 ====================================== */}
              <TouchableOpacity
                style={[styles.saveButton, { marginLeft: normalize(8) }]}
                onPress={async () => {
                  try {
                    setIsRegenerating(true);

                    // ✅ 실제 API 호출
                    const params = await buildRecreateParams();
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
              {/* 내 여행으로 저장 (현재 로컬 저장 동작 유지) */}
              <TouchableOpacity
  style={styles.regenerateButton}
  onPress={async () => {
    try {
      console.log('LOG  [save] 내 여행으로 저장 시도');

      // 1) 현재 스케줄 객체 정리 (id 없으면 로컬 uuid 부여) — scheduleData undefined 보호
      const current =
        scheduleData?.id
          ? scheduleData
          : { ...(scheduleData || {}), id: uuid.v4() }; // 로컬 UUID 유지

      // 2) 숫자형 서버 ID 추출 (serverId/scheduleId/scheduleNo/id 순서)
      const extractNumericScheduleId = (obj) => {
        const raw = obj?.serverId ?? obj?.scheduleId ?? obj?.scheduleNo ?? obj?.id;
        const n = Number(String(raw ?? '').match(/^\d+$/)?.[0]);
        return Number.isFinite(n) ? n : NaN;
      };

      // 초기 후보(화면/상태에서 가져온 것)
      let finalId = extractNumericScheduleId(current);

      // 3) (선택) 서버 저장 시도 → 서버가 숫자 ID를 내려주면 교체
      try {
        if (typeof saveSchedule === 'function') {
          const saved = await saveSchedule(current);
          const raw = saved?.id ?? saved?.scheduleId ?? saved?.scheduleNo;
          const parsed = Number(String(raw ?? '').match(/^\d+$/)?.[0]);
          if (Number.isFinite(parsed)) {
            finalId = parsed; // 서버가 준 진짜 숫자 ID로 확정
          }
          console.log('LOG  [save] serverId =', finalId);
        }
      } catch (apiErr) {
        console.warn('WARN  [save] 서버 저장 실패, 로컬 저장만 유지:', apiErr?.message || apiErr);
      }

      // 4) 로컬 리스트에도 저장 (serverId를 숫자로 확정해 함께 보존)
      const forLocal = { ...current };
      if (Number.isFinite(finalId)) forLocal.serverId = finalId;
      await saveTripToList(forLocal);

      // 5) 안내 + 이동/유지 처리
      Alert.alert('저장 완료', '내 여행에 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            if (Number.isFinite(finalId)) {
              // ✅ 숫자 ID만 네비게이션으로 전달
              navigation.replace('PlannerResponse', {
                scheduleId: finalId,
                mode: 'read',
                from: 'PlannerCreate',
              });
            } else {
              // ✅ 서버 ID가 없으면(목/오프라인/실패) 화면 유지
              console.log('LOG  [save] stay on current screen (no numeric serverId)');
            }
          },
        },
      ]);
    } catch (e) {
      console.warn('저장 실패:', e);
      Alert.alert('오류', '저장에 실패했습니다.');
    }
  }}
>
                <Text style={styles.regenerateButtonText}>내 여행으로 저장</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* 재조회 로딩 스플래시 */}
        <Modal visible={isRegenerating} transparent animationType="fade">
          <SplashScreen />
        </Modal>

        {/* [ADDED] 저장 진행 스플래시 (플랜 수정 완료 시 표시) */}
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
  headerTitle: { flex: 1, textAlign: 'left', fontSize: normalize(20), fontWeight: '700', color: '#111827', marginLeft: normalize(10),marginTop: normalize(-10) },
  tripInfo: { backgroundColor: '#FAFAFA', padding: normalize(16), paddingBottom: normalize(4) },
  tripInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tripTitle: { fontSize: normalize(20),fontWeight:'500', color: '#1E1E1E' },
  budget: { color: '#4F46E5', fontSize: normalize(16), marginTop: normalize(4),position: 'relative',top: normalize(-10),left: normalize(-20), },
  budgetUnit: { color: '#4F46E5', fontSize: normalize(16) },
  dateText: { fontSize: normalize(14), color: '#7E7E7E', marginTop: normalize(4), marginBottom: 0 },
  tabScrollWrapper: { backgroundColor: '#FAFAFA', },
  tabContainer: { flexDirection: 'row', paddingHorizontal: normalize(6), paddingVertical: normalize(6) },
  tabBox: { alignItems: 'center', marginHorizontal: normalize(6), paddingHorizontal: normalize(10) },
  tabText: { fontSize: normalize(18), color: '#9CA3AF' },
  tabTextSelected: { color: '#4F46E5', fontWeight: 'bold' },
  activeBar: { marginTop: normalize(5), height: normalize(4), width: normalize(80), backgroundColor: '#4F46E5', borderRadius: 2 },
  container: { paddingHorizontal: normalize(16), marginBottom: -normalize(70), marginTop: normalize(20), backgroundColor: '#FAFAFA' },
  bottomButtonContainer1: { flexDirection: 'row', backgroundColor: '#fafafa', paddingVertical: normalize(20), paddingHorizontal: normalize(16), borderRadius: normalize(12), marginBottom: -normalize(20) },
  bottomButtonContainer: { flexDirection: 'row', backgroundColor: '#fafafa', paddingVertical: normalize(18), paddingHorizontal: normalize(20), top: normalize(10), borderRadius: normalize(12), paddingBottom: normalize(20) },
  placeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: normalize(32) },
  timeline: { width: normalize(30), alignItems: 'center', position: 'relative' },
  dot: { width: normalize(20), height: normalize(20), borderRadius: normalize(10), backgroundColor: '#6366F1', position: 'absolute', top: normalize(40), zIndex: 2 },
  verticalLine: { position: 'absolute', top: -normalize(20), left: normalize(13), width: normalize(4), height: normalize(330, 'height'), backgroundColor: '#A19CFF' },
  placeContent: { flex: 1, marginLeft: normalize(10) },
  placeCard: { backgroundColor: '#fff', padding: normalize(16), paddingBottom: normalize(10), borderRadius: normalize(20), marginBottom: -normalize(25), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  placeCard2: { backgroundColor: '#fff', padding: normalize(16), paddingRight: normalize(5), paddingLeft: normalize(12), paddingBottom: normalize(6), borderRadius: normalize(20), marginBottom: -normalize(35), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4, width: '85%', left: -normalize(20) },
  placeCard3: { backgroundColor: '#fff', padding: normalize(16), paddingRight: normalize(5), paddingLeft: normalize(16), paddingBottom: normalize(6), borderRadius: normalize(20), marginBottom: -normalize(40), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4, width: '88%', left: -normalize(20) },
  placeHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  placeName: { fontSize: normalize(16), marginBottom: normalize(4), color: '#373737' },
  placeCost: { fontSize: normalize(15), fontWeight: '600', fontStyle: 'Inter', color: '#353537ff', bottom: -normalize(15) },
  placeType: { fontSize: normalize(13), color: '#9CA3AF', marginBottom: normalize(4) , top: normalize(2) },
  keywords: { fontSize: normalize(12), color: '#333333', marginBottom: normalize(6) },
  transportRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: normalize(12), marginBottom: normalize(12) },
  placeNameInput: { fontSize: normalize(18), marginBottom: normalize(19), color: '#373737', paddingVertical: normalize(4), paddingTop: normalize(18) },
  transportItem: { flexDirection: 'row', alignItems: 'center', minWidth: normalize(120), marginLeft: normalize(10), justifyContent: 'center' },
  transportText: { marginLeft: normalize(6), fontSize: normalize(14), color: '#000' },
  transportTexts: { marginLeft: normalize(-28), fontSize: normalize(14), color: '#000' },
  transportTextss: { marginLeft: normalize(14), fontSize: normalize(14), color: '#000' },
  dragHandle: { position: 'absolute', left: -normalize(45), top: normalize(25), padding: normalize(4), zIndex: 5 },
  editButton: { flex: 1, height: normalize(45), borderRadius: normalize(12), borderWidth: 1, borderColor: '#4F46E5', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  editButtonText: { fontSize: normalize(16), color: '#4F46E5' },
  saveButton: { flex: 1, height: normalize(45), borderRadius: normalize(12), borderWidth: 1, borderColor: '#4F46E5', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { textAlign: 'center', color: '#4F46E5', fontSize: normalize(16) },
  regenerateButtonWrapper: { position: 'absolute', bottom: normalize(50), left: normalize(16), right: normalize(16), backgroundColor: '#fafafa', paddingVertical: normalize(5), borderRadius: normalize(12) },
  regenerateButton: { backgroundColor: '#4F46E5', borderRadius: normalize(10), paddingVertical: normalize(12), alignItems: 'center', borderWidth: 1, borderColor: '#4F46E5' },
  regenerateButtonText: { color: '#fff', fontSize: normalize(16) },
  fixedDoneButtonWrapper: { position: 'absolute', bottom: normalize(5), left: normalize(20), right: normalize(20), backgroundColor: '#4F46E5', borderRadius: normalize(12), paddingVertical: normalize(14), alignItems: 'center' },
  fixedDoneButton: { width: '100%', alignItems: 'center' },
  fixedDoneButtonText: { color: '#fff', fontSize: normalize(18) },
});
