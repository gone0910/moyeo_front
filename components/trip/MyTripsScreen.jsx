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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import HeaderBar from '../../components/common/HeaderBar';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPlanList } from '../../api/MyPlanner_fetch_list';
import { deleteSchedule } from '../../api/planner_delete_request';
import { TRIPS_UPDATED_EVENT } from '../../caching/cacheService';

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
  return diff >= 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
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

  useEffect(() => { setRandomTip(getRandomTip(TRAVEL_TIPS)); }, []);

  useFocusEffect(
    useCallback(() => {
      const loadTrips = async () => {
        try {
          const { items } = await fetchPlanList();
          const serverTrips = Array.isArray(items) ? items : [];
          const merged = await mergeWithLocalOverlay(serverTrips);
          const normalized = merged.map((t, i) => normalizeTripShape(t, i));
          setMyTrips(normalized);
          await AsyncStorage.setItem('MY_TRIPS', JSON.stringify(normalized));
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
      await AsyncStorage.setItem('MY_TRIPS', JSON.stringify(normalized));
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
                  onPress={() => {
  const toPositiveInt = (v) => {
    const n = Number(String(v ?? '').match(/^\d+$/)?.[0]);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const scheduleId = toPositiveInt(trip?.serverId) ?? toPositiveInt(trip?.id);
  if (!scheduleId) {
    Alert.alert('잘못된 일정', '유효한 서버 일정 ID가 없습니다.');
    return;
  }

  // ✅ 오직 숫자 ID만 전달 (initialData 제거)
  //    이렇게 해야 PlannerResponseHome이 항상 서버의 최신 일정으로 렌더링됨
  navigation.navigate('Home', {
    screen: 'PlannerResponse',
    params: {
      scheduleId,
      mode: 'read',
      from: 'MyTrips',
      forceFetch: true,
    },
  });
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
