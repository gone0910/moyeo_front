// components/matching/MatchingInfoMockScreen.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  PixelRatio,
  Platform,
  Modal,
  Animated,
  Easing,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { submitMatchingProfile } from '../../api/matching';
import { convertMatchingInputToDto } from './utils/matchingUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";

import { REGION_MAP, PROVINCE_MAP, ENUM_TO_PROVINCE_KOR, ENUM_TO_CITY_KOR } from '../../components/common/regionMap';

// 제외할 광역시 목록
const EXCLUDED_PROVINCES = ['부산', '대구', '인천', '대전', '울산', '세종', '광주'];

// 선택 시트에 표시할 도 목록 (제외 적용)
const PROVINCE_LABELS = [
  '선택없음',
  ...Object.keys(PROVINCE_MAP).filter(p => !EXCLUDED_PROVINCES.includes(p))
];

const CitiesByProvince = Object.fromEntries(
  Object.entries(REGION_MAP).map(([provKor, cities]) => [provKor, cities.map(c => c.name)])
);

const CITY_TO_ENUM = Object.values(REGION_MAP).flat().reduce((acc, { name, code }) => {
  acc[name] = code; return acc;
}, {});

const USE_MOCK = true;

/* ---------------- normalize ---------------- */
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


/* ---------------- Enums (화면 표기 ↔ 서버 ENUM) ---------------- */
// 도(광역)


// 시/군(한글 → 서버 ENUM)


// 도별 시/군 목록(한글 라벨 배열)


// 도별 시/군 개수에 따른 시트 높이 비율 계산
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

function formatProvinceCitySummary(province, cities) {
  // '선택없음' 도시가 선택 배열에 섞여 들어온 경우를 대비해 필터링
  const list = (cities || []).filter(c => c && c !== '선택없음');

  // 도 자체가 '선택없음'이면 그대로 노출
  if (province === '선택없음') return '선택없음';

  // 도시 미선택
  if (list.length === 0) return `${province} - 선택없음`;

  // 도시 1개
  if (list.length === 1) return `${province} - ${list[0]}`;

  // 도시 2개 이상
  return `${province} - ${list[0]} 외 ${list.length - 1}`;
}

/* ---------------- 달력 유틸 ---------------- */
function fmtKorean(date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
function buildMarked(start, end) {
  if (!start) return {};
  const res = {
    [start]: { startingDay: true, endingDay: !end, color: '#4F46E5', textColor: '#fff' },
  };
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    let cur = new Date(s);
    while (cur < e) {
      cur.setDate(cur.getDate() + 1);
      const ymd = cur.toISOString().slice(0, 10);
      if (ymd !== end) res[ymd] = { color: '#E3E0FF', textColor: '#111' };
    }
    res[end] = { endingDay: true, color: '#4F46E5', textColor: '#fff' };
  }
  return res;
}
// style 왼쪽으로 밀리는거 해결 로직
function formatDotList(arr, max = 2) {
  if (!arr || arr.length === 0) return '선택없음';
  const shown = arr.slice(0, max).join(' · ');
  const rest = arr.length - max;
  return rest > 0 ? `${shown} · 외 ${rest}` : shown;
}

/* ---------------- 메인 화면 ---------------- */
export default function MatchingInfoMockScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  // 이 화면에서만 탭바 숨김
  useEffect(() => {
    const parent = navigation.getParent();
    if (isFocused) parent?.setOptions({ tabBarStyle: { display: 'none' } });
    else parent?.setOptions({ tabBarStyle: undefined });
  }, [isFocused, navigation]);

  // 선택값
  const [selected, setSelected] = useState({
    periodStart: null,
  periodEnd: null,
  province: null,   
  cities: [],
  group: null,      
  style: null,
  gender: null,     
  ageRange: null,  
});

  const periodLabel = useMemo(() => {
    const { periodStart, periodEnd } = selected;
    if (!periodStart) return '';
    const toTxt = (d) => {
      const t = new Date(d);
      return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(2, '0')}.${String(
        t.getDate()
      ).padStart(2, '0')}`;
    };
    return periodEnd ? `${toTxt(periodStart)} - ${toTxt(periodEnd)}` : toTxt(periodStart);
  }, [selected]);

  const regionLabel = useMemo(() => {
  const { province, cities } = selected;
  if (!province) return '';
  if (province === '선택없음') return '선택없음';
  const cityText = cities?.length ? formatDotList(cities, 1) : '선택없음';
  return `${province} ${cityText}`;
}, [selected]);

const styleLabel = useMemo(() => {
  if (!selected.style) return '';  
  return selected.style.length === 0
    ? '선택없음'
    : formatDotList(selected.style, 1);
}, [selected.style]);
  const ageLabel = useMemo(() => selected.ageRange || '', [selected.ageRange]);
  const canSubmit = !!selected.periodStart && !!selected.periodEnd;

  // 어떤 바텀시트인지
  const [sheet, setSheet] = useState(null);

  /* ---------- 날짜 시트(임시 상태) ---------- */
  const [tmpStart, setTmpStart] = useState(null);
  const [tmpEnd, setTmpEnd] = useState(null);
  const openDateSheet = () => {
    setTmpStart(selected.periodStart);
    setTmpEnd(selected.periodEnd);
    setSheet('date');
  };
  const onDayPress = (day) => {
    const date = day.dateString;
    if (!tmpStart || (tmpStart && tmpEnd)) {
      setTmpStart(date);
      setTmpEnd(null);
    } else if (tmpStart && !tmpEnd) {
      if (date >= tmpStart) setTmpEnd(date);
      else {
        setTmpStart(date);
        setTmpEnd(null);
      }
    }
  };
  const confirmDate = () => {
    if (!tmpStart || !tmpEnd) return;
    setSelected((s) => ({ ...s, periodStart: tmpStart, periodEnd: tmpEnd }));
    setSheet(null);
  };

  /* ---------- 지역 시트(도 → 시/군 다중선택) ---------- */
  const [regionStep, setRegionStep] = useState('province'); // 'province' | 'city'
  const [tmpProvince, setTmpProvince] = useState('선택없음');
  const [tmpCities, setTmpCities] = useState([]);
  const openRegionSheet = () => {
    setTmpProvince(selected.province);
    setTmpCities(selected.cities);
    setRegionStep('province');
    setSheet('region');
  };

  // ✅ 변경: 시/군 다중 토글
  const toggleCity = (c) => {
    setTmpCities((prev) => {
      if (c === '선택없음') return [];
      const exists = prev.includes(c);
      return exists ? prev.filter((x) => x !== c) : [...prev, c];
    });
  };

  const confirmRegion = () => {
    if (tmpProvince === '선택없음') {
      setSelected((s) => ({ ...s, province: '선택없음', cities: [] }));
      setSheet(null);
      return;
    }
    setSelected((s) => ({ ...s, province: tmpProvince, cities: tmpCities }));
    setSheet(null);
  };

  /* ---------- 그룹 시트 ---------- */
  const GROUP_OPTIONS = ['선택없음', '단둘이', '여럿이'];
  const [tmpGroup, setTmpGroup] = useState('선택없음');
  const openGroupSheet = () => {
    setTmpGroup(selected.group);
    setSheet('group');
  };
  const confirmGroup = () => {
    setSelected((s) => ({ ...s, group: tmpGroup }));
    setSheet(null);
  };

  /* ---------- 스타일 시트(다중 선택) ---------- */
  const STYLE_OPTIONS = ['액티비티', '문화/관광', '힐링', '맛집', '도심', '자연'];
  const [tmpStyle, setTmpStyle] = useState([]);
  const openStyleSheet = () => {
   setTmpStyle(Array.isArray(selected.style) ? selected.style : []);
   setSheet('style');
 };
  const toggleStyle = (v) => {
    setTmpStyle((prev) => {
      if (v === '선택없음') return [];
      const exists = prev.includes(v);
      const next = exists ? prev.filter((x) => x !== v) : [...prev, v];
      return next;
    });
  };
  const confirmStyle = () => {
    setSelected((s) => ({ ...s, style: tmpStyle }));
    setSheet(null);
  };

  /* ---------- 성별 시트 ---------- */
  const GENDER_OPTIONS = ['선택없음', '남성', '여성'];
  const [tmpGender, setTmpGender] = useState('선택없음');
  const openGenderSheet = () => {
    setTmpGender(selected.gender);
    setSheet('gender');
  };
  const confirmGender = () => {
    setSelected((s) => ({ ...s, gender: tmpGender }));
    setSheet(null);
  };

  /* ---------- 연령대 시트(단일 선택) ---------- */
  const AGE_OPTIONS = ['선택없음', '10대', '20대', '30대', '40대', '50대', '60대 이상'];
  const [tmpAge, setTmpAge] = useState('선택없음');
  const openAgeSheet = () => {
    setTmpAge(selected.ageRange || '선택없음');
    setSheet('age');
  };
  const confirmAge = () => {
    setSelected((s) => ({ ...s, ageRange: tmpAge }));
    setSheet(null);
  };

  /* ---------- 제출 ---------- */
  const onSubmit = async () => {
    // canSubmit(날짜 필수) 체크 및 중복 제출 방지
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('jwt');

      // 1. rawInput 생성: 신규 버전(selected)의 상태를 matchingUtils가 기대하는 형식으로 조립
      const rawInput = {
        startDate: selected.periodStart, //
        endDate: selected.periodEnd, //

        // province: "서울" -> "SEOUL" (파일 내장 Province 맵 사용)
        province: PROVINCE_MAP[selected.province] || 'NONE', //

        // cities: ["강남구"] -> ["GANGNAM_GU"] (파일 내장 City 맵 사용)
        selectedCities: selected.cities.length
          ? selected.cities.map(c => CITY_TO_ENUM[c]).filter(Boolean) //
          : ['NONE'],

        // 나머지: 한글 라벨 그대로 전달 (DTO 유틸이 변환)
        groupType: selected.group || '선택없음', //
        ageRange: selected.ageRange || '선택없음', //
        travelStyles: selected.style?.length ? selected.style : ['선택없음'], //
        preferenceGender: selected.gender || '선택없음', //
      };

      // 2. DTO 변환: 외부 유틸(matchingUtils.js) 사용
      const dto = convertMatchingInputToDto(rawInput); //
      console.log('📦 백엔드 전송 DTO:', dto);

      // 3. API 전송: 실제 API 함수(matching.js) 호출
      await submitMatchingProfile(dto, token); //
      
      console.log('✅ 백엔드 응답 성공');
      navigation.navigate('MatchingList'); //

    } catch (error) {
      console.error('❌ 매칭 정보 전송 실패:', error); //
      Alert.alert('오류', '매칭 조건 전송에 실패했습니다.'); //
    } finally {
      setIsSubmitting(false); //
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack?.()}>
            <Ionicons name="chevron-back" size={normalize(22)} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>동행자 찾기</Text>
          <View style={styles.headerRightSpace} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: normalize(140, 'height') }}
          bounces
        >
          {/* 안내 박스 */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>여행 일정은 필수 입력이에요</Text>
            <Text style={styles.infoSub}>그 외의 여행 스타일은 자유롭게 선택해주세요</Text>
          </View>

          {/* 행들 */}
          <Row title="여행 일정" value={periodLabel} onPress={openDateSheet} required />
          <Row title="이번 여행, 어디로?" value={regionLabel} onPress={openRegionSheet} />
          <Row title="몇 명이 좋을까?" value={selected.group} onPress={openGroupSheet} />
          <Row title="나의 여행 스타일은?" value={styleLabel} onPress={openStyleSheet} />
          <Row
            title="선호하는 동행자의 성별?"
            value={!selected.gender ? '' : selected.gender}
            onPress={openGenderSheet}
          />
          <Row title="선호하는 동행자의 나이는?" value={ageLabel} onPress={openAgeSheet} />
        </ScrollView>

        {/* 하단 CTA */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            activeOpacity={0.9}
            // [수정] !canSubmit 뒤에 || isSubmitting 조건 추가
            disabled={!canSubmit || isSubmitting}
            style={[styles.ctaBtn, (!canSubmit || isSubmitting) && { opacity: 0.5 }]}
            onPress={onSubmit}
          >
            <Text style={styles.ctaText}>함께할 여행자 찾아보기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------- 날짜 선택 시트 ---------- */}
      <BottomSheet visible={sheet === 'date'} onClose={() => setSheet(null)} heightRatio={0.7}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>일정 선택</Text>
            <Text style={styles.sheetSub}>떠나고 싶은 기간을 선택하세요</Text>
          </View>
          <TouchableOpacity
  onPress={() => setSheet(null)}
  hitSlop={8}
  style={{ marginTop: normalize(-55, 'height') }}  
>
  <Ionicons name="close" size={normalize(22)} color="#111" />
</TouchableOpacity>
        </View>

        <View style={styles.sheetBody}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.calendarContainer}
          >
            <Calendar
              markingType="period"
              markedDates={buildMarked(tmpStart, tmpEnd)}
              onDayPress={onDayPress}
              monthFormat={'yyyy년 M월'}
              hideExtraDays={false}
              enableSwipeMonths
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
              firstDay={0}
            />
          </ScrollView>
        </View>

        {/* 하단 고정 CTA */}
        <View style={styles.sheetFixedCTA}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={confirmDate}
            disabled={!tmpStart || !tmpEnd}
            style={[styles.sheetCTA, (!tmpStart || !tmpEnd) && { opacity: 0.5 }]}
          >
            <Text style={styles.sheetCTAText}>
              {tmpStart && tmpEnd ? `${fmtKorean(tmpStart)} ~ ${fmtKorean(tmpEnd)}` : '기간을 선택하세요'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ---------- 지역 선택 시트 ---------- */}
      <BottomSheet
        visible={sheet === 'region'}
        onClose={() => setSheet(null)}
        heightRatio={regionStep === 'province' ? 0.48 : getCitySheetHeightRatio(tmpProvince)}
      >
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>이번 여행, 어디로?</Text>
            <Text style={styles.sheetSub}>
              {regionStep === 'province' ? '먼저 도(광역)를 선택하세요' : '시/군을 자유롭게 선택하세요 (복수 선택 가능)'}
            </Text>
          </View>
          <TouchableOpacity
  onPress={() => setSheet(null)}
  hitSlop={8}
  style={{ marginTop: normalize(-55, 'height') }}  // ✅ 여기에!
>
  <Ionicons name="close" size={normalize(22)} color="#111" />
</TouchableOpacity>
        </View>

        {/* 단계 전환 탭 표시 */}
        <View style={{ flexDirection: 'row', gap: normalize(8), paddingHorizontal: normalize(16), paddingBottom: normalize(20,'height') }}>
          <View style={[styles.stepBadge, regionStep === 'province' && styles.stepBadgeActive]}>
            <Text style={[styles.stepBadgeText, regionStep === 'province' && styles.stepBadgeTextActive]}>도 선택</Text>
          </View>
          <View style={[styles.stepBadge, regionStep === 'city' && styles.stepBadgeActive]}>
            <Text style={[styles.stepBadgeText, regionStep === 'city' && styles.stepBadgeTextActive]}>시/군 선택</Text>
          </View>
        </View>

{regionStep === 'city' ? (
  // 서울/경기도만 스크롤
  (tmpProvince === '서울' || tmpProvince === '경기도') ? (
    <ScrollView
      style={{ paddingHorizontal: normalize(16) }}
      contentContainerStyle={{ paddingBottom: normalize(20, 'height') }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.regionGrid}>
        {/* 선택없음 */}
        <TouchableOpacity
          key="선택없음"
          style={[styles.regionChip, (tmpCities.length === 0) && styles.regionChipSelected]}
          onPress={() => setTmpCities([])}
          activeOpacity={0.85}
        >
          <Text style={[styles.regionChipText, (tmpCities.length === 0) && styles.regionChipTextSelected]}>
            선택없음
          </Text>
          {tmpCities.length === 0 && (
            <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />
          )}
        </TouchableOpacity>

        {(CitiesByProvince[tmpProvince] ?? []).map((c) => {
          const sel = tmpCities.includes(c);
          return (
            <TouchableOpacity
              key={c}
              style={[styles.regionChip, sel && styles.regionChipSelected]}
              onPress={() => toggleCity(c)}
              activeOpacity={0.85}
            >
              <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>{c}</Text>
              {sel && (
                <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  ) : (
    // 그 외 도는 고정 View
    <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(20, 'height') }}>
      <View style={styles.regionGrid}>
        {/* 선택없음 */}
        <TouchableOpacity
          key="선택없음"
          style={[styles.regionChip, (tmpCities.length === 0) && styles.regionChipSelected]}
          onPress={() => setTmpCities([])}
          activeOpacity={0.85}
        >
          <Text style={[styles.regionChipText, (tmpCities.length === 0) && styles.regionChipTextSelected]}>
            선택없음
          </Text>
          {tmpCities.length === 0 && (
            <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />
          )}
        </TouchableOpacity>

        {(CitiesByProvince[tmpProvince] ?? []).map((c) => {
          const sel = tmpCities.includes(c);
          return (
            <TouchableOpacity
              key={c}
              style={[styles.regionChip, sel && styles.regionChipSelected]}
              onPress={() => toggleCity(c)}
              activeOpacity={0.85}
            >
              <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>{c}</Text>
              {sel && (
                <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  )
) : (
  // 'province' 단계
  <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(100, 'height') }}>
    <View style={styles.regionGrid}>
      {PROVINCE_LABELS.map((p) => {
        const sel = p === tmpProvince;
        return (
          <TouchableOpacity
            key={p}
            style={[styles.regionChip, sel && styles.regionChipSelected]}
            onPress={() => { setTmpProvince(p); setTmpCities([]); }} // 도 바꾸면 시/군 초기화
            activeOpacity={0.85}
          >
            <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>{p}</Text>
            {sel && (
              <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
)}


        {/* 하단 고정 CTA */}
        <View style={styles.sheetFixedCTA}>
          {regionStep === 'city' ? (
            <View style={{ flexDirection: 'row', gap: normalize(8) }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setRegionStep('province')}
                style={[styles.sheetCTA, { flex: 1, backgroundColor: '#E5E7EB' }]}
              >
                <Text style={[styles.sheetCTAText, { color: '#111' }]}>이전(도 선택)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={confirmRegion}
                style={[styles.sheetCTA, { flex: 1 }]}
              >
                <Text style={styles.sheetCTAText} numberOfLines={1} ellipsizeMode="tail">
              {formatProvinceCitySummary(tmpProvince, tmpCities)}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: normalize(8) }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setSheet(null)}
                style={[styles.sheetCTA, { flex: 1, backgroundColor: '#E5E7EB' }]}
              >
                <Text style={[styles.sheetCTAText, { color: '#111' }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
  activeOpacity={0.9}
  disabled={!tmpProvince} // ✅ 도가 null일 때만 비활성화
  onPress={() => {
    if (tmpProvince === '선택없음') confirmRegion();
    else setRegionStep('city');
  }}
  style={[
    styles.sheetCTA,
    { flex: 1 },
    !tmpProvince && { opacity: 0.5 }, // 선택 안 됐을 때만 흐리게
  ]}
>
  <Text style={styles.sheetCTAText}>
    {tmpProvince === '선택없음' ? '확인' : '다음(시/군 선택)'}
  </Text>
</TouchableOpacity>
            </View>
          )}
        </View>
      </BottomSheet>

      {/* ---------- 그룹(인원) 선택 시트 ---------- */}
      <BottomSheet visible={sheet === 'group'} onClose={() => setSheet(null)} heightRatio={0.31}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>몇 명이 좋을까?</Text>
            <Text style={styles.sheetSub}>그룹 유형을 선택하세요</Text>
          </View>
        <TouchableOpacity
  onPress={() => setSheet(null)}
  hitSlop={8}
  style={{ marginTop: normalize(-55, 'height') }}  // ✅ 여기에!
>
  <Ionicons name="close" size={normalize(22)} color="#111" />
</TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(20, 'height') }}>
          <View style={styles.optionGridLg}>
            {['선택없음', '단둘이', '여럿이'].map((g) => {
              const sel = g === tmpGroup;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.optionChipLg, sel && styles.optionChipLgSelected]}
                  onPress={() => setTmpGroup(g)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.optionTextLg, sel && { color: '#4F46E5' }]}>{g}</Text>
                  {sel && (
                    <Ionicons
                      name="checkmark-circle"
                      size={normalize(18)}
                      color="#4F46E5"
                      style={{ marginLeft: normalize(8) }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.sheetFixedCTA}>
    <TouchableOpacity activeOpacity={0.9} onPress={confirmGroup} style={styles.sheetCTA}>
      <Text style={styles.sheetCTAText}>{tmpGroup || '선택없음'}</Text>
    </TouchableOpacity>
  </View>
      </BottomSheet>

      {/* ---------- 여행 스타일 선택 시트 (다중) ---------- */}
      <BottomSheet visible={sheet === 'style'} onClose={() => setSheet(null)} heightRatio={0.37}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>나의 여행 스타일은?</Text>
            <Text style={styles.sheetSub}>여러 개를 골라도 좋아요</Text>
          </View>
          <TouchableOpacity
  onPress={() => setSheet(null)}
  hitSlop={8}
  style={{ marginTop: normalize(-55, 'height') }}  // ✅ 여기에!
>
  <Ionicons name="close" size={normalize(22)} color="#111" />
</TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(20, 'height') }}>
          <View style={styles.regionGrid}>
            {/* 선택없음 */}
            <TouchableOpacity
              key="선택없음"
              style={[styles.regionChip, ((tmpStyle?.length ?? 0) === 0) && styles.regionChipSelected]}
              onPress={() => setTmpStyle([])}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.regionChipText,
                  ((tmpStyle?.length ?? 0) === 0) && styles.regionChipTextSelected,
                ]}
              >
                선택없음
              </Text>
              {tmpStyle.length === 0 && (
                <Ionicons
                  name="checkmark-circle"
                  size={normalize(14)}
                  color="#4F46E5"
                  style={{ marginLeft: normalize(6) }}
                />
              )}
            </TouchableOpacity>

            {STYLE_OPTIONS.map((s) => {
              const sel = (tmpStyle ?? []).includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.regionChip, sel && styles.regionChipSelected]}
                  onPress={() => toggleStyle(s)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>
                    {s}
                  </Text>
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
        </View>
        <View style={styles.sheetFixedCTA}>
    <TouchableOpacity activeOpacity={0.9} onPress={confirmStyle} style={styles.sheetCTA}>
      <Text style={styles.sheetCTAText}>
        {(tmpStyle?.length ?? 0) ? tmpStyle.join(' · ') : '선택없음'}
      </Text>
    </TouchableOpacity>
  </View>
      </BottomSheet>

      {/* ---------- 성별 선택 시트 ---------- */}
      <BottomSheet visible={sheet === 'gender'} onClose={() => setSheet(null)} heightRatio={0.31}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>선호하는 동행자의 성별?</Text>
            <Text style={styles.sheetSub}>선호가 없다면 ‘선택없음’을 선택하세요</Text>
          </View>
          <TouchableOpacity
  onPress={() => setSheet(null)}
  hitSlop={8}
  style={{ marginTop: normalize(-55, 'height') }}  // ✅ 여기에!
>
  <Ionicons name="close" size={normalize(22)} color="#111" />
</TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(20, 'height') }}>
          <View style={styles.optionGridLg}>
  {['선택없음', '남성', '여성'].map((g) => {
    const sel = g === tmpGender || (!tmpGender && g === '선택없음');
    return (
      <TouchableOpacity
        key={g}
        style={[styles.optionChipLg, sel && styles.optionChipLgSelected]}
        onPress={() => setTmpGender(g)}
        activeOpacity={0.85}
      >
        <Text style={[styles.optionTextLg, sel && styles.optionTextLgSelected]}>{g}</Text>
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
        </View>
        <View style={styles.sheetFixedCTA}>
    <TouchableOpacity activeOpacity={0.9} onPress={confirmGender} style={styles.sheetCTA}>
      <Text style={styles.sheetCTAText}>{tmpGender || '선택없음'}</Text>
    </TouchableOpacity>
  </View>
      </BottomSheet>

      {/* ---------- 연령대 선택 시트 ---------- */}
      <BottomSheet visible={sheet === 'age'} onClose={() => setSheet(null)}  heightRatio={0.37}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>어느 연령대가 편하신가요?</Text>
            <Text style={styles.sheetSub}>선택없음을 누르면 제한이 없습니다</Text>
          </View>
          <TouchableOpacity
  onPress={() => setSheet(null)}
  hitSlop={8}
  style={{ marginTop: normalize(-55, 'height') }}  // ✅ 여기에!
>
  <Ionicons name="close" size={normalize(22)} color="#111" />
</TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(20, 'height') }}>
          <View style={styles.regionGrid}>
            {['선택없음', '10대', '20대', '30대', '40대', '50대', '60대 이상'].map((age) => {
              const sel = tmpAge === age;
              return (
                <TouchableOpacity
                  key={age}
                  style={[styles.regionChip, sel && styles.regionChipSelected]}
                  onPress={() => setTmpAge(age)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>
                    {age}
                  </Text>
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
        </View>
        <View style={styles.sheetFixedCTA}>
    <TouchableOpacity activeOpacity={0.9} onPress={confirmAge} style={styles.sheetCTA}>
      <Text style={styles.sheetCTAText}>{tmpAge}</Text>
    </TouchableOpacity>
  </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

/* ---------------- 공용 BottomSheet ---------------- */
function BottomSheet({ visible, onClose, children, maxHeightRatio, minHeightRatio, heightRatio }) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  // 높이 계산 (비율 → px)
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

/* ---------------- 행 컴포넌트 ---------------- */
function Row({ title, value, onPress, required=false }) {
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

/* ---------------- 스타일 ---------------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  // 헤더
  header: {
    paddingTop: normalize(6, 'height'),
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(10, 'height'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  backBtn: { width: normalize(32), height: normalize(32), justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    flex: 1, textAlign: 'left', fontSize: normalize(18),
    fontWeight: '700', color: '#111827', marginLeft: normalize(6)
  },
  headerRightSpace: { width: normalize(32) },

  // 안내 박스
  scroll: { flex: 1 },
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

  // 행(카드)
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', minHeight: normalize(52, 'height') },
  cardTitle: { flex: 1, fontSize: normalize(16), color: '#111111', fontWeight: '500', fontFamily: 'Pretendard' },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    minWidth: 0,
    flexShrink: 1,
  },

  cardValue: {
    color: '#4F46E5',
    fontWeight: '500',
    fontFamily: 'Pretendard',
    fontSize: normalize(16),
    flexShrink: 1,
  },
  chevronBadge: {
    width: normalize(28), height: normalize(28),
    backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center',
  },

  // 첨부
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    paddingVertical: normalize(8, 'height'),
    paddingHorizontal: normalize(10),
    borderRadius: normalize(10),
    backgroundColor: '#EEF2FF',
  },
  attachText: { color: '#4F46E5', fontWeight: '600', fontSize: normalize(13) },
  attachHint: { marginTop: normalize(8,'height'), color: '#6B7280', fontSize: normalize(13) },

  removeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    paddingVertical: normalize(6, 'height'),
    paddingHorizontal: normalize(10),
    borderRadius: normalize(999),
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeChipText: { color: '#DC2626', fontWeight: '600', fontSize: normalize(12) },

  // 하단 CTA
  ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: normalize(16, 'height'), paddingHorizontal: normalize(16) },
  ctaBtn: {
    height: normalize(52, 'height'), borderRadius: normalize(12), backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 3,
  },
  ctaText: { color: '#FFFFFF', fontSize: normalize(16), fontFamily:'Pretendard', fontWeight: '600' },

  // BottomSheet 공통
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: normalize(16), borderTopRightRadius: normalize(16),
    paddingTop: normalize(32, 'height'),
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingHorizontal: normalize(16), paddingBottom: normalize(20, 'height'),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sheetTitle: { fontSize: normalize(20), fontWeight: '500',fontFamily:'Pretendard', color: '#111111' },
  sheetSub: { marginTop: normalize(4), marginBottom: normalize(4), fontSize: normalize(14), fontFamily:'Pretendard', color: '#767676',fontWeight:'400' },
  sheetCTA: {
    height: normalize(52, 'height'), borderRadius: normalize(12), backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetCTAText: { color: '#ffffff', fontSize: normalize(16), fontWeight: '600' },

  // 칩/토글 공통
 regionGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'flex-start', // space-between 대신 flex-start
  columnGap: normalize(12),     // ✅ 가로 간격
  rowGap: normalize(12, 'height'), // ✅ 세로 간격
},
  regionChip: {
  width: (SCREEN_WIDTH - normalize(16) * 2 - normalize(12) * 3) / 4, // ✅ 한 줄 4개 고정 (간격 고려)
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: normalize(10, 'height'),
  borderRadius: normalize(12),
  borderWidth: 1,
  borderColor: '#E5E7EB',
  backgroundColor: '#FFFFFF',
},
  regionChipSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  regionChipText: { fontSize: normalize(14), color: '#111111' },
  regionChipTextSelected: { color: '#4F46E5', fontWeight: '600' },

  // 단계 뱃지
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

  // 공용 토큰
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: normalize(8), marginTop: normalize(8,'height') },
  pill: {
    paddingVertical: normalize(8, 'height'),
    paddingHorizontal: normalize(12),
    backgroundColor: '#F8FAFC',
    borderRadius: normalize(999),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillText: { fontSize: normalize(13), color: '#374151' },
  asterisk: { color:'#EF4444', fontWeight:'bold', fontSize: 18 },
  optionGridLg: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: normalize(12),
    rowGap: normalize(12, 'height'),
  },
  optionChipLg: {
    width: (SCREEN_WIDTH - normalize(16) * 2 - normalize(12) * 3) / 4, // 한 줄 4개 고정
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(10, 'height'),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  optionChipLgSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  optionTextLg: {
    fontSize: normalize(14),
    color: '#111111',
    fontWeight: '400',
  },

  sheetBody: {
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(80, 'height'),
    flexGrow: 1,
  },
  calendarContainer: { minHeight: normalize(320, 'height') },

  // 시트 하단 고정 CTA
  sheetFixedCTA: {
    position: 'absolute',
    left: normalize(16),
    right: normalize(16),
    bottom: normalize(50, 'height'),
  },
});