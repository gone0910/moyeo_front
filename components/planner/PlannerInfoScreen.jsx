// ﻿// components/planner/PlannerInfoScreen.jsx
import React, { useState, useContext, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  PixelRatio,
  SafeAreaView,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { UserContext } from '../../contexts/UserContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveCacheData, CACHE_KEYS, beginNewDraft } from '../../caching/cacheService';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import SplashScreen from '../../components/common/SplashScreen';
import { createSchedule } from '../../api/planner_create_request';
import { defaultTabBarStyle } from '../../navigation/BottomTabNavigator';

// ✅ 지역 공통 맵 (Matching 기준)
import {
  REGION_MAP,           // { '서울': [{ name:'강남구', code:'GANGNAM_GU' }, ...], ...}
  PROVINCE_MAP,         // { '서울': 'SEOUL', '경기도': 'GYEONGGI', ... }
} from '../../components/common/regionMap';

/* ===== Locale ===== */
LocaleConfig.locales['ko'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'ko';

/* ===== normalize ===== */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Platform.OS === 'ios'
    ? Math.round(PixelRatio.roundToNearestPixel(newSize))
    : Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
}

/* ===== 공통 BottomSheet ===== */
function BottomSheet({ visible, onClose, children, heightRatio, maxHeightRatio, minHeightRatio }) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      duration: visible ? 220 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  const dynamicStyle = {
    ...(heightRatio ? { height: SCREEN_HEIGHT * heightRatio } : null),
    ...(maxHeightRatio ? { maxHeight: SCREEN_HEIGHT * maxHeightRatio } : null),
    ...(minHeightRatio ? { minHeight: SCREEN_HEIGHT * minHeightRatio } : null),
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Pressable style={styles.dim} onPress={onClose} />
      <Animated.View style={[styles.sheet, dynamicStyle, { transform: [{ translateY }] }]}>
        {children}
      </Animated.View>
    </Modal>
  );
}

/* ===== 소형 컴포넌트 ===== */
function Row({ title, value, onPress, required=true }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={onPress} activeOpacity={0.85}>
        <Text style={styles.cardTitle}>
          {title}{required && <Text style={styles.asterisk}> *</Text>}
        </Text>
        <View style={styles.rightGroup}>
          {!!value && (<Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">{value}</Text>)}
          <View style={styles.chevronBadge}>
            <Ionicons name="chevron-down" size={normalize(16)} color="#333333" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
function SheetHeader({ title, subtitle, onClose, offset }) {
  const mt = typeof offset === 'number' ? offset : normalize(-55, 'height'); // 다른 시트 기본값과 동일
  return (
    <View style={styles.sheetHeader}>
      <View>
        <Text style={styles.sheetTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.sheetSub}>{subtitle}</Text>}
      </View>
      <TouchableOpacity
        onPress={() => onClose(null)}
        hitSlop={8}
        style={{ marginTop: mt }}   // ← 여기만 통일해서 제어
      >
        <Ionicons name="close" size={normalize(22)} color="#111" />
      </TouchableOpacity>
    </View>
  );
}
function Chip({ label, selected, onPress, large=false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.regionChip,
        large && { paddingVertical: normalize(12,'height'), paddingHorizontal: normalize(18) },
        selected && styles.regionChipSelected
      ]}
    >
      <Text style={[styles.regionChipText, selected && styles.regionChipTextSelected]}>{label}</Text>
      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={normalize(14)}
          color="#4F46E5"
          style={{ marginLeft: normalize(6) }}
        />
      )}
    </TouchableOpacity>
  );
}

/* ===== 유틸 ===== */
function fmtKorean(date) {
  const d = new Date(date);
  return `${d.getMonth()+1}월 ${d.getDate()}일`;
}
function getMarkedDatesTemp(start, end) {
  if (!start) return {};
  const marked = {
    [start]: { startingDay: true, endingDay: !end, color: '#4F46E5', textColor: '#fff' },
  };
  if (start && end) {
    let cur = new Date(start);
    const e = new Date(end);
    while (cur < e) {
      cur.setDate(cur.getDate() + 1);
      const s = cur.toISOString().slice(0,10);
      if (s !== end) marked[s] = { color:'#E3E0FF', textColor:'#111' };
    }
    marked[end] = { endingDay: true, color: '#4F46E5', textColor:'#fff' };
  }
  return marked;
}

/* ===== Matching 기준 지역 데이터 구성 ===== */
// 제외할 광역시
const EXCLUDED_PROVINCES = ['부산', '대구', '인천', '대전', '울산', '세종', '광주'];

// 도 라벨(선택없음 + 제외 적용)
const PROVINCE_LABELS = [
  '선택없음',
  ...Object.keys(PROVINCE_MAP).filter(p => !EXCLUDED_PROVINCES.includes(p))
];

// 한글 시/군 → ENUM
const CITY_TO_ENUM = Object.values(REGION_MAP).flat().reduce((acc, { name, code }) => {
  acc[name] = code; return acc;
}, {});

// 도별 시/군 한글 리스트
const CitiesByProvince = Object.fromEntries(
  Object.entries(REGION_MAP).map(([provKor, cities]) => [provKor, cities.map(c => c.name)])
);

// 시트 높이 비율 (Matching 기준)
function getCitySheetHeightRatio(province) {
  if (province === '선택없음') return 0.30;
  if (province === '서울') return 0.72;
  if (province === '제주') return 0.335;
  if (province === '경기도') return 0.66;
  if (province === '강원도') return 0.42;
  if (province === '충청북도') return 0.36;
  if (province === '충청남도') return 0.42;
  if (province === '전라북도') return 0.36;
  if (province === '전라남도') return 0.36;
  if (province === '경상북도') return 0.36;
  if (province === '경상남도') return 0.42;
  return 0.36;
}

/* ===== 공통 섹션 컴포넌트 (CTA 위 여백 자동 보정) ===== */
function BottomSheetSection({ heightRatio, children, base = 72, scale = 90 }) {
  // heightRatio(시트 높이 비율)에 따라 CTA 위 여백(= paddingBottom) 자동 보정
  // base/scale는 필요시 미세 조정만 하세요. (둘 다 'height' 기준)
  const dynamicPadding = normalize(base + heightRatio * scale, 'height');
  return (
    <View style={{ paddingHorizontal: normalize(16), paddingBottom: dynamicPadding }}>
      {children}
    </View>
  );
}

/* ===== 메인 ===== */
export default function PlannerInfoScreen() {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent?.();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => parent?.setOptions({ tabBarStyle: defaultTabBarStyle });
    }, [navigation])
  );

  // 날짜
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // 목적지 (도/시)
  const [selectedRegion, setSelectedRegion] = useState(''); // 도(한글)
  const [selectedCity, setSelectedCity] = useState('');     // 시(한글) - ✅ 단일 선택

  // 인원/기타
  const [selectedItems, setSelectedItems] = useState({
    group: '',
    tripstyle: '',
    gender: '',
    age: '',
  });

  // 예산
  const [budget, setBudget] = useState(null);

  // MBTI
  const [selectedMbti, setSelectedMbti] = useState(null);

  // 여행 스타일(다중) - 화면은 다중, API는 첫 1개만 전송(기존 유지)
  const [selectedTravelStyles, setSelectedTravelStyles] = useState(null);

  // 하단 CTA 활성 조건
  const isDateSelected = !!startDate && !!endDate;

  // [ADDED] 도 선택 시 시/군 필수 유효성
  const isRegionValid = useMemo(() => {
    if (!selectedRegion || selectedRegion === '선택없음') return true; // 목적지 미선택 또는 '선택없음'은 통과
    return !!selectedCity; // 도를 골랐다면 시/군 필수
  }, [selectedRegion, selectedCity]);

  // [ADDED] 최종 CTA 활성화 조건
  const isCTAEnabled = isDateSelected && isRegionValid;

  // 어떤 시트를 열지
  const [sheet, setSheet] = useState(null); // 'date' | 'region' | 'budget' | 'mbti' | 'style' | 'group' | null

  /* ===== 날짜 (시트 임시 상태) ===== */
  const [tmpStart, setTmpStart] = useState(null);
  const [tmpEnd, setTmpEnd] = useState(null);
  const openDateSheet = () => {
    setTmpStart(startDate);
    setTmpEnd(endDate);
    setSheet('date');
  };
  const onDayPress = (day) => {
    const selected = day.dateString;
    if (!tmpStart || (tmpStart && tmpEnd)) {
      setTmpStart(selected);
      setTmpEnd(null);
    } else if (tmpStart && !tmpEnd) {
      if (selected > tmpStart) setTmpEnd(selected);
      else setTmpStart(selected);
    }
  };
  const confirmDate = () => {
    if (!tmpStart || !tmpEnd) return;
    setStartDate(tmpStart);
    setEndDate(tmpEnd);
    setSheet(null);
  };

  /* ===== 목적지 시트 (Matching 구조) ===== */
  const [regionStep, setRegionStep] = useState('province'); // 'province' | 'city'
  const [tmpProvince, setTmpProvince] = useState('선택없음');
  const [tmpCity, setTmpCity] = useState(''); // ✅ 단일 선택
  // [ADDED] 시/군 단계 확인 가능 여부: 도가 '선택없음'이면 통과, 아니면 시/군 필수
  const canConfirmCity = useMemo(() => (tmpProvince === '선택없음' || !!tmpCity), [tmpProvince, tmpCity]);
  const openRegionSheet = () => {
    setTmpProvince(selectedRegion || '선택없음');
    setTmpCity(selectedCity || '');
    setRegionStep('province');
    setSheet('region');
  };

  // ✅ 시 단일선택
  const selectTmpCity = (c) => {
    if (c === '선택없음') setTmpCity('');
    else setTmpCity(c);
  };
  const confirmRegion = () => {
    if (tmpProvince === '선택없음') {
      setSelectedRegion('선택없음');
      setSelectedCity('');
      setSheet(null);
      return;
    }
    setSelectedRegion(tmpProvince);
    setSelectedCity(tmpCity);
    setSheet(null);
  };

  /* ===== 예산 시트 (임시 상태) ===== */
  const [tmpBudget, setTmpBudget] = useState(0);
  const openBudgetSheet = () => {
    setTmpBudget(typeof budget === 'number' ? budget : 200000);
    setSheet('budget');
  };
  const confirmBudget = () => {
    setBudget(tmpBudget);
    setSheet(null);
  };

  /* ===== MBTI 시트 (임시 상태) ===== */
  const [tmpMbti, setTmpMbti] = useState(null);
  const openMbtiSheet = () => {
  setTmpMbti(selectedMbti ?? 'NONE'); // 또는 '선택없음'으로 사용하는 경우
  setSheet('mbti');
};
  const confirmMbti = () => {
    setSelectedMbti(tmpMbti);
    setSheet(null);
  };

  /* ===== 여행 스타일 시트 (임시 상태) ===== */
  const [tmpStyles, setTmpStyles] = useState([]);
  const openStyleSheet = () => {
    setTmpStyles(Array.isArray(selectedTravelStyles) ? selectedTravelStyles : []);
    setSheet('style');
  };
  const toggleTmpStyle = (s) => {
    setTmpStyles((prev) => {
      if (s === '선택없음') return [];
      const exists = prev.includes(s);
      return exists ? prev.filter((x) => x !== s) : [...prev, s];
    });
  };
  const confirmStyles = () => {
    setSelectedTravelStyles(tmpStyles);
    setSheet(null);
  };

  /* ===== 인원(그룹) 시트 (임시 상태) ===== */
  const [tmpGroup, setTmpGroup] = useState(selectedItems.group || '선택없음');
  const openGroupSheet = () => {
    setTmpGroup(selectedItems.group || '선택없음');
    setSheet('group');
  };
  const confirmGroup = () => {
    setSelectedItems((prev) => ({ ...prev, group: tmpGroup }));
    setSheet(null);
  };

  /* ===== 라벨 ===== */
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${y}.${m}.${d}`;
  };
  const dateLabel = useMemo(() => {
    if (!startDate) return '';
    return endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                   : formatDate(startDate);
  }, [startDate, endDate]);

  const destinationLabel = useMemo(() => {
    if (!selectedRegion) return '';
    if (selectedRegion === '선택없음') return '선택없음';
    return selectedCity ? `${selectedRegion} · ${selectedCity}` : `${selectedRegion} · 선택없음`;
  }, [selectedRegion, selectedCity]);

  const mbtiLabel = selectedMbti == null ? '' : (selectedMbti === 'NONE' ? '선택없음' : selectedMbti);
  const styleLabel =
    selectedTravelStyles == null
      ? ''
      : (selectedTravelStyles.length
          ? (selectedTravelStyles.length === 1
              ? selectedTravelStyles[0]
              : `${selectedTravelStyles[0]} 외 ${selectedTravelStyles.length - 1}`)
          : '선택없음');
  const groupLabel = selectedItems.group ? selectedItems.group : '';
  const budgetLabel =
  typeof budget === 'number'
    ? (budget === 0
        ? '선택없음'
        : `${budget.toLocaleString()}원 이하`)
    : '';

  /* ===== Mock 플랜 이동 (유지) ===== */
  const handleCustomPlan = () => {
    const mockData = {
      title: '모의 여행 플랜',
      startDate,
      endDate,
      destination: 'SEOUL',
      mbti: selectedMbti || 'NONE',
      travelStyle: (Array.isArray(selectedTravelStyles) && selectedTravelStyles[0]) || 'NONE',
      peopleGroup: selectedItems.group || 'NONE',
      budget,
      days: [
        {
          day: 'Day 1',
          totalEstimatedCost: 20000,
          places: [
            {
              id: uuid.v4(),
              name: '광화문',
              type: '관광',
              estimatedCost: 0,
              gptOriginalName: '경복궁',
              fromPrevious: { car: 0, publicTransport: 0, walk: 0 },
              address: '서울 종로구',
              lat: 37.5759,
              lng: 126.9769,
              description: '서울의 대표적인 관광지',
              placeOrder: 0,
            },
          ],
        },
      ],
    };
    setLoading(false);
    navigation.navigate('PlannerResponse', {
      from: 'mock',
      mock: true,
      data: mockData,
    });
  };

  /* -- 실제 API -- */
  const handleCreateSchedule = async () => {
    setLoading(true);
    // [ADDED] 안전 가드: 도 선택 시 시/군 미선택을 차단
    if (selectedRegion && selectedRegion !== '선택없음' && !selectedCity) {
      Alert.alert('안내', '시/군을 선택해 주세요.');
      setLoading(false);
      return;
    }
    try {
      const hasStyles = Array.isArray(selectedTravelStyles) && selectedTravelStyles.length > 0;
      const firstStyle = hasStyles ? selectedTravelStyles[0] : null;
      const STYLE_ENUM = {
        '액티비티':'ACTIVITY','문화/관광':'CULTURE','힐링':'HEALING',
        '맛집':'FOOD','도심':'CITY','자연':'NATURE'
      };

      // ✅ 도시 ENUM 매핑 (단일 선택 / 미선택 시 NONE)
      const cityEnum = selectedCity ? (CITY_TO_ENUM[selectedCity] || 'NONE') : 'NONE';
      const mbtiEnum = (!selectedMbti || selectedMbti === '선택없음') ? 'NONE' : selectedMbti;
      const groupEnum = ({ '선택없음':'NONE','혼자':'SOLO','단둘이':'DUO','여럿이':'GROUP' })[selectedItems.group] || 'NONE';
      const styleEnum = firstStyle ? STYLE_ENUM[firstStyle] : 'NONE';

      const data = await createSchedule(
        startDate,
        endDate,
        cityEnum,                     // ✅ 변경: City ENUM 공통맵 기반
        mbtiEnum,
        styleEnum,                    // 화면 다중 → API 첫 1개
        groupEnum,
        Number(budget || 0)
      );

      // ✅ 생성 때 사용한 요청 스냅샷을 저장 (재생성 시 최우선 참조)
      const requestSnapshot = {
        startDate,
        endDate,
        destination: cityEnum,
        mbti: mbtiEnum,
        travelStyle: styleEnum,
        peopleGroup: groupEnum,
        budget: Number(budget || 0),
      };
      try { await saveCacheData(CACHE_KEYS.PLAN_REQUEST, requestSnapshot); } catch {}

      // ✅ 생성 응답 객체에도 조건 주입 (혹시 응답에 destination 등 없을 때 대비)
      const enriched = { ...data, ...requestSnapshot };

      // ✅ 핵심: 새 드래프트 세션 시작(이전 캐시 제거 + 이번 생성본으로 초기화)
      try { await beginNewDraft(enriched); } catch {}

      const scheduleId = data?.id ?? data?.scheduleId ?? null;

      navigation.replace('PlannerResponse', {
        from: 'create',
        scheduleId,
      });

    } catch (e) {
      console.error('❌ [PlannerInfo] 일정 생성 실패:', e);
      Alert.alert('오류', e?.message === 'UNAUTHORIZED' ? '로그인이 필요합니다.' : '일정 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  /* ====== 렌더링 ====== */
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack?.()}>
          <Ionicons name="chevron-back" size={normalize(22)} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 플랜</Text>
        <View style={styles.headerRightSpace} />
      </View>

      <View style={styles.container}>
  {/* 안내 문구 영역 */}
  <View style={styles.infoBox}>
    <Text style={styles.infoTitle}>여행 일정은 필수 입력이에요</Text>
    <Text style={styles.infoSub}>그 외의 여행 스타일은 자유롭게 선택해주세요</Text>
  </View>

  <ScrollView
    style={{ flex:1 }}
    contentContainerStyle={{ paddingBottom: normalize(140, 'height') }}
    bounces
  >
          {/* 트리거 행들 */}
          <Row title="여행 일정" value={dateLabel} onPress={openDateSheet} />
          <Row title="목적지" value={destinationLabel} onPress={openRegionSheet} required={false}/>
          <Row title="인원" value={groupLabel} onPress={openGroupSheet} required={false}/>
          <Row title="예산" value={budgetLabel} onPress={openBudgetSheet} required={false}/>
          <Row title="MBTI" value={mbtiLabel} onPress={openMbtiSheet} required={false}/>
          <Row title="여행 스타일" value={styleLabel} onPress={openStyleSheet} required={false}/>
        </ScrollView>

        {/* 하단 CTA */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.ctaBtn, !isCTAEnabled && { opacity: 0.5 }]}
            onPress={handleCreateSchedule}
            disabled={!isCTAEnabled}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaText}>나만의 여행 플랜 바로 제작</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* ===== 바텀시트: 일정 (0.7) ===== */}
      <BottomSheet visible={sheet==='date'} onClose={()=>setSheet(null)} heightRatio={0.7}>
        <SheetHeader title="일정 선택" subtitle="떠나고 싶은 기간을 선택하세요" onClose={()=>setSheet(null)} />
        <View style={styles.sheetBody}>
          <Calendar
            hideDayNames={false}
            markingType={'period'}
            markedDates={getMarkedDatesTemp(tmpStart,tmpEnd)}
            onDayPress={onDayPress}
            monthFormat={'yyyy년 M월'}
            enableSwipeMonths
            firstDay={0}
            minDate={new Date().toISOString().split('T')[0]} // ⬅️ 이 줄 추가
            style={{ backgroundColor: '#fff', borderRadius: normalize(12) }}
            theme={{
              calendarBackground: '#FFFFFF',
              textDisabledColor: '#D1D5DB',
              todayTextColor: '#4F46E5',
              dayTextColor: '#111111',
              monthTextColor: '#111111',
              textMonthFontWeight: '500',
              arrowColor: '#111111',
            }}
            renderArrow={(direction) => (
              <Ionicons
                name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                size={normalize(18)}
                color="#111"
              />
            )}
          />
        </View>
        <View style={styles.sheetFixedCTA}>
          <TouchableOpacity
            onPress={confirmDate}
            disabled={!tmpStart || !tmpEnd}
            style={[styles.sheetCTA, (!tmpStart || !tmpEnd) && { opacity: 0.5 }]}
            activeOpacity={0.9}
          >
            <Text style={styles.sheetCTAText}>
              {tmpStart && tmpEnd ? `${fmtKorean(tmpStart)} ~ ${fmtKorean(tmpEnd)}` : '기간을 선택하세요'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ===== 바텀시트: 목적지 ===== */}
<BottomSheet
  visible={sheet==='region'}
  onClose={()=>setSheet(null)}
  heightRatio={regionStep==='province' ? 0.48 : getCitySheetHeightRatio(tmpProvince)}
>
  <SheetHeader
    title="이번 여행, 어디로?"
    subtitle={regionStep==='province' ? '먼저 도(광역)를 선택하세요' : '시/군을 선택하세요 (단일 선택)'}
    onClose={()=>setSheet(null)}
  />

  {/* ✅ 여기부터 BottomSheetSection으로 감싸서 CTA 위 여백 자동 보정 */}
  <BottomSheetSection
    heightRatio={regionStep==='province' ? 0.48 : getCitySheetHeightRatio(tmpProvince)}
  >
    {/* 단계 전환 탭 표시 */}
    <View style={{ flexDirection: 'row', gap: normalize(8), paddingBottom: normalize(20,'height') }}>
      <View style={[styles.stepBadge, regionStep === 'province' && styles.stepBadgeActive]}>
        <Text style={[styles.stepBadgeText, regionStep === 'province' && styles.stepBadgeTextActive]}>도 선택</Text>
      </View>
      <View style={[styles.stepBadge, regionStep === 'city' && styles.stepBadgeActive]}>
        <Text style={[styles.stepBadgeText, regionStep === 'city' && styles.stepBadgeTextActive]}>시/군 선택</Text>
      </View>
    </View>

    {regionStep==='city' ? (
      // 서울/경기도만 ScrollView
      (tmpProvince === '서울' || tmpProvince === '경기도') ? (
        <ScrollView
          // ⬇️ Section이 paddingHorizontal을 제공하므로 여기선 padding 제거
          contentContainerStyle={{ paddingBottom: normalize(8, 'height') }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.regionGrid}>
            {(CitiesByProvince[tmpProvince] ?? []).map((c) => {
              const sel = tmpCity === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.regionChip, sel && styles.regionChipSelected]}
                  onPress={()=>selectTmpCity(c)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>{c}</Text>
                  {sel && <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        // 그 외 도는 고정 View
        <View>
          <View style={styles.regionGrid}>
            {(CitiesByProvince[tmpProvince] ?? []).map((c) => {
              const sel = tmpCity === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.regionChip, sel && styles.regionChipSelected]}
                  onPress={()=>selectTmpCity(c)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>{c}</Text>
                  {sel && <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )
    ) : (
      // 'province' 단계
      <View /* ⬇️ 기존 paddingBottom(100) 제거 → Section이 자동 계산 */>
        <View style={styles.regionGrid}>
          {PROVINCE_LABELS.map((p) => {
            const sel = p === tmpProvince;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.regionChip, sel && styles.regionChipSelected]}
                onPress={()=>{ setTmpProvince(p); setTmpCity(''); }}
                activeOpacity={0.85}
              >
                <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>{p}</Text>
                {sel && <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    )}
  </BottomSheetSection>
  {/* ✅ 여기까지 Section */}

  {/* 하단 고정 2버튼 영역 (변경 없음) */}
  <View style={styles.sheetFixedRow}>
    {regionStep==='city' ? (
      <>
        <TouchableOpacity
          style={[styles.sheetCTA, { flex:1, backgroundColor:'#E5E7EB' }]}
          onPress={()=>setRegionStep('province')}
          activeOpacity={0.9}
        >
          <Text style={[styles.sheetCTAText,{ color:'#111'}]}>이전(도 선택)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sheetCTA,{ flex:1 }, !canConfirmCity && { opacity: 0.5 }]}
          onPress={canConfirmCity ? confirmRegion : undefined}
          disabled={!canConfirmCity}
          activeOpacity={0.9}
        >
          <Text style={styles.sheetCTAText} numberOfLines={1} ellipsizeMode="tail">
            {tmpProvince==='선택없음' ? '도: 선택없음' : `${tmpProvince} · ${tmpCity || '선택없음'}`}
          </Text>
        </TouchableOpacity>
      </>
    ) : (
      <>
        <TouchableOpacity
          style={[styles.sheetCTA, { flex:1, backgroundColor:'#E5E7EB' }]}
          onPress={()=>setSheet(null)}
          activeOpacity={0.9}
        >
          <Text style={[styles.sheetCTAText,{ color:'#111'}]}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sheetCTA,{ flex:1 }]}
          onPress={()=>{ if (tmpProvince==='선택없음') confirmRegion(); else setRegionStep('city'); }}
          activeOpacity={0.9}
        >
          <Text style={styles.sheetCTAText}>
            {tmpProvince==='선택없음' ? '확인' : '다음(시/군 선택)'}
          </Text>
        </TouchableOpacity>
      </>
    )}
  </View>
</BottomSheet>

      {/* ===== 바텀시트: 예산 (0.33) ===== */}
      <BottomSheet visible={sheet==='budget'} onClose={()=>setSheet(null)} heightRatio={0.37}>
        <SheetHeader title="예산 (1인 기준)" subtitle="원하는 예산을 선택하세요" onClose={()=>setSheet(null)} />
        <View style={{ paddingHorizontal: normalize(20) }}>
          <View style={[styles.budgetValueBox, tmpBudget===0 && styles.disabledBudgetBox]}>
            <Text style={[styles.budgetValueText, tmpBudget===0 && styles.disabledText]}>
  예산: {tmpBudget === 0 ? '선택없음' : `${tmpBudget.toLocaleString()}원 이하`}
</Text>
          </View>
          <Slider
            style={{ width: '100%', height: normalize(40) }}
            minimumValue={200000}
            maximumValue={1000000}
            step={10000}
            minimumTrackTintColor={tmpBudget===200000 ? '#ccc' : '#c7c4ff'}
            maximumTrackTintColor={tmpBudget===200000 ? '#eee' : '#c7c4ff'}
            thumbTintColor={tmpBudget===200000 ? '#999' : '#726BEA'}
            value={tmpBudget}
            onValueChange={setTmpBudget}
          />
        </View>
        <View style={styles.sheetFixedCTA}>
          <TouchableOpacity style={styles.sheetCTA} onPress={confirmBudget} activeOpacity={0.9}>
            <Text style={styles.sheetCTAText}>
  {tmpBudget === 0 ? '선택없음' : `${tmpBudget.toLocaleString()}원 이하로 설정`}
</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ===== 바텀시트: MBTI (0.45) ===== */}
      <BottomSheet visible={sheet==='mbti'} onClose={()=>setSheet(null)} heightRatio={0.51}>
  <SheetHeader
    title="MBTI를 선택해 주세요"
    subtitle=""
    onClose={()=>setSheet(null)}
    offset={normalize(-35, 'height')}  // ✅ 다른 시트와 동일 오프셋
  />
        <BottomSheetSection heightRatio={0.51}>
  <View style={styles.regionGrid}>
    {[
      { label: '선택없음', value: 'NONE' },
      { label: 'ISTJ', value: 'ISTJ' }, { label: 'ISFJ', value: 'ISFJ' },
      { label: 'INFJ', value: 'INFJ' }, { label: 'INTJ', value: 'INTJ' },
      { label: 'ISTP', value: 'ISTP' }, { label: 'ISFP', value: 'ISFP' },
      { label: 'INFP', value: 'INFP' }, { label: 'INTP', value: 'INTP' },
      { label: 'ESTP', value: 'ESTP' }, { label: 'ESFP', value: 'ESFP' },
      { label: 'ENFP', value: 'ENFP' }, { label: 'ENTP', value: 'ENTP' },
      { label: 'ESTJ', value: 'ESTJ' }, { label: 'ESFJ', value: 'ESFJ' },
      { label: 'ENFJ', value: 'ENFJ' }, { label: 'ENTJ', value: 'ENTJ' },
    ].map(({ label, value }) => {
      const selected = (tmpMbti ?? 'NONE') === value;
      return (
        <TouchableOpacity
          key={value}
          onPress={() => setTmpMbti(value)}
          activeOpacity={0.85}
          style={[styles.regionChip, selected && styles.regionChipSelected]}
        >
          <Text style={[styles.regionChipText, selected && styles.regionChipTextSelected]}>
            {label}
          </Text>
          {selected && (
            <Ionicons
              name="checkmark-circle"
              size={normalize(14)}
              color="#4F46E5"
              style={{ marginLeft: normalize(6) }}
            />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
        </BottomSheetSection>
        <View style={styles.sheetFixedCTA}>
          <TouchableOpacity style={styles.sheetCTA} onPress={confirmMbti} activeOpacity={0.9}>
            <Text style={styles.sheetCTAText}>{tmpMbti === 'NONE' ? '선택없음' : (tmpMbti || '선택없음')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ===== 바텀시트: 여행 스타일 (0.33) ===== */}
      <BottomSheet visible={sheet==='style'} onClose={()=>setSheet(null)} heightRatio={0.37}>
        <SheetHeader title="나의 여행 스타일은?" subtitle="여러 개를 골라도 좋아요" onClose={()=>setSheet(null)} />
        <BottomSheetSection heightRatio={0.37}>
          <View style={styles.regionGrid}>
            {/* 선택없음 */}
            <TouchableOpacity
              key="선택없음"
              style={[styles.regionChip, (tmpStyles.length=== 0) && styles.regionChipSelected]}
              onPress={()=> setTmpStyles([])}
              activeOpacity={0.85}
            >
              <Text style={[styles.regionChipText, (tmpStyles.length===0) && styles.regionChipTextSelected]}>선택없음</Text>
              {tmpStyles.length===0 && <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />}
            </TouchableOpacity>

            {["액티비티", "문화/관광", "힐링", "맛집", "도심", "자연"].map(s=>(
              <TouchableOpacity
                key={s}
                style={[styles.regionChip, tmpStyles.includes(s) && styles.regionChipSelected]}
                onPress={()=>toggleTmpStyle(s)}
                activeOpacity={0.85}
              >
                <Text style={[styles.regionChipText, tmpStyles.includes(s) && styles.regionChipTextSelected]}>
                  {s}
                </Text>
                {tmpStyles.includes(s) && <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />}
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetSection>
        <View style={styles.sheetFixedCTA}>
          <TouchableOpacity style={styles.sheetCTA} onPress={confirmStyles} activeOpacity={0.9}>
            <Text style={styles.sheetCTAText}>
              {tmpStyles.length ? (tmpStyles.length === 1 ? tmpStyles[0] : `${tmpStyles[0]} 외 ${tmpStyles.length - 1}`) : '선택없음'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ===== 바텀시트: 인원(그룹) (0.29) ===== */}
      <BottomSheet visible={sheet==='group'} onClose={()=>setSheet(null)} heightRatio={0.32}>
        <SheetHeader title="인원" subtitle="여행 인원을 선택하세요" onClose={()=>setSheet(null)} />
        <BottomSheetSection heightRatio={0.32}>
  <View style={styles.regionGrid}>
    {["선택없음", "혼자", "단둘이", "여럿이"].map((g) => {
      const sel = g === tmpGroup;
      return (
        <TouchableOpacity
          key={g}
          style={[styles.regionChip, sel && styles.regionChipSelected]}
          onPress={() => setTmpGroup(g)}
          activeOpacity={0.85}
        >
          <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>{g}</Text>
          {sel && (
            <Ionicons
              name="checkmark-circle"
              size={normalize(14)}
              color="#4F46E5"
              style={{ marginLeft: normalize(6) }}
            />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
        </BottomSheetSection>
        <View style={styles.sheetFixedCTA}>
          <TouchableOpacity style={styles.sheetCTA} onPress={confirmGroup} activeOpacity={0.9}>
            <Text style={styles.sheetCTAText}>{tmpGroup}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ===== 로딩 모달 ===== */}
      <Modal visible={loading} transparent animationType="fade">
        <SplashScreen />
      </Modal>
    </SafeAreaView>
  );
}

/* ===== 스타일 ===== */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  infoBox: {
    backgroundColor: '#4F46E50D',
    borderRadius: normalize(12),
    marginHorizontal: normalize(16),
    marginTop: normalize(16, 'height'),
    paddingVertical: normalize(14, 'height'),
    paddingHorizontal: normalize(14),
  },
  infoTitle: { 
    fontSize: normalize(15), 
    fontWeight: '500', 
    fontFamily:'Pretendard', 
    color: '#111111', 
    marginBottom: normalize(4, 'height') 
  },
  infoSub: { 
    fontSize: normalize(14),
    fontWeight: '400',
    fontFamily: 'Pretendard',
    color: '#505050' 
  },
  // 헤더
  header: {
    paddingTop: normalize(6,'height'),
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(10,'height'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  backBtn: { width: normalize(32), height: normalize(32), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'left', fontSize: normalize(18), fontWeight: '700', color: '#111827', marginLeft: normalize(6) },
  headerRightSpace: { width: normalize(32) },

  // 카드(트리거)
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: normalize(12),
    marginHorizontal: normalize(16),
    marginTop: normalize(12, 'height'),
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10, 'height'),
    borderWidth: 1,
    borderColor: '#E5E5EC',
  },
  cardHeader: { flexDirection:'row', alignItems:'center', minHeight: normalize(52,'height') },
  cardTitle: { flex:1, fontSize: normalize(16), color:'#111', fontWeight:'500' },
  rightGroup: { flexDirection:'row', alignItems:'center', gap: normalize(8), minWidth:0, flexShrink:1 },
  cardValue: { color:'#4F46E5', fontWeight:'500', fontSize: normalize(16), flexShrink:1 },
  chevronBadge: { width: normalize(28), height: normalize(28), alignItems:'center', justifyContent:'center' },

  stepBadge: {
  paddingVertical: normalize(6,'height'),
  paddingHorizontal: normalize(10),
  borderRadius: normalize(999),
  borderWidth: 1,
  borderColor: '#E5E7EB',
  backgroundColor: '#FFFFFF',
},
stepBadgeActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
stepBadgeText: { fontSize: normalize(12), color: '#374151' },
stepBadgeTextActive: { color: '#4F46E5', fontWeight: '700' },

  // 하단 CTA(화면)
  ctaWrap: { position:'absolute', left:0, right:0, bottom: normalize(16,'height'), paddingHorizontal: normalize(16) },
  ctaBtn: {
    height: normalize(52,'height'), borderRadius: normalize(12), backgroundColor:'#4F46E5',
    alignItems:'center', justifyContent:'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 3,
  },
  ctaText: { color:'#FFFFFF', fontSize: normalize(16), fontWeight:'600' },

  // 공통
  asterisk: { color:'#EF4444', fontWeight:'bold', fontSize: 18 },

  // 바텀시트 공통
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: normalize(16), borderTopRightRadius: normalize(16),
    paddingTop: normalize(32, 'height'),
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingHorizontal: normalize(16), paddingBottom: normalize(20,'height'),
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
  },
  sheetTitle: { fontSize: normalize(20), fontWeight:'500', color: '#111111' },
  sheetSub: { marginTop: normalize(4), marginBottom: normalize(4), fontSize: normalize(14), color: '#767676', fontWeight:'400' },

  // 시트 본문 & 하단 고정 CTA
  sheetBody: { paddingHorizontal: normalize(16), paddingBottom: normalize(100,'height'), flexGrow:1 },
  sheetFixedCTA: {
    position:'absolute',
    left: normalize(16),
    right: normalize(16),
    bottom: normalize(50,'height'),
  },

  
  sheetCTA: {
    height: normalize(52,'height'), borderRadius: normalize(12), backgroundColor:'#4F46E5',
    alignItems:'center', justifyContent:'center',
  },
  sheetCTAText: { color:'#fff', fontSize: normalize(16), fontWeight:'600' },

  // 칩/그리드 (Matching 기준: 1줄 4개 고정 + 간격)
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: normalize(12),
    rowGap: normalize(12,'height'),
  },
  regionChip: {
    width: (SCREEN_WIDTH - normalize(16) * 2 - normalize(12) * 3) / 4, // ✅ 4칩/줄 고정
    flexDirection:'row', alignItems:'center', justifyContent: 'center',
    paddingVertical: normalize(10,'height'), paddingHorizontal: normalize(10),
    borderRadius: normalize(12), borderWidth: 1, borderColor:'#E5E7EB', backgroundColor:'#FFFFFF',
  },
  regionChipSelected: { borderColor:'#4F46E5', backgroundColor:'#EEF2FF' },
  regionChipText: { fontSize: normalize(14), color:'#111' },
  regionChipTextSelected: { color:'#4F46E5', fontWeight:'600' },
  pillWrap: { paddingHorizontal: normalize(16) },

  // 목적지 시트 하단 2버튼 고정 행
  sheetFixedRow: {
    position:'absolute',
    left: normalize(16),
    right: normalize(16),
    bottom: normalize(50,'height'),
    flexDirection:'row',
    gap: normalize(8),
  },

  // 예산 박스
  budgetValueBox: {
    backgroundColor: '#EAE6FD',
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(20),
    alignSelf: 'center',
    marginTop: normalize(12),
    marginBottom: normalize(12),
  },
  budgetValueText: { fontSize: normalize(14), color: '#000', fontWeight:'400', textAlign:'center' },
  disabledBudgetBox: { backgroundColor: '#E6E6E6' },
  disabledText: { color: '#333' },

  // 인원(칩)
  optionGridLg: { flexDirection:'row', flexWrap:'wrap', gap: normalize(10) },
  optionChipLg: {
    flexDirection:'row', alignItems:'center',
    paddingVertical: normalize(10,'height'),
    paddingHorizontal: normalize(14),
    minHeight: normalize(40,'height'),
    borderRadius: normalize(10),
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
  },
  optionChipLgSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  optionTextLg: { fontSize: normalize(15), color: '#111111', fontWeight: '400' },

  // MBTI 컴팩트 칩
  mbtiChip: {
    flexDirection:'row',
    alignItems:'center',
    paddingVertical: normalize(10,'height'),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor:'#E5E7EB',
    backgroundColor:'#FFFFFF',
  },
  mbtiChipSelected: {
    borderColor:'#4F46E5',
    backgroundColor:'#EEF2FF',
  },
  mbtiChipText: {
    fontSize: normalize(15),
    color:'#111',
    fontWeight:'400',
  },

  // (과거 둥근 '선택없음' 버튼 스타일은 미사용)
  noneBtn: {
    paddingVertical: normalize(10,'height'),
    paddingHorizontal: normalize(18),
    borderRadius: normalize(999),
    borderWidth: 1,
  },
});
