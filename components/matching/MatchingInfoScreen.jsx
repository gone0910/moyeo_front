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
  SafeAreaView,
  Modal,
  Animated,
  Easing,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';

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

/* ---------------- 변환 유틸 ---------------- */
// 사용자의 입력값을 백엔드 DTO 형식으로 변환해주는 함수
// 목적: React Native의 한글 입력값을 백엔드 ENUM + null 처리 기준에 맞게 변환
export const convertMatchingInputToDto = (input) => {
  // 🔹 한글 → ENUM 변환용 맵
  const groupTypeMap = {
    '단둘이': 'ALONE',
    '여럿이': 'GROUP',
    '선택없음': 'NONE',
  };

  // 🔹 성별 한글 → 영문 ENUM
  const genderMap = {
    '남성': 'MALE',
    '여성': 'FEMALE',
    '선택없음': 'NONE',
  };

  // 🔹 연령대 한글 → 숫자
  const ageMap = {
    '10대': 10,
    '20대': 20,
    '30대': 30,
    '40대': 40,
    '50대': 50,
    '60대 이상': 60,
  };

  // 🔹 여행 스타일 한글 → 영문 ENUM
  const styleMap = {
    '힐링': 'HEALING',
    '맛집': 'FOOD',
    '문화/관광': 'CULTURE',
    '액티비티': 'ACTIVITY',
    '자연': 'NATURE',
    '도심': 'CITY',
    '선택없음': 'NONE',
  };

  // 🟡 변환 전 입력 로그 출력
  console.log('📝 [MatchingInput] 원본 입력값:', input);

  const dto = {
    startDate: input.startDate, // YYYY-MM-DD
    endDate: input.endDate,     // YYYY-MM-DD
    province: (input.province === '선택없음' || input.province === 'NONE') ? 'NONE' : input.province,

    cities:
      !input.selectedCities || input.selectedCities.length === 0
        ? ['NONE']
        : input.selectedCities,
    groupType: groupTypeMap[input.groupType] ?? 'NONE',
    // 연령대(한글 → 숫자/서버 포맷)
    ageRange: ageMap[input.ageRange] ?? null,
    // 여행스타일(한글 → ENUM 배열), '선택없음'이면 ['NONE']
    travelStyles:
      !input.travelStyles ||
      input.travelStyles.length === 0 ||
      input.travelStyles.includes('선택없음')
        ? ['NONE']
        : input.travelStyles.map((s) => styleMap[s] || 'NONE'),
    // 성별(한글 → ENUM)
    preferenceGender: genderMap[input.preferenceGender] ?? 'NONE',
  };

  // 🟢 변환 후 DTO 로그 출력
  console.log('📦 [MatchingInput] 변환된 DTO:', dto);
  return dto;
};

// 🔄 ENUM → 한글 역변환 (모달 등에서 사용)
export const GENDER_ENUM_TO_KOR = {
  MALE: '남성',
  FEMALE: '여성',
  NONE: '선택없음',
};
export const STYLE_ENUM_TO_KOR = {
  HEALING: '힐링',
  FOOD: '맛집',
  CULTURE: '문화/관광',
  ACTIVITY: '액티비티',
  NATURE: '자연',
  CITY: '도심',
  NONE: '선택없음',
};

/* ---------------- Enums (화면 표기 ↔ 서버 ENUM) ---------------- */
// 도(광역)
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

// 시/군(한글 → 서버 ENUM)
const City = {
  // 서울(일부)
  '강남구': 'GANGNAM_GU',
  '강동구': 'GANGDONG_GU',
  '강북구': 'GANGBUK_GU',
  '강서구': 'GANGSEO_GU',
  '관악구': 'GWANAK_GU',
  '광진구': 'GWANGJIN_GU',
  '구로구': 'GURO_GU',
  '금천구': 'GEUMCHEON_GU',
  '노원구': 'NOWON_GU',
  '도봉구': 'DOBONG_GU',
  '동대문구': 'DONGDAEMUN_GU',
  '동작구': 'DONGJAK_GU',
  '마포구': 'MAPO_GU',
  '서대문구': 'SEODAEMUN_GU',
  '서초구': 'SEOCHO_GU',
  '성동구': 'SEONGDONG_GU',
  '성북구': 'SEONGBUK_GU',
  '송파구': 'SONGPA_GU',
  '양천구': 'YANGCHEON_GU',
  '영등포구': 'YEONGDEUNGPO_GU',
  '용산구': 'YONGSAN_GU',
  '은평구': 'EUNPYEONG_GU',
  '종로구': 'JONGNO_GU',
  '중구': 'JUNG_GU',
  '중랑구': 'JUNGNANG_GU',

  // 제주
  '제주시': 'JEJU_SI',
  '서귀포시': 'SEOGWIPO_SI',

  // 경기도(일부)
  '수원시': 'SUWON_SI',
  '성남시': 'SEONGNAM_SI',
  '고양시': 'GOYANG_SI',
  '용인시': 'YONGIN_SI',
  '부천시': 'BUCHEON_SI',
  '안산시': 'ANSAN_SI',
  '안양시': 'ANYANG_SI',
  '남양주시': 'NAMYANGJU_SI',
  '화성시': 'HWASEONG_SI',
  '평택시': 'PYEONGTAEK_SI',
  '의정부시': 'UIJEONGBU_SI',
  '파주시': 'PAJU_SI',
  '시흥시': 'SIHEUNG_SI',
  '김포시': 'GIMPO_SI',
  '광명시': 'GWANGMYEONG_SI',
  '군포시': 'GUNPO_SI',
  '이천시': 'ICHEON_SI',
  '오산시': 'OSAN_SI',
  '하남시': 'HANAM_SI',
  '양주시': 'YANGJU_SI',
  '구리시': 'GURI_SI',
  '안성시': 'ANSEONG_SI',
  '포천시': 'POCHEON_SI',
  '의왕시': 'UIWANG_SI',
  '여주시': 'YEOJU_SI',
  '양평군': 'YANGPYEONG_GUN',
  '동두천시': 'DONGDUCHEON_SI',
  '과천시': 'GWACHEON_SI',
  '가평군': 'GAPYEONG_GUN',
  '연천군': 'YEONCHEON_GUN',

  // 강원특별자치도(일부)
  '춘천시': 'CHUNCHEON_SI',
  '원주시': 'WONJU_SI',
  '강릉시': 'GANGNEUNG_SI',
  '동해시': 'DONGHAE_SI',
  '태백시': 'TAEBAEK_SI',
  '속초시': 'SOKCHO_SI',
  '삼척시': 'SAMCHEOK_SI',

  // 충북(일부)
  '청주시': 'CHEONGJU_SI',
  '충주시': 'CHUNGJU_SI',
  '제천시': 'JECHEON_SI',

  // 충남(일부)
  '천안시': 'CHEONAN_SI',
  '공주시': 'GONGJU_SI',
  '보령시': 'BOREONG_SI',
  '아산시': 'ASAN_SI',
  '서산시': 'SEOSAN_SI',
  '논산시': 'NONSAN_SI',
  '계룡시': 'GYERYONG_SI',
  '당진시': 'DANGJIN_SI',
  '부여군': 'BUYEO_GUN',
  '홍성군': 'HONGSEONG_GUN',

  // 전북(일부)
  '전주시': 'JEONJU_SI',
  '군산시': 'GUNSAN_SI',
  '익산시': 'IKSAN_SI',
  '정읍시': 'JEONGEUP_SI',
  '남원시': 'NAMWON_SI',
  '김제시': 'GIMJE_SI',
  '순창군': 'SUNCHANG_GUN',

  // 전남(일부)
  '목포시': 'MOKPO_SI',
  '여수시': 'YEOSU_SI',
  '순천시': 'SUNCHEON_SI',
  '나주시': 'NAJU_SI',
  '광양시': 'GWANGYANG_SI',
  '해남군': 'HAENAM_GUN',

  // 경북(일부)
  '포항시': 'POHANG_SI',
  '경주시': 'GYEONGJU_SI',
  '김천시': 'GIMCHEON_SI',
  '안동시': 'ANDONG_SI',
  '구미시': 'GUMI_SI',
  '영주시': 'YEONGJU_SI',
  '영천시': 'YEONGCHEON_SI',
  '상주시': 'SANGJU_SI',
  '문경시': 'MUNGYEONG_SI',
  '경산시': 'GYEONGSAN_SI',
  '울진군': 'ULJIN_GUN',
  '울릉군': 'ULLUNG_GUN',

  // 경남(일부)
  '창원시': 'CHANGWON_SI',
  '진주시': 'JINJU_SI',
  '통영시': 'TONGYEONG_SI',
  '사천시': 'SACHEON_SI',
  '김해시': 'GIMHAE_SI',
  '밀양시': 'MIRYANG_SI',
  '거제시': 'GEOJE_SI',
  '양산시': 'YANGSAN_SI',
  '남해군': 'NAMHAE_GUN',
};

// 도별 시/군 목록(한글 라벨 배열)
const CitiesByProvince = {
  '서울': [
    '강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구',
  ],
  '제주': ['제주시', '서귀포시'],
  '경기도': [
    '수원시','성남시','고양시','용인시','부천시','안산시','안양시','남양주시','화성시','평택시','의정부시','파주시','시흥시','김포시','광명시','군포시','이천시','오산시','하남시','양주시','구리시','안성시','포천시','의왕시','여주시','양평군','동두천시','과천시','가평군','연천군',
  ],
  '강원도': ['춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시'],
  '충청북도': ['청주시','충주시','제천시'],
  '충청남도': ['천안시','공주시','보령시','아산시','서산시','논산시','계룡시','당진시','부여군','홍성군'],
  '전라북도': ['전주시','군산시','익산시','정읍시','남원시','김제시','순창군'],
  '전라남도': ['목포시','여수시','순천시','나주시','광양시','해남군'],
  '경상북도': ['포항시','경주시','김천시','안동시','구미시','영주시','영천시','상주시','문경시','경산시','울진군','울릉군'],
  '경상남도': ['창원시','진주시','통영시','사천시','김해시','밀양시','거제시','양산시','남해군'],
};

// 도별 시/군 개수에 따른 시트 높이 비율 계산
function getCitySheetHeightRatio(province) {
  if (province === '선택없음') return 0.30; 
  if (province === '서울') return 0.65;
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
    [start]: { startingDay: true, endingDay: !end, color: '#000', textColor: '#fff' },
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
    res[end] = { endingDay: true, color: '#000', textColor: '#fff' };
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
  const buildDtoInput = () => {
    return {
      startDate: selected.periodStart,
      endDate: selected.periodEnd,
      province: Province[selected.province] ?? '선택없음',
      selectedCities:
        selected.cities.length === 0 ? [] : selected.cities.map((kor) => City[kor]).filter(Boolean),
      groupType: selected.group,
      travelStyles: selected.style.length ? selected.style : ['선택없음'],
      preferenceGender: selected.gender === '선택없음' ? '선택없음' : selected.gender,
      ageRange: selected.ageRange, // 변환 함수에서 숫자/NULL로 바뀜
    };
  };

  // ✅ mock 응답
  const requestMock = async (dto) => {
    console.log('🧪 [MOCK] 요청 DTO:', dto);
    const mock = {
      matches: [
        {
          name: '민재',
          date: `${dto.startDate} ~ ${dto.endDate}`,
          tags: dto.travelStyles?.filter((t) => t !== 'NONE') || [],
          image: 'https://placehold.co/100x100',
          gender: dto.preferenceGender || 'NONE',
          travelStyle: dto.travelStyles,
          destination: dto.province, // 서버 ENUM 기준으로 올 수 있음
          mbti: 'ENTP',
        },
      ],
      attached: false,
    };
    console.log('🧪 [MOCK] 응답:', mock);
    return mock;
  };

  // ✅ 실제 서버 요청 (필요 시 BASE_URL/MATCHING_ENDPOINT/토큰 설정)
  const requestReal = async (dto) => {
    try {
      const url = `${BASE_URL}${MATCHING_ENDPOINT}`;

      if (!attachedFile) {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dto),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status} - ${text}`);
        }
        const data = await res.json();
        Alert.alert('전송 완료', '서버에서 매칭 결과를 받았어요.');
        console.log('✅ [REAL] 응답(JSON):', data);
        return data;
      } else {
        const form = new FormData();
        form.append('dto', JSON.stringify(dto));
        form.append('file', {
          uri: attachedFile.uri,
          name: attachedFile.name,
          type: attachedFile.type,
        });

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            // Authorization: `Bearer ${token}`,
          },
          body: form,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status} - ${text}`);
        }
        const data = await res.json();
        Alert.alert('전송 완료', '파일과 함께 전송했어요.');
        console.log('✅ [REAL] 응답(MULTIPART):', data);
        return data;
      }
    } catch (e) {
      console.error('❌ [REAL] 요청 실패:', e);
      Alert.alert('요청 실패', e.message?.toString() ?? '네트워크 오류');
      throw e;
    }
  };

  const onSubmit = async () => {
    if (!canSubmit) return;

    // DTO 유틸 입력값 만들기(유틸의 기대 스키마대로)
    const inputForDto = buildDtoInput();
    const payload = convertMatchingInputToDto(inputForDto);

    console.log('[MatchingInfo] submit payload:', payload);
    try {
      const result = USE_MOCK ? await requestMock(payload) : await requestReal(payload);
      navigation.navigate('MatchingList', { result });
    } catch (e) {}
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
          <Row title="여행 일정" value={periodLabel} onPress={openDateSheet} />
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
            disabled={!canSubmit}
            style={[styles.ctaBtn, !canSubmit && { opacity: 0.5 }]}
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
          <TouchableOpacity onPress={() => setSheet(null)} hitSlop={8}>
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
        heightRatio={regionStep === 'province' ? 0.44 : getCitySheetHeightRatio(tmpProvince)}
      >
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>이번 여행, 어디로?</Text>
            <Text style={styles.sheetSub}>
              {regionStep === 'province' ? '먼저 도(광역)를 선택하세요' : '시/군을 자유롭게 선택하세요 (복수 선택 가능)'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setSheet(null)} hitSlop={8}>
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

        {regionStep === 'province' ? (
          <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(100, 'height') }}>
            <View style={styles.regionGrid}>
              {Object.keys(Province).map((p) => {
                const sel = p === tmpProvince;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.regionChip, sel && styles.regionChipSelected]}
                    onPress={() => { setTmpProvince(p); setTmpCities([]); }} // ✅ 도 변경 시 시/군 초기화
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>{p}</Text>
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
        ) : (
          <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(20, 'height') }}>
            <View style={styles.regionGrid}>
              {/* 선택없음 */}
              <TouchableOpacity
                key="선택없음"
                style={[styles.regionChip, (tmpCities.length === 0) && styles.regionChipSelected]}
                onPress={() => setTmpCities([])}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.regionChipText,
                    (tmpCities.length === 0) && styles.regionChipTextSelected,
                  ]}
                >
                  선택없음
                </Text>
                {tmpCities.length === 0 && (
                  <Ionicons
                    name="checkmark-circle"
                    size={normalize(14)}
                    color="#4F46E5"
                    style={{ marginLeft: normalize(6) }}
                  />
                )}
              </TouchableOpacity>

              {(CitiesByProvince[tmpProvince] ?? []).map((c) => {
                const sel = tmpCities.includes(c); // ✅ 다중 선택 체크
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.regionChip, sel && styles.regionChipSelected]}
                    onPress={() => toggleCity(c)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.regionChipText, sel && styles.regionChipTextSelected]}>{c}</Text>
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
                onPress={() => {
                  if (tmpProvince === '선택없음') confirmRegion();
                  else setRegionStep('city');
                }}
                style={[styles.sheetCTA, { flex: 1 }]}
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
      <BottomSheet visible={sheet === 'group'} onClose={() => setSheet(null)} heightRatio={0.29}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>몇 명이 좋을까?</Text>
            <Text style={styles.sheetSub}>그룹 유형을 선택하세요</Text>
          </View>
        <TouchableOpacity onPress={() => setSheet(null)} hitSlop={8}>
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
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(20, 'height') }}>
          <TouchableOpacity activeOpacity={0.9} onPress={confirmGroup} style={styles.sheetCTA}>
            <Text style={styles.sheetCTAText}>{tmpGroup || '선택없음'}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ---------- 여행 스타일 선택 시트 (다중) ---------- */}
      <BottomSheet visible={sheet === 'style'} onClose={() => setSheet(null)} heightRatio={0.33}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>나의 여행 스타일은?</Text>
            <Text style={styles.sheetSub}>여러 개를 골라도 좋아요</Text>
          </View>
          <TouchableOpacity onPress={() => setSheet(null)} hitSlop={8}>
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
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(20, 'height') }}>
          <TouchableOpacity activeOpacity={0.9} onPress={confirmStyle} style={styles.sheetCTA}>
            <Text style={styles.sheetCTAText}>
              {(tmpStyle?.length ?? 0) ? tmpStyle.join(' · ') : '선택없음'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ---------- 성별 선택 시트 ---------- */}
      <BottomSheet visible={sheet === 'gender'} onClose={() => setSheet(null)} heightRatio={0.29}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>선호하는 동행자의 성별?</Text>
            <Text style={styles.sheetSub}>선호가 없다면 ‘선택없음’을 선택하세요</Text>
          </View>
          <TouchableOpacity onPress={() => setSheet(null)} hitSlop={8}>
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
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(20, 'height') }}>
          <TouchableOpacity activeOpacity={0.9} onPress={confirmGender} style={styles.sheetCTA}>
            <Text style={styles.sheetCTAText}>{tmpGender || '선택없음'}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* ---------- 연령대 선택 시트 ---------- */}
      <BottomSheet visible={sheet === 'age'} onClose={() => setSheet(null)}  heightRatio={0.33}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>동행자 나이는 어느 연령대가 편하신가요?</Text>
            <Text style={styles.sheetSub}>선택없음을 누르면 제한이 없습니다</Text>
          </View>
          <TouchableOpacity onPress={() => setSheet(null)} hitSlop={8}>
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
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(20, 'height') }}>
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
function Row({ title, value, onPress }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={onPress} activeOpacity={0.85}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.rightGroup}>
          {!!value && (<Text style={styles.cardValue} numberOfLines={1} ellipsizeMode="tail">{value}</Text>)}
          <View className="chevronBadge" style={styles.chevronBadge}>
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
    paddingTop: normalize(16, 'height'),
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
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: normalize(10) },
  regionChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: normalize(10, 'height'), paddingHorizontal: normalize(14),
    borderRadius: normalize(12), borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
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

  optionGridLg: { flexDirection: 'row', flexWrap: 'wrap', gap: normalize(14) },
  optionChipLg: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: normalize(14, 'height'),
    paddingHorizontal: normalize(18),
    minHeight: normalize(48, 'height'),
    borderRadius: normalize(14),
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
  },
  optionChipLgSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  optionTextLg: { fontSize: normalize(16), color: '#111111', fontWeight: '600' },

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
