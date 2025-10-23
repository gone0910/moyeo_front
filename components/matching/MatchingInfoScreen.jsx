import React, { useState, useContext, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Dimensions, PixelRatio, Platform, findNodeHandle
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { UserContext } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import AccordionCardInfo from '../common/AccordionCardInfo';
import RegionSelector from '../common/RegionSelector';
import ToggleSelector2 from '../common/ToggleSelector2';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { convertMatchingInputToDto } from './utils/matchingUtils';
import { submitMatchingProfile } from '../../api/matching';
import { REGION_MAP, PROVINCE_MAP } from '../common/regionMap';
import HeaderBar from '../../components/common/HeaderBar';
import { UIManager } from 'react-native';
import MultiRegionSelector from '../matching/common/MultiRegionSelector';

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

export default function MatchingInfoScreen() {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedProvinces, setSelectedProvinces] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedItems, setSelectedItems] = useState({
    group: '', tripstyle: [], gender: '', age: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollViewRef = useRef(null);
  const sectionRefs = useRef({});

  

  const handleDayPress = (day) => {
    const selected = day.dateString;
    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
    } else if (startDate && !endDate) {
      selected > startDate ? setEndDate(selected) : setStartDate(selected);
    }
  };

  const handleSelect = (key) => (value) => {
    setSelectedItems((prev) => ({ ...prev, [key]: value }));
  };

  const handleMultiSelect = (key) => (value) => {
    setSelectedItems((prev) => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const getMarkedDates = () => {
    if (!startDate) return {};
    const marked = {
      [startDate]: { startingDay: true, endingDay: !endDate, color: '#7F7BCD', textColor: '#fff' },
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
      marked[endDate] = { endingDay: true, color: '#716AE9', textColor: '#fff' };
    }
    return marked;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${y}.${m}.${d}`;
  };

  const handleSubmit = async () => {
    const isMock = await AsyncStorage.getItem('mock');
    if (isMock === 'true') {
      console.log('[🧪 MOCK] 조건 입력 완료 → 리스트 화면으로 이동');
      navigation.navigate('MatchingList');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('jwt');

    // ✅ province: 코드(ENUM) 그대로 사용 — 한글로 바꾸지 않음!
    const provinceEnum =
      Array.isArray(selectedProvinces) && selectedProvinces.length > 0
        ? selectedProvinces[0]           // 예: 'SEOUL' | 'GYEONGGI'
        : 'NONE';

    // cities: 코드 배열 (중복 제거)
    const uniqueCityCodes = Array.isArray(selectedCities)
      ? Array.from(new Set(selectedCities))
      : [];

    // 변환 유틸이 기대하는 원본 입력(rawInput)
    const rawInput = {
      startDate,
      endDate,
      province: provinceEnum,                                 // ★ ENUM 그대로
      selectedCities: uniqueCityCodes.length ? uniqueCityCodes : ['NONE'],
      groupType: selectedItems.group || '선택없음',
      ageRange: selectedItems.age || '선택없음',
      travelStyles: Array.isArray(selectedItems.tripstyle)
        ? (selectedItems.tripstyle.length ? selectedItems.tripstyle : ['선택없음'])
        : ['선택없음'],
      preferenceGender: selectedItems.gender || '선택없음',
    };

      const dto = convertMatchingInputToDto(rawInput);
      console.log('📦 백엔드 전송 DTO:', dto);

      await submitMatchingProfile(dto, token);
      console.log('✅ 백엔드 응답 성공');
      navigation.navigate('MatchingList');
    } catch (error) {
      console.error('❌ 매칭 정보 전송 실패:', error);
      Alert.alert('오류', '매칭 조건 전송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccordionToggle = (key) => {
  setTimeout(() => {
    const node = sectionRefs.current[key];
    const scrollViewNode = findNodeHandle(scrollViewRef.current);

    if (node && scrollViewNode) {
      UIManager.measureLayout(
        findNodeHandle(node), // node는 View에 ref된 실제 컴포넌트
        scrollViewNode,
        (error) => {
          console.error('measureLayout error:', error);
        },
        (x, y) => {
          scrollViewRef.current.scrollTo({ y: y - normalize(100, 'height'), animated: true });
        }
      );
    }
  }, 200);
};

  return (
    <View style={styles.container}>
      <HeaderBar />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.wrapper, { paddingTop: normalize(115, 'height') }]}
        ref={scrollViewRef}
      >
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>여행 일정은 필수 입력이에요.</Text>
          <Text style={styles.infoText}>그 외의 여행 스타일은 자유롭게 선택해주세요.</Text>
        </View>

        <View style={styles.calendarBox}>
          <Text style={styles.calendarLabel}>일정 선택<Text style={styles.asterisk}> *</Text></Text>
          <Calendar
    style={{ backgroundColor: '#FAFAFA' }}  // ✅ 추가
    theme={{
      calendarBackground: '#FAFAFA', 
    }}
            hideDayNames={false}
            markingType={'period'}
            markedDates={getMarkedDates()}
            onDayPress={handleDayPress}
            dayComponent={({ date }) => {
              const dayOfWeek = new Date(date.dateString).getDay();
              const isSelected = date.dateString === startDate || date.dateString === endDate;
              const isBetween =
                startDate && endDate &&
                date.dateString > startDate &&
                date.dateString < endDate;

              let textColor = '#000';
              if (dayOfWeek === 0) textColor = '#FF3B30';
              else if (dayOfWeek === 6) textColor = '#007AFF';

              const backgroundColor = isSelected
                ? '#716AE9'
                : isBetween
                  ? '#CECCF5'
                  : 'transparent';

              return (
                <TouchableOpacity onPress={() => handleDayPress(date)}>
                  <View
                    style={{
                      width: normalize(32),
                      height: normalize(32),
                      borderRadius: normalize(16),
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor,
                    }}
                  >
                    <Text style={{ color: isSelected ? '#fff' : textColor, fontSize: normalize(14) }}>
                      {date.day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.divider} />

        {(startDate || endDate) && (
          <View style={styles.dateButtonContainer}>
            {startDate && <View style={styles.dateButton}><Text style={styles.dateButtonText}>시작일: {formatDate(startDate)}</Text></View>}
            {endDate && <View style={styles.dateButton}><Text style={styles.dateButtonText}>종료일: {formatDate(endDate)}</Text></View>}
          </View>
        )}

        {/* 👇 아코디언 카드 영역 + 참조 저장 + 토글 핸들러 전달 */}
        {[
          { key: 'region', title: "이번 여행, 어디로 떠나시나요?", content:
            <MultiRegionSelector
              selectedProvinces={selectedProvinces}
              selectedCities={selectedCities}
              onProvincesChange={setSelectedProvinces}
              onCitiesChange={setSelectedCities}
            />,
            contentStyle: { marginTop: 6 },
          },
          { key: 'group', title: "나의 여행, 몇명이 좋을까요?", content:
            <ToggleSelector2 items={["선택없음", "단둘이", "여럿이"]}
              selectedItem={selectedItems.group}
              onSelect={handleSelect('group')} size="large" />
          },
          { key: 'style', title: "나의 여행 스타일을 알려주세요", content:
            <ToggleSelector2 items={["액티비티", "문화/관광", "힐링", "맛집", "도심", "자연"]}
              selectedItem={selectedItems.tripstyle}
              onSelect={handleMultiSelect('tripstyle')} size="large" />
          },
          { key: 'gender', title: "선호하는 동행자의 성별은?", content:
            <ToggleSelector2 items={["선택없음", "남성", "여성"]}
              selectedItem={selectedItems.gender}
              onSelect={handleSelect('gender')} size="large" />
          },
          { key: 'age', title: "동행자 나이는 어느 연령대가 편하신가요?", content:
            <ToggleSelector2 items={["선택없음", "20대", "30대", "40대", "50대", "60대 이상"]}
              selectedItem={selectedItems.age}
              onSelect={handleSelect('age')} size="large" />
          },
        ].map(({ key, title, content, contentStyle }) => (
           <View key={key}>
    {/* ✅ 여기에 ref와 collapsable=false 적용 */}
    <View
      ref={(ref) => { sectionRefs.current[key] = ref; }}
      collapsable={false}
    />
            <AccordionCardInfo
  ref={(ref) => { sectionRefs.current[key] = ref; }}
  title={title}
  onToggle={() => handleAccordionToggle(key)}
  contentStyle={contentStyle}
>
              {content}
            </AccordionCardInfo>
          </View>
        ))}
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.fixedButton, (isSubmitting || !startDate || !endDate) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={isSubmitting || !startDate || !endDate}
        >
          <Text style={styles.fixedButtonText}>함께할 여행자 찾아보기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ===== 스타일: normalize() 적용 =====
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
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    paddingTop: normalize(20, 'height'),
  },
  wrapper: {
    paddingBottom: normalize(0, 'height'),
    marginTop: normalize(-40, 'height'),
    backgroundColor: '#FAFAFA',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
    marginBottom: normalize(10, 'height'),
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
    marginTop: normalize(30, 'height'),
    top: normalize(5, 'height'),
  },
  headerLine: {
    width: '90%',
    marginBottom: normalize(10, 'height'),
    alignSelf: 'center',
    height: normalize(1, 'height'),
    backgroundColor: '#999',
  },
  divider: {
    width: '90%',
    height: normalize(1, 'height'),
    backgroundColor: '#E6E6E6',
    alignSelf: 'center',
    marginTop: normalize(10, 'height'),
    marginBottom: normalize(10, 'height'),
  },
  infoBox: {
    width: normalize(358),
    height: normalize(67, 'height'),
    borderRadius: normalize(10),
    backgroundColor: '#CECCF5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(16),
    alignSelf: 'center',
    marginBottom: normalize(16, 'height'),
  },
  infoText: {
    fontFamily: 'Roboto',
    fontSize: normalize(14),
    lineHeight: normalize(24, 'height'),
    fontWeight: '400',
    color: '#616161',
    textAlign: 'center',
  },
  calendarBox: {
    color: '#fafafa',
    paddingHorizontal: normalize(20),
    marginTop: normalize(10, 'height'),
  },
  calendarLabel: {
    fontSize: normalize(16),
    fontWeight: '400',
    fontFamily: 'Roboto',
    lineHeight: normalize(24, 'height'),
    color: '#373737',
    marginBottom: normalize(8, 'height'),
  },
  dateButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: normalize(10),
    marginTop: normalize(12, 'height'),
    marginBottom : normalize(12, 'height'),
  },
  dateButton: {
    backgroundColor: '#EAE6FB',
    paddingVertical: normalize(8, 'height'),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(10),
    minWidth: normalize(150),
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: normalize(14),
    fontFamily: 'Roboto',
    color: '#373737',
    fontWeight: '500',
  },
  fixedButtonContainer: {  // 함께할 여행자 찾아보기 버튼
    position: 'absolute',
    bottom: normalize(25, 'height'), // 하단탭과 겹치지 않게 조정
    left: normalize(16),
    right: normalize(16),
    alignItems: 'center',
  },
  fixedButton: {
    width: normalize(358),
    height: normalize(58, 'height'),
    backgroundColor: '#4F46E5',
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    top: normalize(10, 'height'),
  },
  fixedButtonText: {
    fontSize: normalize(16),
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: normalize(22, 'height'),
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  asterisk: {
  color: '#EF4444',   // 빨간색
  fontWeight: 'bold',
  fontSize: 20,
  },
});