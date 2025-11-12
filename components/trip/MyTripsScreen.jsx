// MyTripsScreen.jsx (patched)
// - 서버 리스트 + 로컬 오버레이 병합
// - DeviceEventEmitter 'TRIPS_UPDATED' 수신 시 즉시 갱신
// - 삭제 시 서버/로컬 동기화

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
  Dimensions,
  PixelRatio,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation, useFocusEffect} from '@react-navigation/native';
import HeaderBar from '../../components/common/HeaderBar';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPlanList } from '../../api/MyPlanner_fetch_list';
import { deleteSchedule } from '../../api/planner_delete_request';
import { TRIPS_UPDATED_EVENT } from '../../caching/cacheService';
import { MAIN_TAB_ID, defaultTabBarStyle } from '../../navigation/BottomTabNavigator';

// ✅ 전체 여행 & 캐시 초기화 함수
async function purgeAllTripsAndCaches() {
  try {
    await AsyncStorage.setItem('MY_TRIPS', JSON.stringify([])); // 모든 로컬 여행 삭제
    await clearDraftCaches?.(); // PLAN_INITIAL / PLAN_EDITED / PLAN_SAVE_READY 등
    await removeCacheData?.(CACHE_KEYS.PLAN_DETAIL);
    await invalidateListAndHomeCaches?.();
    Alert.alert('초기화 완료', '모든 로컬 여행/캐시가 제거되었습니다.');
  } catch (e) {
    Alert.alert('오류', e?.message ?? '초기화 중 오류가 발생했습니다.');
  }
}

const BASE_WIDTH = 390;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
function normalize(size) {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
}

function safeDateString(val) { return typeof val === 'string' ? val : ''; }
function safeDotDate(val) { const s = safeDateString(val); return s ? s.replace(/-/g, '.') : ''; }
function safeCalculateDday(startDate) {
  const s = safeDateString(startDate);
  if (!s) return '';
  const target = new Date(s);
  if (isNaN(target.getTime())) return '';
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d0 = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diff = Math.ceil((d0 - t0) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'D-DAY'; // ✅ 추가된 부분
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
}

function normalizeTripShape(item, index = 0) {
  const start = item?.startDate ?? item?.start_date ?? item?.start ?? item?.beginDate ?? '';
  const end = item?.endDate ?? item?.end_date ?? item?.end ?? item?.finishDate ?? '';
  const rawServerId = item?.serverId ?? item?.server_id ?? item?.scheduleId ?? item?.schedule_id;
  const numericServerId = Number(String(rawServerId ?? '').match(/^\d+$/)?.[0]);
  const chosenId = Number.isFinite(numericServerId) ? String(numericServerId) : String(item?.id ?? `local-${index}`);
  return {
    id: chosenId,
    serverId: Number.isFinite(numericServerId) ? numericServerId : undefined,
    title: String(item?.title ?? item?.name ?? '여행'),
    startDate: safeDateString(start),
    endDate: safeDateString(end),
    dDay: typeof item?.dDay === 'string' ? item.dDay : undefined,
  };
}

const pickId = (obj) => {
  const raw = obj?.serverId ?? obj?.scheduleId ?? obj?.scheduleNo ?? obj?.id;
  const n = Number(String(raw ?? '').match(/^\d+$/)?.[0]);
  return Number.isFinite(n) ? n : null;
};

async function mergeWithLocalOverlay(serverItems) {
  try {
    const raw = await AsyncStorage.getItem('MY_TRIPS');
    if (!raw) return serverItems;
    const local = JSON.parse(raw);
    if (!Array.isArray(local)) return serverItems;

    const map = new Map(serverItems.map(it => [pickId(it) ?? it?.id, it]));
    for (const l of local) {
      const lid = pickId(l) ?? l?.id;
      if (!lid) continue;
      const base = map.get(lid) || {};
      map.set(lid, {
        ...base,
        ...l,
        title: base.title ?? l.title,
        startDate: base.startDate ?? l.startDate,
        endDate: base.endDate ?? l.endDate,
      });
    }
    return Array.from(map.values());
  } catch {
    return serverItems;
  }
}

const TRAVEL_TIPS = [
  '여행에서는 목적지만큼 그 여정도 소중합니다. 빠르게 이동하는 것보다 한 번쯤은 걸음을 늦추고 주변을 돌아보세요.',
  '여행 준비물 체크리스트를 만들어 꼭 필요한 물건만 챙기세요. 가장 좋은 여행 일정은 여유가 있는 일정입니다.',
  '여행 일정은 넉넉하게, 예기치 않은 상황도 즐길 수 있도록! 비상연락처와 여권 사본은 따로 보관해두면 좋아요.',
  '걷다가 쉬었다가, 때로는 지도 없이 길을 잃어보는 것도 여행의 묘미!',
];
function getRandomTip(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export default function MyTripsScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [randomTip, setRandomTip] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [myTrips, setMyTrips] = useState([]);

  useFocusEffect(
  React.useCallback(() => {
    const parent = navigation.getParent?.(MAIN_TAB_ID) ?? navigation.getParent?.();
    const show = () => parent?.setOptions?.({
      tabBarStyle: { ...defaultTabBarStyle, display: 'flex', opacity: 1, position: 'relative' },
    });

    show();
    const t = setTimeout(show, 0); // 레이스 가드 1회

    return () => {
      clearTimeout(t);
      show(); // 블러 시에도 보이는 상태로 고정
    };
  }, [navigation])
);

// ✅ 전환 애니메이션 종료 시에도 보이기(제스처 뒤로가기 포함)
React.useEffect(() => {
  const parent = navigation.getParent?.(MAIN_TAB_ID) ?? navigation.getParent?.();
  const show = () => parent?.setOptions?.({
    tabBarStyle: { ...defaultTabBarStyle, display: 'flex', opacity: 1, position: 'relative' },
  });
  const unsub = navigation.addListener('transitionEnd', show);
  return unsub;
}, [navigation]);

  // ✅ MyTrips가 보일 때마다 탭바를 ‘항상’ 복구
useFocusEffect(
  React.useCallback(() => {
    const parent = navigation.getParent?.(MAIN_TAB_ID) ?? navigation.getParent?.();

    // 1) 즉시 복구 (display: 'flex'로 확실히 덮어쓰기)
    parent?.setOptions?.({
      tabBarStyle: {
        ...defaultTabBarStyle,
        display: 'flex',
        opacity: 1,
        position: 'relative',
        height: defaultTabBarStyle?.height ?? 70,
        borderTopWidth: defaultTabBarStyle?.borderTopWidth ?? StyleSheet.hairlineWidth,
        pointerEvents: 'auto',
      },
    });

    // 2) 혹시 전 화면에서 늦게 숨김을 적용하는 경우를 대비한 1회 재적용(레이스가드)
    const t = setTimeout(() => {
      parent?.setOptions?.({
        tabBarStyle: {
          ...defaultTabBarStyle,
          display: 'flex',
          opacity: 1,
          position: 'relative',
          height: defaultTabBarStyle?.height ?? 70,
          borderTopWidth: defaultTabBarStyle?.borderTopWidth ?? StyleSheet.hairlineWidth,
          pointerEvents: 'auto',
        },
      });
    }, 0);

    // 3) 화면 떠날 때도 안전하게 ‘보이는 상태’를 유지
    return () => {
      clearTimeout(t);
      parent?.setOptions?.({
        tabBarStyle: {
          ...defaultTabBarStyle,
          display: 'flex',
          opacity: 1,
          position: 'relative',
          height: defaultTabBarStyle?.height ?? 70,
          borderTopWidth: defaultTabBarStyle?.borderTopWidth ?? StyleSheet.hairlineWidth,
          pointerEvents: 'auto',
        },
      });
    };
  }, [navigation])
);


  // ✅ MyTrips가 보일 때마다 탭바를 항상 복구
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent?.(MAIN_TAB_ID) ?? navigation.getParent?.();
      parent?.setOptions?.({ tabBarStyle: defaultTabBarStyle });
      // 언마운트/블러 시에도 안전하게 복구(이중 안전장치)
      return () => parent?.setOptions?.({ tabBarStyle: defaultTabBarStyle });
    }, [navigation])
  );

  async function writeTripsPreserveDays(nextList) {
  try {
    const raw = await AsyncStorage.getItem('MY_TRIPS');
    const prev = raw ? JSON.parse(raw) : [];
    const prevMap = new Map((Array.isArray(prev) ? prev : []).map(t => [String(t?.id), t]));

    const merged = (nextList || []).map(t => {
      const old = prevMap.get(String(t?.id));
      // 이전에 days가 있었다면 보존 (서버 요약형으로 덮어씌우지 않음)
      if (old?.days?.length && !t?.days?.length) {
        return { ...t, days: old.days };
      }
      return t;
    });

    await AsyncStorage.setItem('MY_TRIPS', JSON.stringify(merged));
  } catch (e) {
    console.warn('[MyTrips] writeTripsPreserveDays error:', e?.message);
    await AsyncStorage.setItem('MY_TRIPS', JSON.stringify(nextList || []));
  }
}


// ✅ MyTripsScreen 컴포넌트 안, return 위에 추가
const openPlannerResponse = useCallback((trip) => {
  const toPositiveInt = (v) => {
    const n = Number(String(v ?? '').match(/^\d+$/)?.[0]);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const scheduleId = toPositiveInt(trip?.serverId) ?? toPositiveInt(trip?.id);
  if (!scheduleId) {
    Alert.alert('잘못된 일정', '유효한 서버 일정 ID가 없습니다.');
    return;
  }

  const params = {
    scheduleId,
    mode: 'read',
    from: 'MyTrips',
    initialData: trip,
    skipFirstFetch: false,
    lockRead: true,
  };

  // ✅ 탭(parent) 상태에서 실제 탭 이름을 동적으로 찾음
  const tabs = navigation.getParent?.() ?? null;
  const tabState = tabs?.getState?.();
  const tabNames = tabState?.routeNames ?? [];

  // Home 탭 이름 추정: 'Home' 포함 → 그 외 첫 번째
  const homeTabName =
    tabNames.find((n) => /home/i.test(n)) || tabNames[0];

  // 스택 화면 이름 후보: 프로젝트에 따라 'PlannerResponse' 또는 'PlannerResponseHome'일 수 있음
  const stackCandidates = ['PlannerResponse', 'PlannerResponseHome'];

  if (tabs && homeTabName) {
    // 1순위: 'PlannerResponse'
    try {
      tabs.navigate(homeTabName, { screen: stackCandidates[0], params });
      return;
    } catch {}

    // 2순위: 'PlannerResponseHome'
    try {
      tabs.navigate(homeTabName, { screen: stackCandidates[1], params });
      return;
    } catch {}

    // 디버그 안내
    Alert.alert(
      '네비게이션 확인 필요',
      `탭 이름 후보: ${tabNames.join(', ') || '(없음)'}\n` +
      `스택 화면 이름이 'PlannerResponse' 또는 'PlannerResponseHome'로 등록돼 있는지 확인해주세요.`
    );
    console.log('[nav-debug]', { tabNames, tried: stackCandidates, homeTabName, params });
    return;
  }

  // 탭 부모를 못 찾은 경우 — 같은 스택 안일 수도 있으니 직접 시도
  try { navigation.navigate(stackCandidates[0], params); return; } catch {}
  try { navigation.navigate(stackCandidates[1], params); return; } catch {}

  Alert.alert('네비게이터 경로 없음', '현재 네비게이터에서 대상 화면을 찾지 못했습니다.');
  console.log('[nav-debug:fallback]', { params });
}, [navigation]);

  useEffect(() => { setRandomTip(getRandomTip(TRAVEL_TIPS)); }, []);

  useFocusEffect(
    useCallback(() => {
      const loadTrips = async () => {
        try {
          const { items } = await fetchPlanList();
          const serverTrips = Array.isArray(items) ? items : [];
          const merged = await mergeWithLocalOverlay(serverTrips);
          const normalized = merged.map((t, i) => normalizeTripShape(t, i));
          // ✅ fallback: days 누락된 경우 로컬 최신본 보충
       const localRaw = await AsyncStorage.getItem('MY_TRIPS');
       if (localRaw) {
         const localTrips = JSON.parse(localRaw);
         normalized.forEach((t, i) => {
           const match = localTrips.find(l => String(l.id) === String(t.id));
           if (match?.days?.length && !t?.days?.length) t.days = match.days;
         });
       }
          setMyTrips(normalized);
          await writeTripsPreserveDays(normalized);
        } catch (e) {
          console.error('[MyTripsScreen] 여행 리스트 불러오기 실패:', e);
          Alert.alert('불러오기 실패', '여행 데이터를 가져오지 못했습니다.');
        }
      };
      loadTrips();
    }, [])
  );

  useEffect(() => {
  const sub = DeviceEventEmitter.addListener(TRIPS_UPDATED_EVENT, async () => {
    try {
      const { items } = await fetchPlanList();
      const merged = await mergeWithLocalOverlay(Array.isArray(items) ? items : []);
      const normalized = merged.map((t, i) => normalizeTripShape(t, i));
      setMyTrips(normalized);
      await writeTripsPreserveDays(normalized);
    } catch {
      const raw = await AsyncStorage.getItem('MY_TRIPS');
      setMyTrips(raw ? JSON.parse(raw) : []);
    }
  });
  return () => sub.remove();
}, []);

  const containerWidth = Math.min(width * 0.99, normalize(600));
  const toggleEditMode = () => setIsEditing(!isEditing);

  const handleDeleteTrip = (index) => {
    Alert.alert(
      '여행 리스트 삭제',
      '여행리스트가 삭제됩니다',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const t = myTrips[index];
              const numeric =
                Number.isFinite(t?.serverId)
                  ? t.serverId
                  : Number(String(t?.id ?? '').match(/^\d+$/)?.[0]);
              if (!Number.isFinite(numeric)) {
                Alert.alert('삭제 오류', '유효하지 않은 서버 ID입니다.');
                return;
              }
              await deleteSchedule(numeric);
              setMyTrips((prev) => {
                const updated = prev.filter((_, i) => i !== index);
                AsyncStorage.setItem('MY_TRIPS', JSON.stringify(updated));
                return updated;
              });
            } catch (err) {
              console.error('[deleteTrip] failed:', err);
              Alert.alert('삭제 실패', '잠시 후 다시 시도해주세요.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const onPressCreate = () => navigation.navigate('Home', { screen: 'PlannerInfo' });

  return (
    <View style={styles.screen}>
      <HeaderBar />
       {/* ⚠️ 개발용: 로컬 캐시 초기화 버튼 (사용 후 주석처리) */}
{/* <View style={{ paddingHorizontal: 20, marginTop: 10 }}> */}
  {/* <TouchableOpacity */}
    {/* style={{ backgroundColor: '#F87171', borderRadius: 10, padding: 10 }} */}
    {/* onPress={() => purgeAllTripsAndCaches()} */}
  {/* > */}
    {/* <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}> */}
      {/* ⚠️ 로컬 캐시 초기화 */} 
    {/* </Text> */}
  {/* </TouchableOpacity> */}
{/* </View> */}

      <View style={[styles.tipContainer, { alignSelf: 'center', width: containerWidth }]}>
        <Text style={styles.tipTitle}>오늘의 여행 <Text style={{ fontStyle: 'italic' }}>TIP</Text></Text>
        <Text style={styles.tipText}>{randomTip}</Text>
      </View>

      <View style={[styles.listContainer, { alignSelf: 'center', width: containerWidth }]}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>내 여행 리스트</Text>
          {myTrips.length > 0 && (
            <TouchableOpacity onPress={toggleEditMode}>
              <Text style={styles.editButton}>{isEditing ? '편집완료' : '삭제'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
          {myTrips.length === 0 ? (
            <View style={styles.tripRow}>
              <View style={[styles.tripBox, { width: containerWidth, alignItems: 'center' }]}>
                <View style={[styles.tripContent, { flexDirection: 'column', alignItems: 'center' }]}>
                  <Text style={styles.tripTitle}>제작된 여행 플랜이 없어요</Text>
                  <Text style={[styles.tripDate, { marginTop: normalize(8) }]}>나에게 맞춘 여행계획을 세워볼까요?</Text>
                </View>
              </View>
            </View>
          ) : (
            myTrips.map((trip, index) => (
              <View key={String(trip.id ?? index)} style={[styles.tripRow, isEditing && { overflow: 'visible' }]}>
                <TouchableOpacity
                  style={[styles.tripBox, isEditing && { borderTopRightRadius: 0, borderBottomRightRadius: 0, marginRight: 0, borderRightWidth: 0 }]}
                  activeOpacity={0.3}
                  disabled={isEditing}
                  onPress={async () => {
  const toPositiveInt = (v) => {
    const n = Number(String(v ?? '').match(/^\d+$/)?.[0]);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  // 1) 유효한 서버 scheduleId 확보
  const scheduleId = toPositiveInt(trip?.serverId) ?? toPositiveInt(trip?.id);
  if (!scheduleId) {
    Alert.alert('잘못된 일정', '유효한 서버 일정 ID가 없습니다.');
    return;
  }

  // 2) 로컬 MY_TRIPS(상세 스냅샷) 확인 → 있으면 initialData로 사용
  let initialData = trip;
  let skipFirstFetch = false;
  try {
    const raw = await AsyncStorage.getItem('MY_TRIPS');
    const list = raw ? JSON.parse(raw) : [];
    const full = Array.isArray(list)
      ? list.find(
          (t) =>
            toPositiveInt(t?.serverId) === scheduleId ||
            toPositiveInt(t?.id) === scheduleId
        )
      : null;

    if (full?.days?.length) {
      // ✅ days 포함된 스냅샷 발견 → 바로 렌더용 initialData로 사용
      initialData = full;
      skipFirstFetch = true; // ✅ 첫 서버 재조회 스킵 (로컬 스냅샷으로 즉시 렌더)
    }
  } catch {}

  // 3) PlannerResponse 파라미터 구성
  const params = {
    scheduleId,
    mode: 'read',
    from: 'MyTrips',
    initialData,        // ✅ 핵심: 진입 즉시 화면에 찍힘
    skipFirstFetch,     // ✅ 스냅샷 있으면 true, 없으면 false
    lockRead: true,     // 읽기 모드 고정
    forceReload: !skipFirstFetch, // 스냅샷 없을 때만 강제 재조회 플래그
  };

  // 4) Home 탭 아래의 PlannerResponse(혹은 PlannerResponseHome)로 중첩 네비게이션
  try {
    navigation.navigate('Home', { screen: 'PlannerResponse', params });
  } catch {
    try {
      navigation.navigate('Home', { screen: 'PlannerResponseHome', params });
    } catch {
      navigation.navigate('PlannerResponse', params);
    }
  }
}}
                >
                  <View style={styles.tripContent}>
                    <View>
                      <Text style={styles.tripTitle}>{trip.title ?? '여행'}</Text>
                      <Text style={styles.tripDate}>
                        {safeDotDate(trip.startDate)} {trip.endDate ? `~ ${safeDotDate(trip.endDate)}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.dDayText}>{trip.dDay ?? safeCalculateDday(trip.startDate)}</Text>
                  </View>
                </TouchableOpacity>
                {isEditing && (
                  <TouchableOpacity style={styles.deleteButtonPill} onPress={() => handleDeleteTrip(index)} activeOpacity={0.8}>
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}

          <View
            style={{
              width: containerWidth - normalize(45),
              borderRadius: normalize(16),
              backgroundColor: 'transparent',
              marginTop: normalize(20),
              marginBottom: normalize(30),
              alignSelf: 'center',
            }}
          >
            <View style={{ backgroundColor: '#fff', borderRadius: normalize(16), overflow: 'hidden', width: '100%' }}>
              <TouchableOpacity
                style={{
                  height: normalize(48),
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: normalize(36),
                  backgroundColor: '#fff',
                  borderRadius: normalize(16),
                  width: '100%',
                  marginHorizontal: 0,
                }}
                activeOpacity={0.8}
                onPress={onPressCreate}
              >
                <View
                  style={{
                    width: normalize(36),
                    height: normalize(36),
                    borderRadius: normalize(16),
                    backgroundColor: '#4F46E5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: normalize(12),
                  }}
                >
                  <MaterialIcons name="add" size={normalize(36)} color="#FFFFFF" />
                </View>
                <Text
                  style={{
                    fontWeight: '400',
                    fontSize: normalize(16),
                    color: '#000000',
                    textAlign: 'center',
                    flex: 1,
                    paddingRight: normalize(36),
                  }}
                >
                  여행 플랜 만들러 가기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fafafa' },
  tipContainer: {
    backgroundColor: '#DFDDFF',
    alignSelf: 'center',
    width: '90%',
    maxWidth: normalize(370),
    marginTop: normalize(18),
    paddingVertical: normalize(28),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(18),
  },
  tipTitle: { fontWeight: 'bold', marginTop: normalize(-10), marginBottom: normalize(10), color: '#1E1E1E', fontSize: normalize(20), textAlign: 'center' },
  tipText: { fontSize: normalize(15), color: '#616161', lineHeight: normalize(20) },
  listContainer: {
    flex: 1,
    paddingHorizontal: normalize(20),
    marginTop: normalize(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(16) },
  sectionTitle: { fontSize: normalize(22), fontWeight: '400', color: '#1E1E1E' },
  editButton: { fontSize: normalize(15), color: '#F97575', marginRight: normalize(15), marginBottom: normalize(-4) },
  scrollContent: { paddingBottom: normalize(40) },
  tripRow: { flexDirection: 'row', alignItems: 'stretch', marginBottom: normalize(12), overflow: 'visible' },
  tripBox: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: normalize(30),
    paddingHorizontal: normalize(20),
    borderRadius: normalize(20),
    marginBottom: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tripContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripTitle: { fontSize: normalize(16), fontWeight: '400', color: '#373737', marginBottom: normalize(8) },
  tripDate: { fontSize: normalize(14), color: '#7E7E7E', marginTop: normalize(4) },
  dDayText: { fontSize: normalize(26), fontWeight: '700', color: '#4F46E5' },
  deleteButtonPill: {
    width: normalize(68),
    backgroundColor: '#F97575',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: normalize(20),
    borderBottomRightRadius: normalize(20),
    borderLeftWidth: 0,
    marginBottom: 0,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  deleteButtonText: { color: '#fff', fontSize: normalize(16), fontWeight: '400' },
});
