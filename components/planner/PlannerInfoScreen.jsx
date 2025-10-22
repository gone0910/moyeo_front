// components/planner/PlannerInfoScreen.jsx
import  { useState, useContext, useRef, useEffect, useMemo } from 'react';
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
  ActivityIndicator, // [ADDED] 로딩 인디케이터
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { UserContext } from '../../contexts/UserContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveCacheData, CACHE_KEYS } from '../../caching/cacheService';
import axios from 'axios';
import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import SplashScreen from '../../components/common/SplashScreen';
import { createSchedule } from '../../api/planner_create_request';
import { defaultTabBarStyle } from '../../navigation/BottomTabNavigator';

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

/* ===== 공통 바텀시트 ===== */
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
function SheetHeader({ title, subtitle, onClose }) {
  return (
    <View style={styles.sheetHeader}>
      <View>
        <Text style={styles.sheetTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.sheetSub}>{subtitle}</Text>}
      </View>
      <TouchableOpacity onPress={onClose} hitSlop={8}>
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
    [start]: { startingDay: true, endingDay: !end, color: '#000', textColor: '#fff' },
  };
  if (start && end) {
    let cur = new Date(start);
    const e = new Date(end);
    while (cur < e) {
      cur.setDate(cur.getDate() + 1);
      const s = cur.toISOString().slice(0,10);
      if (s !== end) marked[s] = { color:'#E3E0FF', textColor:'#111' };
    }
    marked[end] = { endingDay: true, color: '#000', textColor:'#fff' };
  }
  return marked;
}

/* ===== 목적지 시트 높이(파일 값) ===== */
function getCitySheetHeightRatio(province) {
  if (province === '선택없음') return 0.30;
  if (province === '서울') return 0.597;
  if (province === '제주') return 0.335;
  if (province === '경기도') return 0.65;
  if (province === '강원도') return 0.388;
  if (province === '충청북도') return 0.335;
  if (province === '충청남도') return 0.44;
  if (province === '전라북도') return 0.388;
  if (province === '전라남도') return 0.388;
  if (province === '경상북도') return 0.44;
  if (province === '경상남도') return 0.44;
  return 0.36;
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

  // 목적지
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

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

  // 여행 스타일(다중)
  const [selectedTravelStyles, setSelectedTravelStyles] = useState(null);

  // 하단 CTA 활성 조건
  const isDateSelected = !!startDate && !!endDate;

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

  /* ===== 목적지 ENUM ===== */
  const Province = {
    '선택없음': 'NONE',
    '서울': 'SEOUL',
    '제주': 'JEJU',
    '경기도': 'GYEONGGI',
    '강원도': 'GANGWON',
    '충청북도': 'CHUNGBUK',
    '충청남도': 'CHUNGNAM',
    '전라북도': 'JEONBUK',
    '전라남도': 'JEONNAM',
    '경상북도': 'GYEONGBUK',
    '경상남도': 'GYEONGNAM',
  };
  const City = {
    // 서울
    '강남구': 'GANGNAM_GU', '강동구': 'GANGDONG_GU', '강북구': 'GANGBUK_GU', '강서구': 'GANGSEO_GU',
    '관악구': 'GWANAK_GU', '광진구': 'GWANGJIN_GU', '구로구': 'GURO_GU', '금천구': 'GEUMCHEON_GU',
    '노원구': 'NOWON_GU', '도봉구': 'DOBONG_GU', '동대문구': 'DONGDAEMUN_GU', '동작구': 'DONGJAK_GU',
    '마포구': 'MAPO_GU', '서대문구': 'SEODAEMUN_GU', '서초구': 'SEOCHO_GU', '성동구': 'SEONGDONG_GU',
    '성북구': 'SEONGBUK_GU', '송파구': 'SONGPA_GU', '양천구': 'YANGCHEON_GU', '영등포구': 'YEONGDEUNGPO_GU',
    '용산구': 'YONGSAN_GU', '은평구': 'EUNPYEONG_GU', '종로구': 'JONGNO_GU', '중구': 'JUNG_GU', '중랑구': 'JUNGNANG_GU',
    // 제주
    '제주시': 'JEJU_SI', '서귀포시': 'SEOGWIPO_SI',
    // 경기도
    '수원시': 'SUWON_SI', '성남시': 'SEONGNAM_SI', '고양시': 'GOYANG_SI', '용인시': 'YONGIN_SI',
    '부천시': 'BUCHEON_SI', '안산시': 'ANSAN_SI', '안양시': 'ANYANG_SI', '남양주시': 'NAMYANGJU_SI',
    '화성시': 'HWASEONG_SI', '평택시': 'PYEONGTAEK_SI', '의정부시': 'UIJEONGBU_SI', '파주시': 'PAJU_SI',
    '시흥시': 'SIHEUNG_SI', '김포시': 'GIMPO_SI', '광명시': 'GWANGMYEONG_SI', '군포시': 'GUNPO_SI',
    '이천시': 'ICHEON_SI', '오산시': 'OSAN_SI', '하남시': 'HANAM_SI', '양주시': 'YANGJU_SI',
    '구리시': 'GURI_SI', '안성시': 'ANSEONG_SI', '포천시': 'POCHEON_SI', '의왕시': 'UIWANG_SI',
    '여주시': 'YEOJU_SI', '양평군': 'YANGPYEONG_GUN', '동두천시': 'DONGDUCHEON_SI', '과천시': 'GWACHEON_SI',
    '가평군': 'GAPYEONG_GUN', '연천군': 'YEONCHEON_GUN',
    '광주시': 'GWANGJU_GYEONGGI_SI', // [ADDED] 경기도 광주시 (백엔드 ENUM 확인 필요)
    // 강원특별자치도
    '춘천시': 'CHUNCHEON_SI', '원주시': 'WONJU_SI', '강릉시': 'GANGNEUNG_SI', '동해시': 'DONGHAE_SI',
    '태백시': 'TAEBAEK_SI', '속초시': 'SOKCHO_SI', '삼척시': 'SAMCHEOK_SI',
    // 충청북도
    '청주시': 'CHEONGJU_SI', '충주시': 'CHUNGJU_SI', '제천시': 'JECHEON_SI',
    // 충청남도
    '천안시': 'CHEONAN_SI', '공주시': 'GONGJU_SI', '보령시': 'BOREONG_SI', '아산시': 'ASAN_SI', '서산시': 'SEOSAN_SI',
    '논산시': 'NONSAN_SI', '계룡시': 'GYERYONG_SI', '당진시': 'DANGJIN_SI', '부여군': 'BUYEO_GUN', '홍성군': 'HONGSEONG_GUN',
    // 전라북도
    '전주시': 'JEONJU_SI', '군산시': 'GUNSAN_SI', '익산시': 'IKSAN_SI', '정읍시': 'JEONGEUP_SI', '남원시': 'NAMWON_SI',
    '김제시': 'GIMJE_SI', '순창군': 'SUNCHANG_GUN',
    // 전라남도
    '목포시': 'MOKPO_SI', '여수시': 'YEOSU_SI', '순천시': 'SUNCHEON_SI', '나주시': 'NAJU_SI', '광양시': 'GWANGYANG_SI', '해남군': 'HAENAM_GUN',
    // 경상북도
    '포항시': 'POHANG_SI', '경주시': 'GYEONGJU_SI', '김천시': 'GIMCHEON_SI', '안동시': 'ANDONG_SI', '구미시': 'GUMI_SI',
    '영주시': 'YEONGJU_SI', '영천시': 'YEONGCHEON_SI', '상주시': 'SANGJU_SI', '문경시': 'MUNGYEONG_SI',
    '경산시': 'GYEONGSAN_SI', '울진군': 'ULJIN_GUN', '울릉군': 'ULLUNG_GUN',
    // 경상남도
    '창원시': 'CHANGWON_SI', '진주시': 'JINJU_SI', '통영시': 'TONGYEONG_SI', '사천시': 'SACHEON_SI', '김해시': 'GIMHAE_SI',
    '밀양시': 'MIRYANG_SI', '거제시': 'GEOJE_SI', '양산시': 'YANGSAN_SI', '남해군': 'NAMHAE_GUN',
  };
  const CitiesByProvince = useMemo(() => ({
    '서울': ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'],
    '제주': ['제주시', '서귀포시'],
    '경기도': ['수원시','성남시','고양시','용인시','부천시','안산시','안양시','남양주시','화성시','평택시','의정부시','파주시','시흥시','김포시','광명시','군포시','이천시','오산시','하남시','양주시','구리시','안성시','포천시','의왕시','여주시','양평군','동두천시','과천시','가평군','연천군','광주시'], // [ADDED] 광주시
    '강원도': ['춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시'],
    '충청북도': ['청주시','충주시','제천시'],
    '충청남도': ['천안시','공주시','보령시','아산시','서산시','논산시','계룡시','당진시','부여군','홍성군'],
    '전라북도': ['전주시','군산시','익산시','정읍시','남원시','김제시','순창군'],
    '전라남도': ['목포시','여수시','순천시','나주시','광양시','해남군'],
    '경상북도': ['포항시','경주시','김천시','안동시','구미시','영주시','영천시','상주시','문경시','경산시','울진군','울릉군'],
    '경상남도': ['창원시','진주시','통영시','사천시','김해시','밀양시','거제시','양산시','남해군'],
  }), [])

  /* ===== 목적지 시트 (임시 상태) ===== */
  const [regionStep, setRegionStep] = useState('province'); // 'province' | 'city'
  const [tmpProvince, setTmpProvince] = useState('선택없음');
  const [tmpCity, setTmpCity] = useState('');
  const openRegionSheet = () => {
    setTmpProvince(selectedRegion || '선택없음');
    setTmpCity(selectedCity || '');
    setRegionStep('province');
    setSheet('region');
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
    setTmpBudget(typeof budget === 'number' ? budget : 0);
    setSheet('budget');
  };
  const confirmBudget = () => {
    setBudget(tmpBudget);
    setSheet(null);
  };

  /* ===== MBTI 시트 (임시 상태) ===== */
  const [tmpMbti, setTmpMbti] = useState(null);
  const openMbtiSheet = () => {
    setTmpMbti(selectedMbti);
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
   if (!selectedRegion) return '';                        // 아직 아무 선택 안함 → 미표시
   if (selectedRegion === '선택없음') return '선택없음';  // 사용자가 명시적으로 선택
   return selectedCity ? `${selectedRegion} · ${selectedCity}` : `${selectedRegion} · 선택없음`;
 }, [selectedRegion, selectedCity]);
  const mbtiLabel = selectedMbti == null ? '' : (selectedMbti === 'NONE' ? '선택없음' : selectedMbti);
  const styleLabel =
   selectedTravelStyles == null
     ? '' // 아직 시트에서 확정하지 않음 → 미표시
     : (selectedTravelStyles.length
         ? (selectedTravelStyles.length === 1
              ? selectedTravelStyles[0]
              : `${selectedTravelStyles[0]} 외 ${selectedTravelStyles.length - 1}`)
         : '선택없음'); // 시트에서 '선택없음'(빈 배열) 확정
  const groupLabel = selectedItems.group ? selectedItems.group : ''; // 아직 선택 전이면 미표시
  const budgetLabel =
  typeof budget === 'number'
    ? `${budget.toLocaleString()}원`
    : '';

  /* ===== Mock 플랜 이동 ===== */
  const handleCustomPlan = () => {
    const mockData = {
      title: '모의 여행 플랜',
      startDate,
      endDate,
      destination: 'SEOUL',
      mbti: selectedMbti || 'NONE',
      travelStyle: selectedTravelStyles[0] || 'NONE',
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
  try {
    const hasStyles =
     Array.isArray(selectedTravelStyles) && selectedTravelStyles.length > 0;
   const firstStyle = hasStyles ? selectedTravelStyles[0] : null;
   const STYLE_ENUM = {
     '액티비티':'ACTIVITY','문화/관광':'CULTURE','힐링':'HEALING',
     '맛집':'FOOD','도심':'CITY','자연':'NATURE'
   };
     const data = await createSchedule(
      startDate,
      endDate,
      selectedCity ? City[selectedCity] : 'NONE',
      (!selectedMbti || selectedMbti === '선택없음') ? 'NONE' : selectedMbti,
      firstStyle ? STYLE_ENUM[firstStyle] : 'NONE',
      ({ '선택없음':'NONE','혼자':'SOLO','단둘이':'DUO','여럿이':'GROUP' })[selectedItems.group] || 'NONE',
      Number(budget || 0)
    );

    // ✅ scheduleId 안전하게 뽑기
    const scheduleId =
      data?.id ?? data?.scheduleId ?? null;

    // ✅ 캐시 저장 (실패해도 네비는 진행)
    try { await saveCacheData(CACHE_KEYS.PLAN_INITIAL, data); } catch {}

    // ✅ 같은 스택(HomeNavigator) 안에서 바로 진입 (가장 확실)
    //    replace를 쓰면 뒤로 가기 눌러도 생성폼으로 안 돌아감 (의도)
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
          <Row title="MBTI" value={mbtiLabel} onPress={() => setSheet('mbti')} required={false}/>
          <Row title="여행 스타일" value={styleLabel} onPress={openStyleSheet} required={false}/>
        </ScrollView>

        {/* 하단 CTA */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.ctaBtn, !isDateSelected && { opacity: 0.5 }]}
            onPress={handleCreateSchedule}
            disabled={!isDateSelected}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaText}>여행플랜 바로 제작</Text>
          </TouchableOpacity>

          <View style={{ height: normalize(8,'height') }} />

          <TouchableOpacity
            style={[styles.secondaryBtn]}
            onPress={handleCustomPlan}
            disabled={!isDateSelected}
            activeOpacity={0.9}
          >
            <Text style={[styles.secondaryBtnText, !isDateSelected && { opacity: 0.5 }]}>
              나만의 여행 플랜 제작
            </Text>
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

      {/* ===== 바텀시트: 목적지 (province 0.44 / city 가변) ===== */}
      <BottomSheet
        visible={sheet==='region'}
        onClose={()=>setSheet(null)}
        heightRatio={regionStep==='province' ? 0.44 : getCitySheetHeightRatio(tmpProvince)}
      >
        <SheetHeader
          title="이번 여행, 어디로?"
          subtitle={regionStep==='province' ? '먼저 도(광역)를 선택하세요' : '시/군을 선택하세요'}
          onClose={()=>setSheet(null)}
        />

        {regionStep==='province' ? (
          <View style={[styles.pillWrap, { paddingBottom: normalize(100,'height') }]}>
            <View style={styles.regionGrid}>
              {Object.keys(Province).map((p)=>{
                const sel = p===tmpProvince;
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
        ) : (
          <View style={[styles.pillWrap, { paddingBottom: normalize(100,'height') }]}>
            <View style={styles.regionGrid}>
              <TouchableOpacity
                key="선택없음"
                style={[styles.regionChip, (tmpCity==='' ) && styles.regionChipSelected]}
                onPress={()=>setTmpCity('')}
                activeOpacity={0.85}
              >
                <Text style={[styles.regionChipText, (tmpCity==='' ) && styles.regionChipTextSelected]}>선택없음</Text>
                {tmpCity==='' && <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />}
              </TouchableOpacity>

              {(CitiesByProvince[tmpProvince]||[]).map((c)=>{
                const sel = tmpCity===c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.regionChip, sel && styles.regionChipSelected]}
                    onPress={()=>setTmpCity(c)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>{c}</Text>
                    {sel && <Ionicons name="checkmark-circle" size={normalize(14)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 하단 고정 2버튼 영역 */}
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
              <TouchableOpacity style={[styles.sheetCTA,{ flex:1 }]} onPress={confirmRegion} activeOpacity={0.9}>
                <Text style={styles.sheetCTAText}>
                  {tmpProvince==='선택없음'
                    ? '도: 선택없음'
                    : `${tmpProvince} · ${tmpCity || '선택없음'}`}
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
      <BottomSheet visible={sheet==='budget'} onClose={()=>setSheet(null)} heightRatio={0.33}>
        <SheetHeader title="예산 (1인 기준)" subtitle="원하는 예산을 선택하세요" onClose={()=>setSheet(null)} />
        <View style={{ paddingHorizontal: normalize(20) }}>
          <View style={[styles.budgetValueBox, tmpBudget===0 && styles.disabledBudgetBox]}>
            <Text style={[styles.budgetValueText, tmpBudget===0 && styles.disabledText]}>
              예산: {tmpBudget.toLocaleString()}원
            </Text>
          </View>
          <Slider
            style={{ width: '100%', height: normalize(40) }}
            minimumValue={0}
            maximumValue={1000000}
            step={10000}
            minimumTrackTintColor={tmpBudget===0 ? '#ccc' : '#c7c4ff'}
            maximumTrackTintColor={tmpBudget===0 ? '#eee' : '#c7c4ff'}
            thumbTintColor={tmpBudget===0 ? '#999' : '#726BEA'}
            value={tmpBudget}
            onValueChange={setTmpBudget}
          />
        </View>
        <View style={styles.sheetFixedCTA}>
          <TouchableOpacity style={styles.sheetCTA} onPress={confirmBudget} activeOpacity={0.9}>
            <Text style={styles.sheetCTAText}>{tmpBudget.toLocaleString()}원으로 설정</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ===== 바텀시트: MBTI (높이 축소 0.5 + 컴팩트 칩) ===== */}
      <BottomSheet visible={sheet==='mbti'} onClose={()=>setSheet(null)} heightRatio={0.45}>
        <SheetHeader title="MBTI를 선택해 주세요" subtitle="" onClose={()=>setSheet(null)} />
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(100,'height') }}>
          <View style={styles.regionGrid}>
            {[
              '선택없음', // ISTJ 왼쪽, 같은 칩 박스
              'ISTJ','ISFJ','INFJ','INTJ',
              'ISTP','ISFP','INFP','INTP',
              'ESTP','ESFP','ENFP','ENTP',
              'ESTJ','ESFJ','ENFJ','ENTJ',
            ].map(m => {
              const value = (m === '선택없음') ? 'NONE' : m;
              const selected = tmpMbti === value;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={()=>setTmpMbti(value)}
                  activeOpacity={0.85}
                  style={[styles.mbtiChip, selected && styles.mbtiChipSelected]}
                >
                  <Text style={[styles.mbtiChipText, selected && styles.regionChipTextSelected]}>
                    {m}
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
        </View>
        <View style={styles.sheetFixedCTA}>
          <TouchableOpacity style={styles.sheetCTA} onPress={confirmMbti} activeOpacity={0.9}>
            <Text style={styles.sheetCTAText}>{tmpMbti === 'NONE' ? '선택없음' : (tmpMbti || '선택없음')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ===== 바텀시트: 여행 스타일 (0.33) ===== */}
      <BottomSheet visible={sheet==='style'} onClose={()=>setSheet(null)} heightRatio={0.33}>
        <SheetHeader title="나의 여행 스타일은?" subtitle="여러 개를 골라도 좋아요" onClose={()=>setSheet(null)} />
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(100,'height') }}>
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
        </View>
        <View style={styles.sheetFixedCTA}>
          <TouchableOpacity style={styles.sheetCTA} onPress={confirmStyles} activeOpacity={0.9}>
            <Text style={styles.sheetCTAText}>
              {tmpStyles.length ? (tmpStyles.length === 1 ? tmpStyles[0] : `${tmpStyles[0]} 외 ${tmpStyles.length - 1}`) : '선택없음'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ===== 바텀시트: 인원(그룹) (0.29) ===== */}
      <BottomSheet visible={sheet==='group'} onClose={()=>setSheet(null)} heightRatio={0.29}>
        <SheetHeader title="인원" subtitle="여행 인원을 선택하세요" onClose={()=>setSheet(null)} />
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(100,'height') }}>
          <View style={styles.optionGridLg}>
            {["선택없음", "혼자", "단둘이", "여럿이"].map((g) => {
              const sel = g === tmpGroup;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.optionChipLg, sel && styles.optionChipLgSelected]}
                  onPress={() => setTmpGroup(g)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.optionTextLg, sel && { color: '#4F46E5' }]}>{g}</Text>
                  {sel && <Ionicons name="checkmark-circle" size={normalize(16)} color="#4F46E5" style={{ marginLeft: normalize(6) }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.sheetFixedCTA}>
          <TouchableOpacity style={styles.sheetCTA} onPress={confirmGroup} activeOpacity={0.9}>
            <Text style={styles.sheetCTAText}>{tmpGroup}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ===== [ADDED] 로딩 모달 ===== */}
       <Modal visible={loading} transparent animationType="fade"> 
         <SplashScreen /> 
       </Modal> 
    </SafeAreaView>
  );
}

/* ===== 스타일 ===== */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex:1, backgroundColor:'#FAFAFA' },

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

  // 하단 CTA(화면)
  ctaWrap: { position:'absolute', left:0, right:0, bottom: normalize(16,'height'), paddingHorizontal: normalize(16) },
  ctaBtn: {
    height: normalize(52,'height'), borderRadius: normalize(12), backgroundColor:'#4F46E5',
    alignItems:'center', justifyContent:'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 3,
  },
  ctaText: { color:'#FFFFFF', fontSize: normalize(16), fontWeight:'600' },
  secondaryBtn: {
    height: normalize(50), borderRadius: normalize(10),
    alignItems:'center', justifyContent:'center',
    backgroundColor: '#FFF', borderWidth: 2, borderColor: '#4F46E5',
  },
  secondaryBtnText: { fontSize: normalize(18), fontWeight:'600', color: '#4F46E5' },

  // 공통
  asterisk: { color:'#EF4444', fontWeight:'bold', fontSize: 18 },

  // 바텀시트 공통
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.35)' },
  sheet: {
    position:'absolute', left:0, right:0, bottom:0, backgroundColor:'#FFFFFF',
    borderTopLeftRadius: normalize(16), borderTopRightRadius: normalize(16),
    paddingTop: normalize(16,'height'), alignSelf:'stretch', overflow:'hidden',
  },
  sheetHeader: {
    paddingHorizontal: normalize(16), paddingBottom: normalize(20,'height'),
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
  },
  sheetTitle: { fontSize: normalize(20), fontWeight:'500', color: '#111111' },
  sheetSub: { marginTop: normalize(4), marginBottom: normalize(4), fontSize: normalize(14), color: '#767676', fontWeight:'400' },

  // 시트 본문 & 하단 고정 CTA (파일 기준 위치)
  sheetBody: { paddingHorizontal: normalize(16), paddingBottom: normalize(100,'height'), flexGrow:1 },
  sheetFixedCTA: {
    position:'absolute',
    left: normalize(16),
    right: normalize(16),
    bottom: normalize(50,'height'), // 파일과 동일 위치
  },
  sheetCTA: {
    height: normalize(52,'height'), borderRadius: normalize(12), backgroundColor:'#4F46E5',
    alignItems:'center', justifyContent:'center',
  },
  sheetCTAText: { color:'#fff', fontSize: normalize(16), fontWeight:'600' },

  // 칩/그리드
  regionGrid: { flexDirection:'row', flexWrap:'wrap', gap: normalize(10) },
  regionChip: {
    flexDirection:'row', alignItems:'center',
    paddingVertical: normalize(10,'height'), paddingHorizontal: normalize(14),
    borderRadius: normalize(12), borderWidth: 1, borderColor:'#E5E7EB', backgroundColor:'#FFFFFF',
  },
  regionChipSelected: { borderColor:'#4F46E5', backgroundColor:'#EEF2FF' },
  regionChipText: { fontSize: normalize(14), color:'#111' },
  regionChipTextSelected: { color:'#4F46E5', fontWeight:'600' },
  pillWrap: { paddingHorizontal: normalize(16) },

  // 목적지 시트 하단 2버튼 고정 행 (파일 기준)
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
  optionTextLg: { fontSize: normalize(15), color: '#111111', fontWeight: '600' },

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
    fontWeight:'500',
  },

  // 로딩 모달
  loadingDim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(24),
  },
  loadingBox: {
    width: '80%',
    maxWidth: 320,
    borderRadius: normalize(14),
    backgroundColor: '#fff',
    paddingVertical: normalize(24,'height'),
    paddingHorizontal: normalize(20),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: normalize(10,'height'),
    fontSize: normalize(14),
    color: '#111',
  },

  // (과거 둥근 '선택없음' 버튼 스타일은 미사용)
  noneBtn: {
    paddingVertical: normalize(10,'height'),
    paddingHorizontal: normalize(18),
    borderRadius: normalize(999),
    borderWidth: 1,
  },
});
