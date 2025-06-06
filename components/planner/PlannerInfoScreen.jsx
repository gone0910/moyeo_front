import  { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  TextInput,
  Dimensions,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { UserContext } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import { Animated } from 'react-native';
import ToggleSelector from '../common/ToggleSelector';
import ToggleSelector3 from '../common/ToggleSelector3';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { planner_create_request } from '../../api/planner_create_request';
import { saveCacheData, CACHE_KEYS } from '../../caching/cacheService';
import axios from 'axios';
import SplashScreen from '../../components/common/SplashScreen';

// === 반응형 유틸 함수 ===
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390; // iPhone 13 기준
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
}

export default function PlannerInfoScreen() {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedMbti, setSelectedMbti] = useState(null);
  const [selectedTravelStyles, setSelectedTravelStyles] = useState([]);
  const [budget, setBudget] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const toggleMbti = () => {
    setSelectedMbti((prev) => (prev === 'NONE' ? null : 'NONE'));
  };
  const handleCustomPlan = () => {
    handleCreateSchedule();
  };
  const toggleSelectNone = () => {
    if (selectedTravelStyles.includes('선택없음')) {
      setSelectedTravelStyles([]);
    } else {
      setSelectedTravelStyles(['선택없음']);
    }
  };

  const navigation = useNavigation();

  const handleValueChange = (value) => {
    setIsActive(true);
    setBudget(value);
  };

  // -- 실제 API, ENUM 변환 및 저장/네비게이션 로직은 기존 그대로 두세요! --
  const handleCreateSchedule = async () => {
    setLoading(true);
    // 도/시 ENUM 변환 
    const Province = {
      '선택안함': 'NONE',
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
      // 서울특별시
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
      // 제주특별자치도
      '제주시': 'JEJU_SI',
      '서귀포시': 'SEOGWIPO_SI',
      // 경기도
      '수원시': 'SUWON_SI',
      '성남시': 'SEONGNAM_SI',
      '고양시': 'GOYANG_SI',
      '용인시': 'YONGIN_SI',
      '부천시': 'BUCHEON_SI',
      '안산시': 'ANSAN_SI',
      '안양시': 'ANYANG_SI',
      '남양주시': 'NAMYANGJU_SI',
      '화성시': 'HWASeong_SI',
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
      // 강원특별자치도
      '춘천시': 'CHUNCHEON_SI',
      '원주시': 'WONJU_SI',
      '강릉시': 'GANGNEUNG_SI',
      '동해시': 'DONGHAE_SI',
      '태백시': 'TAEBAEK_SI',
      '속초시': 'SOKCHO_SI',
      '삼척시': 'SAMCHEOK_SI',
      // 충청북도
      '청주시': 'CHEONGJU_SI',
      '충주시': 'CHUNGJU_SI',
      '제천시': 'JECEHON_SI',
      // 충청남도
      '천안시': 'CHEONAN_SI',
      '공주시': 'GONGJU_SI',
      '보령시': 'BOREONG_SI',
      '아산시': 'ASAN_SI',
      '서산시': 'SEOSAN_SI',
      '논산시': 'NONSAN_SI',
      '계릉시': 'GYERYONG_SI',  
      '당진시': 'DANGJIN_SI',
      '부여군': 'BUYEO_GUN',
      '홍성군': 'HONGSEONG_GUN',
      // 전라북도
      '전주시': 'JEONJU_SI',
      '군산시': 'GUNSAN_SI',
      '익산시': 'IKSAN_SI',
      '정읍시': 'JEONGEUP_SI',
      '남원시': 'NAMWON_SI',
      '김제시': 'GIMJE_SI',
      '순창군': 'SUNCHANG_GUN',
      // 전라남도
      '목포시': 'MOKPO_SI',
      '여수시': 'YEOSU_SI',
      '순천시': 'SUNCHEON_SI',
      '나주시': 'NAJU_SI',
      '광양시': 'GWANGYANG_SI',
      '해남군': 'HAENAM_GUN',
      // 경상북도
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
      // 경상남도
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
    const TravelStyle = {
      '선택안함': 'NONE',
      '액티비티': 'ACTIVITY',
      '문화/관광': 'CULTURE',
      '힐링': 'RELAXED',
      '맛집': 'FOOD',
      '도심': 'CITY',
      '자연': 'NATURE',
    };
    // 목적지 선택 (도시 > 지역 우선)
    const destination = [];
    if (loading) return <SplashScreen />;
    if (selectedCity && City[selectedCity]) {
      destination.push(City[selectedCity]);
    } else if (selectedRegion && Province[selectedRegion]) {
      // 도/광역시만 선택된 경우
      // destination.push(Province[selectedRegion]);  
    }
    if (destination.length === 0) {
      destination.push('NONE');
    }
    const MBTI = selectedMbti === '선택안함' || !selectedMbti ? 'NONE' : selectedMbti;
    const travelStyle =
      selectedTravelStyles.length === 0
        ? 'NONE'
        : TravelStyle[selectedTravelStyles[0]] || 'NONE';
    const groupMap = {
      '선택안함': 'NONE',
      '혼자': 'SOLO',
      '단둘이': 'DUO',
      '여럿이': 'GROUP',
    };
    const peopleGroup = groupMap[selectedItems.group] || 'NONE';
    const requestData = {
      startDate,
      endDate,
      destination: destination[0],
      mbti: MBTI,
      travelStyle,
      peopleGroup,
      budget,
    };
    try {
      const token = await AsyncStorage.getItem('jwt');
      if (!token) {
        console.warn('❌ jwt 토큰 없음');
        Alert.alert('실패', '로그인이 필요합니다.');
        return;
      }
      console.log('📤 requestData:', JSON.stringify(requestData, null, 2));
      const response = await axios.post(
        'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080/schedule/create',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        const dataWithIds = {
          ...response.data,
          destination: requestData.destination,
          mbti: requestData.mbti,
          travelStyle: requestData.travelStyle,
          peopleGroup: requestData.peopleGroup,
          budget: requestData.budget,
          startDate: requestData.startDate,
          endDate: requestData.endDate,
        };
        await saveCacheData(CACHE_KEYS.PLAN_INITIAL, dataWithIds);
        const check = await AsyncStorage.getItem(CACHE_KEYS.PLAN_INITIAL);
        console.log('🧐 저장된 PLAN_INITIAL 값:', JSON.stringify(JSON.parse(check), null, 2));
        navigation.navigate('PlannerResponse');
      }
    } catch (error) {
      console.error('❌ 예외 발생:', error.response?.data || error.message);
      Alert.alert('실패', '일정 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const [selectedItems, setSelectedItems] = useState({
    group: '',
    tripstyle: '',
    gender: '',
    age: '',
  });

  const handleSelect = (key) => (value) => {
    setSelectedItems((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleTravelStyle = (style) => {
    setSelectedTravelStyles((prev) => {
      if (style === '선택없음') {
        return ['선택없음'];
      } else {
        const filtered = prev.filter((s) => s !== '선택없음');
        if (filtered.includes(style)) {
          return filtered.filter((s) => s !== style);
        } else {
          return [...filtered, style];
        }
      }
    });
  };

  const slideIndicatorPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const slideIndicatorWidth = normalize(40);

  const handleDayPress = (day) => {
    const selected = day.dateString;
    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (selected > startDate) {
        setEndDate(selected);
      } else {
        setStartDate(selected);
      }
    }
  };

  const getMarkedDates = () => {
    if (!startDate) return {};
    const marked = {
      [startDate]: {
        startingDay: true,
        endingDay: !endDate,
        color: '#7F7BCD',
        textColor: '#fff',
      },
    };
    if (startDate && endDate) {
      let current = new Date(startDate);
      const end = new Date(endDate);
      while (current < end) {
        current.setDate(current.getDate() + 1);
        const dateStr = current.toISOString().split('T')[0];
        if (dateStr !== endDate) {
          marked[dateStr] = { color: '#CECCF5', textColor: '#000' };
        }
      }
      marked[endDate] = {
        endingDay: true,
        color: '#716AE9',
        textColor: '#fff',
      };
    }
    return marked;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${y}.${m}.${d}`;
  };

  const isDateSelected = startDate && endDate;

  const goToSlide = (index) => {
    if (index >= 0 && index < 4) {
      setCurrentSlide(index);
      Animated.spring(slideIndicatorPosition, {
        toValue: { x: index * slideIndicatorWidth, y: 0 },
        useNativeDriver: true,
      }).start();
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (e, gestureState) => {
      slideIndicatorPosition.setValue({ x: gestureState.dx, y: 0 });
    },
    onPanResponderRelease: (e, gestureState) => {
      const newPosition = Math.max(0, Math.min(3 * slideIndicatorWidth, gestureState.moveX));
      const index = Math.floor(newPosition / slideIndicatorWidth);
      setCurrentSlide(index);
      slideIndicatorPosition.setValue({ x: newPosition, y: 0 });
      Animated.spring(slideIndicatorPosition, {
        toValue: { x: index * slideIndicatorWidth, y: 0 },
        useNativeDriver: true,
      }).start();
    },
  });

  if (loading) return <SplashScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigation.replace('BottomTab')}>
            <Text style={styles.logoText}>moyeo </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileHome', user)}>
            {user?.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder} />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.headerLine} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={[styles.wrapper, { paddingTop: normalize(220, 'height') }]}>
        {/* Slide 1: 일정 선택 */}
        {currentSlide === 0 && (
          <View style={styles.calendarBox}>
            <Text style={styles.calendarLabel}>일정 선택</Text>
            <Calendar
              hideDayNames={false}
              markingType={'period'}
              markedDates={getMarkedDates()}
              onDayPress={handleDayPress}
              style={{ backgroundColor: '#fafafa', borderRadius: normalize(12) }}
              theme={{
                backgroundColor: '#fafafa',
                calendarBackground: '#fafafa',
              }}
              dayComponent={({ date }) => {
                const dayOfWeek = new Date(date.dateString).getDay();
                const isSelected = date.dateString === startDate || date.dateString === endDate;
                const isBetween = startDate && endDate && date.dateString > startDate && date.dateString < endDate;
                let textColor = '#000';
                if (dayOfWeek === 0) textColor = '#FF3B30';
                else if (dayOfWeek === 6) textColor = '#007AFF';
                const backgroundColor = isSelected ? '#716AE9' : isBetween ? '#CECCF5' : 'transparent';
                return (
                  <TouchableOpacity onPress={() => handleDayPress(date)}>
                    <View style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(16), justifyContent: 'center', alignItems: 'center', backgroundColor }}>
                      <Text style={{ color: isSelected ? '#fff' : textColor, fontSize: normalize(16) }}>{date.day}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            {(startDate || endDate) && (
              <View style={styles.dateButtonContainer}>
                {startDate && <View style={styles.dateButton}><Text style={styles.dateButtonText}>시작일: {formatDate(startDate)}</Text></View>}
                {endDate && <View style={styles.dateButton}><Text style={styles.dateButtonText}>종료일: {formatDate(endDate)}</Text></View>}
              </View>
            )}
          </View>
        )}

        {/* Slide 2: 목적지/인원/예산 */}
        {currentSlide === 1 && (
          <View style={{ paddingHorizontal: normalize(20), marginTop: normalize(10), top: normalize(-90) }}>
            <Text style={styles.firstTitle}>목적지</Text>
            <View style={styles.divider1} />
            <ToggleSelector
              items={["선택안함", "서울", "제주", "경기도", "강원도", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도"]}
              selectedItem={selectedRegion}
              onSelect={setSelectedRegion}
              size="large"
            />
            {selectedRegion === '서울' && (
              <View style={{ marginTop: normalize(4) }}>
                <ToggleSelector
                  items={["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"]}
                  selectedItem={selectedCity}
                  onSelect={setSelectedCity}
                  size="small"
                />
              </View>
            )}
            {selectedRegion === '제주' && (
              <View style={{ marginTop: normalize(4) }}>
                <ToggleSelector
                  items={["제주시", "서귀포시"]}
                  selectedItem={selectedCity}
                  onSelect={setSelectedCity}
                  size="small"
                />
              </View>
            )}
            {selectedRegion === '경기도' && (
              <View style={{ marginTop: normalize(4) }}>
                <ToggleSelector
                  items={["수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시", "동두천시", "안산시", "고양시", "과천시",
                    "구리시", "남양주시", "오산시", "시흥시", "군포시", "의왕시", "하남시", "용인시", "파주시", "이천시", "안성시",
                    "김포시", "화성시", "광주시", "양주시", "포천시", "여주시", "연천군", "가평군", "양평군"
                  ]}
                  selectedItem={selectedCity}
                  onSelect={setSelectedCity}
                  size="small"
                />
              </View>
            )}
            {selectedRegion === '강원도' && (
              <View style={{ marginTop: normalize(4) }}>
                <ToggleSelector
                  items={["춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시"]}
                  selectedItem={selectedCity}
                  onSelect={setSelectedCity}
                  size="small"
                />
              </View>
            )}
            {selectedRegion === '충청북도' && (
              <View style={{ marginTop: normalize(4) }}>
                <ToggleSelector
                  items={["청주시", "충주시", "제천시"]}
                  selectedItem={selectedCity}
                  onSelect={setSelectedCity}
                  size="small"
                />
              </View>
            )}
            {selectedRegion === '충청남도' && (
              <View style={{ marginTop: normalize(4) }}>
                <ToggleSelector
                  items={["천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "부여군", "홍성군"]}
                  selectedItem={selectedCity}
                  onSelect={setSelectedCity}
                  size="small"
                />
              </View>
            )}
            {selectedRegion === '전라북도' && (
              <View style={{ marginTop: normalize(4) }}>
                <ToggleSelector
                  items={["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "순창군"]}
                  selectedItem={selectedCity}
                  onSelect={setSelectedCity}
                  size="small"
                />
              </View>
            )}
            {selectedRegion === '전라남도' && (
              <View style={{ marginTop: normalize(4) }}>
                <ToggleSelector
                  items={["목포시", "여수시", "순천시", "나주시", "광양시", "해남군"]}
                  selectedItem={selectedCity}
                  onSelect={setSelectedCity}
                  size="small"
                />
              </View>
            )}
            {selectedRegion === '경상북도' && (
              <View style={{ marginTop: normalize(4) }}>
                <ToggleSelector
                  items={["포항시"," 경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "울진군", "울릉군"]}
                  selectedItem={selectedCity}
                  onSelect={setSelectedCity}
                  size="small"
                />
              </View>
            )}
            {selectedRegion === '경상남도' && (
              <View style={{ marginTop: normalize(4) }}>
                <ToggleSelector
                  items={["창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시", "남해군"]}
                  selectedItem={selectedCity}
                  onSelect={setSelectedCity}
                  size="small"
                />
              </View>
            )}
            {/* 인원 */}
            <Text style={styles.secondTitle}>인원</Text>
            <View style={styles.divider2} />
            <ToggleSelector3
              items={["선택안함", "혼자", "단둘이", "여럿이"]}
              selectedItem={selectedItems.group}
              onSelect={handleSelect('group')}
              size="large"
            />
            {/* 예산 */}
            <Text style={styles.thirdTitle}>예산 <Text style={styles.thirdTitlesmall}> 1인 기준</Text></Text>
            <View style={styles.divider3} />
            <View style={{ marginTop: normalize(10) }}>
              <Slider
                style={{ width: '100%', height: normalize(40) }}
                minimumValue={0}
                maximumValue={1000000}
                step={10000}
                minimumTrackTintColor={isActive ? '#c7c4ff' : '#ccc'}
                maximumTrackTintColor={isActive ? '#c7c4ff' : '#eee'}
                thumbTintColor={isActive ? '#726BEA' : '#999'}
                value={budget}
                onValueChange={handleValueChange}
              />
              <View
                style={[
                  styles.budgetValueBox,
                  !isActive && styles.disabledBudgetBox,
                ]}
              >
                <Text
                  style={[
                    styles.budgetValueText,
                    !isActive && styles.disabledBudgetText,
                  ]}
                >
                  예산: {budget.toLocaleString()}원
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Slide 3: MBTI */}
        {currentSlide === 2 && (
          <View style={{ paddingHorizontal: normalize(20), marginTop: normalize(20) }}>
            <Text
              style={{
                fontSize: normalize(24),
                marginBottom: normalize(12),
                fontWeight: '400',
                textAlign: 'center',
                top: normalize(-70),
                color:'#1E1E1E'
              }}
            >
              MBTI를 선택해 주세요
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              {[
                'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
                'ISTP', 'ISFP', 'INFP', 'INTP',
                'ESTP', 'ESFP', 'ENFP', 'ENTP',
                'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
              ].map((mbti, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedMbti(mbti)}
                  style={{
                    width: '23%',
                    padding: normalize(10),
                    marginBottom: normalize(10),
                    borderRadius: normalize(8),
                    borderWidth: 1,
                    borderColor: '#726BEA',
                    alignItems: 'center',
                    backgroundColor: selectedMbti === mbti ? '#B3A4F7' : '#FFFFFF',
                  }}
                >
                  <Text
                    style={{
                      color: selectedMbti === mbti ? '#FFFFFF' : '#373737',
                      fontWeight: '500',
                      fontSize: normalize(16),
                    }}
                  >
                    {mbti}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ alignItems: 'center', marginTop: normalize(10) }}>
              <TouchableOpacity
                onPress={toggleMbti}
                style={{
                  width: '23%',
                  padding: normalize(10),
                  marginBottom: normalize(10),
                  borderRadius: normalize(8),
                  borderWidth: 1,
                  borderColor: '#726BEA',
                  alignItems: 'center',
                  backgroundColor: selectedMbti === 'NONE' ? '#B3A4F7' : '#FFF',
                }}
              >
                <Text
                  style={{
                    color: selectedMbti === 'NONE' ? '#FFFFFF' : '#000',
                    fontWeight: '500',
                    fontSize: normalize(16),
                  }}
                >
                  선택없음
                </Text>
              </TouchableOpacity>
            </View> 
          </View> 
        )}

        {/* Slide 4: 여행 스타일 */}
        {currentSlide === 3 && (
          <View style={{ paddingHorizontal: normalize(20), marginTop: normalize(20) }}>
            <Text style={{
              fontSize: normalize(24), marginBottom: normalize(5), fontWeight: '400', color:'#1E1E1E',
              textAlign: 'center', top: normalize(-50)
            }}>
              여행 스타일을 선택해 주세요
            </Text>
            <View style={{
              flexDirection: 'row', flexWrap: 'wrap',
              justifyContent: 'space-between', paddingTop: normalize(70), marginBottom: normalize(-10)
            }}>
              {["액티비티", "문화/관광", "힐링", "맛집", "도심", "자연"].map((style, index) => {
                const isSelected = selectedTravelStyles.includes(style);
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => toggleTravelStyle(style)}
                    style={{
                      width: '30%',
                      paddingVertical: normalize(13),
                      marginBottom: normalize(10),
                      borderRadius: normalize(8),
                      borderWidth: 1,
                      borderColor: '#726BEA',
                      alignItems: 'center',
                      backgroundColor: isSelected ? '#B3A4F7' : '#FFFFFF',
                    }}
                  >
                    <Text style={{
                      color: isSelected ? '#FFFFFF' : '#373737',
                      fontWeight: '400',
                      fontSize: normalize(16),
                      textAlign:'center'
                    }}>
                      {style}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ alignItems: 'center', marginTop: normalize(10) }}>
              <TouchableOpacity
                onPress={toggleSelectNone}
                style={{
                  width: '30%',
                  padding: normalize(10),
                  marginBottom: normalize(10),
                  paddingVertical: normalize(13),
                  paddingHorizontal: normalize(20),
                  borderRadius: normalize(8),
                  borderWidth: 1,
                  alignItems: 'center',
                  borderColor: '#726BEA',
                  backgroundColor: selectedTravelStyles.includes('선택없음') ? '#B3A4F7' : '#FFFFFF',
                }}
              >
                <Text style={{
                  color: selectedTravelStyles.includes('선택없음') ? '#FFFFFF' : '#373737',
                  fontWeight: '400',
                  fontSize: normalize(16),
                }}>
                  선택없음
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* ✅ 하단 버튼 조건 분기 */}
      {currentSlide === 3 ? (
        <View style={styles.customPlanButtonContainer}>
          <TouchableOpacity style={styles.customPlanButton} onPress={handleCustomPlan}>
            <Text style={styles.customPlanButtonText}>나만의 여행 플랜 제작</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.fixedButtonContainer1}>
            <TouchableOpacity
              style={[
                styles.fixedButton1,
                {
                  backgroundColor: isDateSelected ? '#FFF' : '#FFF',
                  borderColor: isDateSelected ? '#4F46E5' : '#A8A8A8',
                },
              ]}
              disabled={!isDateSelected}
              onPress={handleCreateSchedule}
            >
              <Text
                style={[
                  styles.fixedButtonText1,
                  {
                    color: isDateSelected ? '#4F46E5' : '#A8A8A8',
                  },
                ]}
              >
                여행플랜 바로 제작
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.fixedButtonContainer2}>
            <TouchableOpacity
              style={[
                styles.fixedButton2,
                {
                  backgroundColor: isDateSelected ? '#4F46E5' : '#A8A8A8',
                },
              ]}
              disabled={!isDateSelected}
              onPress={() => goToSlide(currentSlide + 1)}
            >
              <Text
                style={[
                  styles.fixedButtonText2,
                  {
                    color: '#FFFFFF',
                  },
                ]}
              >
                다음으로
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {/* 슬라이드 닷 */}
      <View style={[styles.slideIndicatorContainer, { marginBottom: normalize(60), marginTop: normalize(-40) }]} {...panResponder.panHandlers}>
        {[0, 1, 2, 3].map((index) => (
          <TouchableOpacity key={index} onPress={() => goToSlide(index)} style={[styles.slideDot, currentSlide === index ? styles.activeDot : styles.inactiveDot]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: normalize(105, 'height'),
    backgroundColor: '#Fafafa',
    zIndex: 10,
    paddingTop: normalize(20, 'height'),
  },
  wrapper: {
    paddingBottom: normalize(140, 'height'),
    backgroundColor: '#fafafa',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
    marginBottom: normalize(10),
  },
  logoText: {
    fontSize: normalize(40),
    fontFamily: 'KaushanScript_400Regular',
    color: '#4F46E5',
    lineHeight: normalize(80, 'height'),
    letterSpacing: 0,
    top: normalize(15, 'height'),
  },
  profileImage: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: '#ccc',
    marginTop: normalize(30),
    top: normalize(5),
  },
  headerLine: {
    width: '90%',
    marginBottom: normalize(10),
    alignSelf: 'center',
    height: 1,
    backgroundColor: '#999',
  },
  divider: {
    width: '90%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: normalize(10),
    marginBottom: normalize(10),
    top: normalize(-20),
  },
  calendarBox: {
    paddingHorizontal: normalize(20),
    marginTop: normalize(20),
    top: normalize(-110),
    backgroundColor:'#fafafa',
  },
  calendarLabel: {
    fontSize: normalize(16),
    fontWeight: '400',
    fontFamily: 'Roboto',
    lineHeight: normalize(24, 'height'),
    color: '#000',
    marginBottom: normalize(10),
    top: normalize(-9),
  },
  dateButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: normalize(10),
    backgroundColor:'#fafafa',
    marginTop: normalize(12),
    marginBottom: normalize(12),
  },
  dateButton: {
    backgroundColor: '#EAE6FB',
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(10),
    minWidth: normalize(150),
    alignItems: 'center',
    top:normalize(25),
  },
  dateButtonText: {
    fontSize: normalize(16),
    fontFamily: 'Roboto',
    color: '#373737',
    fontWeight: '500',
  },
  fixedButtonContainer1: {
    position: 'absolute',
    bottom: normalize(35),
    left: normalize(16),
    right: normalize(16),
    alignItems: 'center',
  },
  fixedButtonContainer2: {
    position: 'absolute',
    bottom: normalize(35),
    left: normalize(16),
    right: normalize(16),
    alignItems: 'center',
  },
  fixedButton1: {
    width: normalize(358),
    height: normalize(50),
    backgroundColor: '#FFF',
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    top: normalize(-42),
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  fixedButton2: {
    width: normalize(358),
    height: normalize(50),
    backgroundColor: '#4F46E5',
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    top: normalize(20),
  },
  fixedButtonText1: {
    fontSize: normalize(18),
    fontFamily: 'Inter',
    color: '#4F46E5',
    fontWeight: '500',
    lineHeight: normalize(22, 'height'),
  },
  fixedButtonText2: {
    fontSize: normalize(18),
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: normalize(22, 'height'),
  },
  slideIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: normalize(100),
    left: '53%',
    transform: [{ translateX: -50 }],
    zIndex: 10,
  },
  slideDot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
    margin: normalize(5),
  },
  activeDot: {
    backgroundColor: '#616161',
  },
  inactiveDot: {
    backgroundColor: '#C4C4C4',
  },
  firstTitle: {
    fontSize: normalize(18),
    top:normalize(-15)
  },
  secondTitle: {
    fontSize: normalize(18),
    top:normalize(26)
  },
  thirdTitle: {
    fontSize: normalize(18),
    top:normalize(25)
  },
  thirdTitlesmall: {
    color:'#7E7E7E',
    marginLeft:normalize(5),
    fontSize: normalize(14),
  },
  divider1: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: normalize(10),
    marginBottom: normalize(10),
    top:normalize(-7)
  },
  divider2: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: normalize(60),
    marginBottom: normalize(10),
    top:normalize(-15)
  },
  divider3: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: normalize(50),
    marginBottom: normalize(10),
    top:0
  },
  sliderLabel: {
    fontSize: normalize(12),
    color: '#7E7E7E',
  },
  budgetValueBox: {
    backgroundColor: '#EAE6FD',
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(20),
    alignSelf: 'center',
    marginTop: normalize(12),
  },
  budgetValueText: {
    fontSize: normalize(14),
    color: '#000',
    fontWeight: '400',
    textAlign: 'center',
  },
  disabledBudgetBox: {
    backgroundColor: '#E6E6E6',
  },  
  disabledText: {
    color: '#333',
  },
  customPlanButtonContainer: {
    position: 'absolute',
    bottom: normalize(35),
    left: normalize(16),
    right: normalize(16),
  },
  customPlanButton: {
    width: normalize(358),
    height: normalize(50),
    backgroundColor: '#4F46E5',
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    top: normalize(20),
  },
  customPlanButtonText: {
    fontSize: normalize(18),
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: normalize(22, 'height'),
  },
});

