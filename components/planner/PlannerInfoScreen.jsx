import  { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { UserContext } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import { Animated } from 'react-native';
import ToggleSelector from '../common/ToggleSelector';
import ToggleSelector3 from '../common/ToggleSelector3';
import Slider from '@react-native-community/slider';
import { createSchedule } from '../../api/createSchedule';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { planner_create_requst } from '../../api/planner_create_request';

export default function PlannerInfoScreen() {
  useEffect(() => {
    AsyncStorage.setItem('token', 'mock-token');
  }, []);
  //  useEffect(() => {
  // AsyncStorage.setItem('token', 'your-real-token-here');
// }, []);
  const { user } = useContext(UserContext);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedMbti, setSelectedMbti] = useState(null);
  const [selectedTravelStyles, setSelectedTravelStyles] = useState([]);
  const toggleMbti = () => {
    setSelectedMbti((prev) => (prev === 'NONE' ? null : 'NONE'));
  };
  const handleCustomPlan = () => {
     handleCreateSchedule();
  goToSlide(currentSlide + 1); // 슬라이드 다음 단계로 이동
};

  const toggleSelectNone = () => {
    if (selectedTravelStyles.includes('선택없음')) {
      // 선택되어 있으면 해제
      setSelectedTravelStyles([]);
    } else {
      // 다른 선택 해제 후 선택없음만 선택
      setSelectedTravelStyles(['선택없음']);
    }
  };

  

  const navigation = useNavigation();
  const [budget, setBudget] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const handleValueChange = (value) => {
    setIsActive(true);
    setBudget(value);
  };
  const handleCreateSchedule = async () => {
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
      '힐링': 'HEALING',
      '맛집': 'FOOD',
      '도심': 'CITY',
      '자연': 'NATURE',
    };
  
    // 목적지 선택 (도시 > 지역 우선)
    const destination = [];

    if (selectedRegion && Province[selectedRegion]) {
      destination.push(Province[selectedRegion]); // 예: 'SEOUL'
    }
    
    if (selectedCity && City[selectedCity]) {
      destination.push(City[selectedCity]); // 예: 'GANGBUK_GU'
    }
    
    if (destination.length === 0) {
      destination.push('NONE');
    }
    const MBTI = selectedMbti === '선택안함' || !selectedMbti ? 'NONE' : selectedMbti;

  
    const travelStyle = selectedTravelStyles.length === 0
  ? ['NONE']
  : selectedTravelStyles.map((style) => TravelStyle[style]).filter(Boolean);

  
    const groupMap = {
      '선택안함': 'NONE',
      '혼자': 'ALONE',
      '단둘이': 'DUO',
      '여럿이': 'GROUP',
    };
    const peopleGroup = groupMap[selectedItems.group] || 'NONE';

  
    console.log('📤 API 요청 전 데이터:', {
      startDate,
      endDate,
      destination,
      MBTI,
      travelStyle,
      peopleGroup,
      budget,
    });
  
    await createSchedule(
      startDate,
      endDate,
      destination,
      MBTI,
      travelStyle,
      peopleGroup,
      budget
    );
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
        return prev.includes(style)
          ? prev.filter((s) => s !== style) // 이미 있으면 제거
          : [...prev, style];              // 없으면 추가
      });
    };

  const slideIndicatorPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const slideIndicatorWidth = 40;

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

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigation.replace('BottomTab')}>
            <Text style={styles.logoText}>moyeo </Text>
          </TouchableOpacity>
          <Image source={{ uri: user?.profileImageUrl }} style={styles.profileImage} />
        </View>
        <View style={styles.headerLine} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={[styles.wrapper, { paddingTop: 220 }]}>
        {currentSlide === 0 && (
          <View style={styles.calendarBox}>
            <Text style={styles.calendarLabel}>일정 선택</Text>
            <Calendar
              hideDayNames={false}
              markingType={'period'}
              markedDates={getMarkedDates()}
              onDayPress={handleDayPress}
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
                    <View style={{ width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor }}>
                      <Text style={{ color: isSelected ? '#fff' : textColor }}>{date.day}</Text>
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

{currentSlide === 1 && (
  <View style={{ paddingHorizontal: 20, marginTop: 10, top: -90 }}>
    
    {/* 목적지 */}
    <Text style={styles.firstTitle}>목적지</Text>
    <View style={styles.divider1} />
    <ToggleSelector
      items={["선택안함", "서울", "제주", "경기도", "강원도", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도"]}
      selectedItem={selectedRegion}
      onSelect={setSelectedRegion}
      size="large"
    />

    {/* 도시 */}
    {selectedRegion === '서울' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
        />
      </View>
    )}
    {selectedRegion === '제주' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["제주시", "서귀포시"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
        />
      </View>
    )}
      {selectedRegion === '경기도' && (
      <View style={{ marginTop: 4 }}>
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
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
        />
      </View>
    )}
    {selectedRegion === '충청북도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["청주시", "충주시", "제천시"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
        />
      </View>
    )}
    {selectedRegion === '충청남도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "부여군", "홍성군"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
        />
      </View>
    )}
    {selectedRegion === '전라북도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "순창군"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
        />
      </View>
    )}
    {selectedRegion === '전라남도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["목포시", "여수시", "순천시", "나주시", "광양시", "해남군"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
        />
      </View>
    )}
    {selectedRegion === '경상북도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["포항시"," 경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "울진군", "울릉군"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
        />
      </View>
    )}
    {selectedRegion === '경상남도' && (
      <View style={{ marginTop: 4 }}>
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

<View style={{ marginTop: 10 }}>
  <Slider
    style={{ width: '100%', height: 40 }}
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
    !isActive && styles.disabledBudgetBox, // 여기서만 박스 스타일 바꾸기
  ]}
>
  <Text
    style={[
      styles.budgetValueText,
      !isActive && styles.disabledBudgetText, // 글자색만 바꾸기
    ]}
  >
    예산: {budget.toLocaleString()}원
  </Text>
</View>
</View>
  </View>
)}



{currentSlide === 2 && (
  <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
    <Text
      style={{
        fontSize: 24,
        marginBottom: 12,
        fontWeight: '400',
        textAlign: 'center',
        top: -70,
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
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
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
            }}
          >
            {mbti}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* 선택안함 버튼 - 중앙 정렬 */}
    <View style={{ alignItems: 'center', marginTop: 10 }}>
  <TouchableOpacity
    onPress={toggleMbti}
    style={{
      width: '23%',
      padding: 10,
      marginBottom: 10,
      borderRadius: 8,
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
      }}
    >
      선택없음
    </Text>
  </TouchableOpacity>
</View> 
</View> 
)}


{currentSlide === 3 && (
  <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
    <Text style={{ fontSize: 24, marginBottom: 5, fontWeight: '400', color:'#1E1E1E', textAlign: 'center', top: -50 }}>
      여행 스타일을 선택해 주세요
    </Text>

    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingTop: 70, marginBottom:-10}}>
      {["액티비티", "문화/관광", "힐링", "맛집", "도심", "자연"].map((style, index) => {
        const isSelected = selectedTravelStyles.includes(style);

        return (
          <TouchableOpacity
            key={index}
            onPress={() => toggleTravelStyle(style)}
            style={{
              width: '30%',
              paddingVertical: 13,
              marginBottom: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#726BEA',
              alignItems: 'center',
              backgroundColor: isSelected ? '#B3A4F7' : '#FFFFFF',
            }}
          >
            <Text style={{
              color: isSelected ? '#FFFFFF' : '#373737',
              fontWeight: '400',
              fontSize: 16,
              textAlign:'center'
            }}>
              {style}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>

    {/* 선택없음 버튼 */}
    <View style={{ alignItems: 'center', marginTop: 10 }}>
  <TouchableOpacity
    onPress={toggleSelectNone}
    style={{
      width: '30%',
      padding: 10,
      marginBottom: 10,
      paddingVertical: 13,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      borderColor: '#726BEA',
      backgroundColor: selectedTravelStyles.includes('선택없음') ? '#B3A4F7' : '#FFFFFF',
    }}
  >
    <Text style={{
      color: selectedTravelStyles.includes('선택없음') ? '#FFFFFF' : '#373737',
      fontWeight: '400',
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
  // 👉 currentSlide가 3일 때만 보여줄 버튼
  <View style={styles.customPlanButtonContainer}>
    <TouchableOpacity style={styles.customPlanButton} onPress={handleCustomPlan}>
      <Text style={styles.customPlanButtonText}>나만의 여행 플랜 제작</Text>
    </TouchableOpacity>
  </View>
) : (
  // 👉 currentSlide가 3이 아닐 때 기존 버튼 보여주기
  <>
    {/* 여행플랜 바로 제작 버튼 */}
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

    {/* 다음으로 버튼 */}
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
      <View style={[styles.slideIndicatorContainer, { marginBottom: 60, marginTop: -40 }]} {...panResponder.panHandlers}>
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
    height: 105,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    paddingTop: 20,
  },
  wrapper: {
    paddingBottom: 140,
    backgroundColor: '#FAFAFA',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 40,
    fontFamily: 'KaushanScript_400Regular',
    color: '#4F46E5',
    lineHeight: 80,
    letterSpacing: 0,
    top: 15,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginTop: 30,
    top: 5,
  },
  headerLine: {
    width: '90%',
    marginBottom: 10,
    alignSelf: 'center',
    height: 1,
    backgroundColor: '#999',
  },
  divider: {
    width: '90%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
    top: -20
  },
  calendarBox: {
    paddingHorizontal: 20,
    marginTop: 20,
    top: -110,
    backgroundColor:'#FAFAFA'
  },
  calendarLabel: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Roboto',
    lineHeight: 24,
    color: '#000',
    marginBottom: 10,
    top: -9,
  },
  dateButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: '#EAE6FB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
    top:25,
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#373737',
    fontWeight: '500',
  },
  fixedButtonContainer1: {
    position: 'absolute',
    bottom: 35,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  fixedButtonContainer2: {
    position: 'absolute',
    bottom: 35,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  fixedButton1: {
    width: 358,
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    top: -42,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  fixedButton2: {
    width: 358,
    height: 50,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    top: 20,
  },
  fixedButtonText1: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#4F46E5',
    fontWeight: '500',
    lineHeight: 22,
  },
  fixedButtonText2: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 22,
  },
  slideIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
    left: '53%',
    transform: [{ translateX: -50 }],
    zIndex: 10,
  },
  slideDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    margin: 5,
  },
  activeDot: {
    backgroundColor: '#616161',
  },
  inactiveDot: {
    backgroundColor: '#C4C4C4',
  },
  firstTitle: {
    fontSize: 18,
    top:-15
  },
  secondTitle: {
    fontSize: 18,
    top:26
  },
  thirdTitle: {
    fontSize: 18,
    top:25
  },
  thirdTitlesmall: {
    color:'#7E7E7E',
    marginLeft:5,
  },
  divider1: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
    top:-7
  },
  divider2: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: 60,
    marginBottom: 10,
    top:-15
  },
  divider3: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: 50,
    marginBottom: 10,
    top:0
  },
  sliderLabel: {
    fontSize: 12,
    color: '#7E7E7E',
  },
  budgetValueBox: {
    backgroundColor: '#EAE6FD',      // 기본 보라색 배경
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 12,
  },
  budgetValueText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '400',
    textAlign: 'center',
  },
  disabledBudgetBox: {
    backgroundColor: '#E6E6E6',      // 비활성화 시 밝은 회색 배경
  },  
  disabledText: {
    color: '#333',
  },
  customPlanButtonContainer: {
  position: 'absolute',
  bottom: 30,
  width: '100%',
  paddingHorizontal: 20,
},

customPlanButton: {
  width: 358,
  height: 50,
  backgroundColor: '#4F46E5',
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
  top: 20, // fixedButton2와 동일
},

customPlanButtonText: {
  fontSize: 18,
  fontFamily: 'Inter',
  color: '#FFFFFF',
  fontWeight: '500',
  lineHeight: 22,
},
});