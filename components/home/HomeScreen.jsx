// HomeScreen.jsx (patched)
// - 서버 리스트 + 로컬 오버레이 병합(수정 직후 반영)
// - DeviceEventEmitter 'TRIPS_UPDATED' 수신 시 즉시 갱신

import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  PixelRatio,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TravelSection from './TravelSection';
import { fetchPlanList } from '../../api/MyPlanner_fetch_list';
import HeaderBar from '../../components/common/HeaderBar';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale =
    based === 'height'
      ? SCREEN_HEIGHT / BASE_HEIGHT
      : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
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

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const nickname = user?.nickname || '사용자';
  const USE_MOCK = false;
  const [myTrips, setMyTrips] = useState([]);
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    if (!user) navigation.replace('Login');
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          if (USE_MOCK) {
            const raw = await AsyncStorage.getItem('MY_TRIPS');
            if (!mounted) return;
            setMyTrips(raw ? JSON.parse(raw) : []);
            setServerDown(false);
            return;
          }
          const { items, status } = await fetchPlanList();
          if (!mounted) return;
          const merged = await mergeWithLocalOverlay(Array.isArray(items) ? items : []);
          setMyTrips(merged);
          setServerDown(status === null || status >= 500);
        } catch (err) {
          const raw = await AsyncStorage.getItem('MY_TRIPS');
          if (!mounted) return;
          setMyTrips(raw ? JSON.parse(raw) : []);
          setServerDown(true);
        }
      })();
      return () => { mounted = false; };
    }, [])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('TRIPS_UPDATED', async () => {
      try {
        const { items } = await fetchPlanList();
        const merged = await mergeWithLocalOverlay(Array.isArray(items) ? items : []); // 서버 늦으면 로컬이 보강
        setMyTrips(merged);
      } catch {
        const raw = await AsyncStorage.getItem('MY_TRIPS');
        setMyTrips(raw ? JSON.parse(raw) : []);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단바 챗봇 아이콘 추가 (로고/프로필 상단줄은 다른 컴포넌트일 수 있음) */}
    <View style={styles.container}>
      <HeaderBar showChatBot={true} />

      <View style={styles.greetingWrapper}>
        {/*
        {isLong ? (
          <>
            <Text style={styles.greetingText}>{nickname}님</Text>
            <Text style={styles.greetingText}>좋은 하루 보내세요</Text>
          </>
        ) : (
          <Text style={styles.greetingText}>
            {nickname}님 좋은 하루 보내세요
          </Text>
        )}
        */}

        {/* ✅ 항상 두 줄로 고정 */}
        <Text style={styles.greetingText}>{nickname}님</Text>
        <Text style={styles.greetingText}>좋은 하루 보내세요</Text>

        <Text style={styles.subGreetingText}>오늘은 어디로 떠나고 싶으세요?</Text>
      </View>
        <Text style={styles.greetingText}>{nickname}님</Text>
        <Text style={styles.greetingText}>좋은 하루 보내세요</Text>
        <Text style={styles.subGreetingText}>오늘은 어디로 떠나고 싶으세요?</Text>
      </View>

      <View style={styles.featureGroup}>
        <View style={styles.featureRow}>
          <TouchableOpacity
            style={[styles.featureItem, styles.featureItemLeft]}
            onPress={() => navigation.navigate('Planner')}
          >
            <View style={styles.featureCard}>
              <View style={[styles.iconCircleSmall, { backgroundColor: '#E9CDFF' }]}>
                <MaterialIcons name="route" size={normalize(24)} color="#533E92" />
              </View>
              <Text style={styles.featureTitle}>AI 플랜 제작</Text>
              <Text style={styles.featureDesc}>여행계획을 세워볼까요?</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.featureDivider} />

          <TouchableOpacity
            style={[styles.featureItem, styles.featureItemRight]}
            onPress={() => navigation.navigate('Matching')}
          >
            <View style={styles.featureCard}>
              <View style={[styles.iconCircleSmall, { backgroundColor: '#FFF1A8' }]}>
                <MaterialIcons name="person-outline" size={normalize(24)} color="#B28500" />
              </View>
              <Text style={styles.featureTitle}>동행자 찾기</Text>
              <Text style={styles.featureDesc}>동행자를 찾아볼까요?</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.travelHeader}>
        <Text style={styles.travelTitle}>다가오는 여행</Text>
        {myTrips.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('MyTrips')}>
            <Text style={styles.travelViewAll}>여행 전체보기</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.travelDesc}>곧 떠날 여행 플랜을 만드세요</Text>

      {myTrips.length > 1 ? (
        <ScrollView
          style={styles.travelScrollArea}
          contentContainerStyle={{ paddingBottom: normalize(120, 'height') }}
          showsVerticalScrollIndicator={false}
        >
          <TravelSection
            travelList={myTrips}
            onPressCreate={() => navigation.navigate('Planner')}
            onPressCard={(scheduleId) => {
              navigation.navigate('PlannerResponse', { scheduleId, from: 'Home' });
            }}
          />
        </ScrollView>
      ) : (
        <View style={styles.travelScrollArea}>
          <TravelSection
            travelList={Array.isArray(myTrips) ? myTrips : []}
            onPressCreate={() => navigation.navigate('Planner')}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  greetingWrapper: { marginTop: normalize(16, 'height'), paddingHorizontal: normalize(20) },
  greetingText: {
    fontSize: normalize(24),
    fontWeight: '500',
    color: '#141414',
    lineHeight: normalize(33.6, 'height'),
    letterSpacing: normalize(-0.6),
  },
  subGreetingText: {
    fontSize: normalize(14),
    color: '#767676',
    marginTop: normalize(6, 'height'),
    letterSpacing: normalize(-0.35),
  },
  featureGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(16),
    marginTop: normalize(16, 'height'),
    marginHorizontal: normalize(20),
    paddingVertical: normalize(8, 'height'),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: normalize(8),
    shadowOffset: { width: 0, height: normalize(4, 'height') },
    elevation: 2,
  },
  featureRow: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between' },
  featureItem: { width: '50%', paddingVertical: normalize(8, 'height') },
  featureItemLeft: { paddingRight: normalize(8) },
  featureItemRight: { paddingLeft: normalize(8) },
  featureDivider: {
    position: 'absolute',
    left: '50%',
    top: normalize(8, 'height'),
    bottom: normalize(8, 'height'),
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F1F5',
    transform: [{ translateX: -StyleSheet.hairlineWidth / 2 }],
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(16),
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12, 'height'),
  },
  iconCircleSmall: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(100),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(12, 'height'),
  },
  featureTitle: {
    fontSize: normalize(14),
    color: '#111111',
    letterSpacing: normalize(-0.35),
    fontWeight: '600',
  },
  featureDesc: {
    fontSize: normalize(12),
    color: '#767676',
    letterSpacing: normalize(-0.3),
    marginTop: normalize(2, 'height'),
  },
  travelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(24, 'height'),
    paddingHorizontal: normalize(20),
  },
  travelTitle: { fontSize: normalize(20), color: '#141414', letterSpacing: normalize(-0.5), fontWeight: '600' },
  travelViewAll: { fontSize: normalize(14), color: '#4F46E5B2' },
  travelDesc: {
    paddingHorizontal: normalize(20),
    fontSize: normalize(14),
    color: '#767676',
    marginTop: normalize(6, 'height'),
    marginBottom: normalize(6, 'height'),
    letterSpacing: normalize(-0.35),
  },
  travelScrollArea: { flex: 1, marginTop: normalize(8, 'height') },
});
