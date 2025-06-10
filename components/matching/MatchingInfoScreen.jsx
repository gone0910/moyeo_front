// components/matching/MatchingInfoScreen.jsx  매칭 정보 기입 화면
import React, { useState, useContext } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, PixelRatio, Platform } from 'react-native';
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

// ==== 반응형 유틸 함수 ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390; // iPhone 13 기준
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

export default function MatchingInfoScreen() {
  // 🔐 로그인한 사용자 정보 가져오기
  const { user } = useContext(UserContext);
  const navigation = useNavigation();

  // 📆 날짜 선택 상태값
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // 📍 지역(도/시) 선택 상태값
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // 👥 사용자 조건(성향, 인원, 나이대, 성별 등) 상태값
  const [selectedItems, setSelectedItems] = useState({
    group: '',
    tripstyle: [], // ✅ 배열로 변경 (다중 선택 가능)
    gender: '',
    age: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ 전송 중 여부 상태 추가

  // 📌 날짜 클릭 시 처리 로직 (start → end 순서로 선택됨)
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

  // 📌 ToggleSelector에서 선택된 항목 저장
  const handleSelect = (key) => (value) => {
    setSelectedItems((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 액티비티 선택 다중 처리
  const handleMultiSelect = (key) => (value) => {
    setSelectedItems((prev) => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value) // 이미 선택된 값이면 제거
        : [...current, value]; // 없으면 추가
      return { ...prev, [key]: updated };
    });
  };

  // 📅 Calendar 컴포넌트용 마킹 날짜 설정
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

  // 📆 날짜 포맷 변환 (YYYY-MM-DD → YYYY.MM.DD)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${y}.${m}.${d}`;
  };

  // 📨 매칭 조건 제출 핸들러 (mock 대응 + 실제 axios 연동)
  const handleSubmit = async () => {
    const isMock = await AsyncStorage.getItem('mock');
    // 🧪 mock 모드일 경우 서버 호출 없이 화면 이동
    if (isMock === 'true') {
      console.log('[🧪 MOCK] 조건 입력 완료 → 리스트 화면으로 이동');
      navigation.navigate('MatchingList');
      return;
    }

    setIsSubmitting(true); // ✅ 전송 중 시작
    try {
      const token = await AsyncStorage.getItem('jwt');  // 토큰 가져오기
      // 도에 해당하는 시 목록을 REGION_MAP에서 가져오기 (없을 경우 빈 배열)
      const provinceData = REGION_MAP[selectedProvince] || [];
      // 시 선택 여부에 따라 cities 값 설정 (도만 선택 시 'NONE' 전송)
      const selectedCityCodes = selectedCity
        ? [provinceData.find((c) => c.name === selectedCity)?.code]
        : ['NONE'];

      // ✏️ 입력값을 서버 DTO 형식으로 변환
      const rawInput = {
        startDate,
        endDate,
        province: selectedProvince || 'NONE', //이미 ENUM
        selectedCities: selectedCity ? [selectedCity] : ['NONE'], // 이미 ENUM
        groupType: selectedItems.group,
        ageRange: selectedItems.age,
        travelStyles: Array.isArray(selectedItems.tripstyle)
          ? selectedItems.tripstyle.length > 0
            ? selectedItems.tripstyle
            : ['NONE']
          : selectedItems.tripstyle
          ? [selectedItems.tripstyle]
          : ['NONE'],
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
      setIsSubmitting(false); // ✅ 전송 완료 or 실패 시 해제
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.fixedHeader}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigation.replace('BottomTab')}>
            <Text style={styles.logoText}>moyeo </Text>
          </TouchableOpacity>
          <Image source={{ uri: user?.profileImageUrl }} style={styles.profileImage} />
        </View>
        <View style={styles.headerLine} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={[styles.wrapper, { paddingTop: normalize(115, 'height') }]}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>여행 일정은 필수 입력이에요.</Text>
          <Text style={styles.infoText}>그 외의 여행 스타일은 자유롭게 선택해주세요.</Text>
        </View>

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
              const isBetween =
                startDate &&
                endDate &&
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
            {startDate && (
              <View style={styles.dateButton}>
                <Text style={styles.dateButtonText}>시작일: {formatDate(startDate)}</Text>
              </View>
            )}
            {endDate && (
              <View style={styles.dateButton}>
                <Text style={styles.dateButtonText}>종료일: {formatDate(endDate)}</Text>
              </View>
            )}
          </View>
        )}
        {/* 지역 토글을 전부 관리하는 RegionSelector.jsx 호출 */}
        <AccordionCardInfo title="이번 여행, 어디로 떠나시나요?">
          <RegionSelector
            selectedProvince={selectedProvince}
            selectedCity={selectedCity}
            onProvinceChange={setSelectedProvince}
            onCityChange={setSelectedCity}
          />
        </AccordionCardInfo>

        <AccordionCardInfo title="나의 여행, 몇명이 좋을까요?">
          <ToggleSelector2
            items={["선택없음", "단둘이", "여럿이"]}
            selectedItem={selectedItems.group}
            onSelect={handleSelect('group')}
            size="large"
          />
        </AccordionCardInfo>

        <AccordionCardInfo title="나의 여행 스타일을 알려주세요">
          <ToggleSelector2
            items={["액티비티", "문화/관광", "힐링", "맛집", "도심", "자연"]}
            selectedItem={selectedItems.tripstyle}
            onSelect={handleMultiSelect('tripstyle')}
            size="large"
          />
        </AccordionCardInfo>

        <AccordionCardInfo title="선호하는 동행자의 성별은?">
          <ToggleSelector2
            items={["선택없음", "남성", "여성"]}
            selectedItem={selectedItems.gender}
            onSelect={handleSelect('gender')}
            size="large"
          />
        </AccordionCardInfo>

        <AccordionCardInfo title="동행자 나이는 어느 연령대가 편하신가요?">
          <ToggleSelector2
            items={["선택없음", "20대", "30대", "40대", "50대", "60대 이상"]}
            selectedItem={selectedItems.age}
            onSelect={handleSelect('age')}
            size="large"
          />
        </AccordionCardInfo>
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.fixedButton, (isSubmitting || !startDate || !endDate) && { opacity: 0.5 }]} // 일정 미입력 시에도 비활성화
          onPress={handleSubmit}
          disabled={isSubmitting || !startDate || !endDate} // 날짜 입력 필수 처리, 중복 전송송 방지
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
    paddingBottom: normalize(140, 'height'),
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
    bottom: normalize(35, 'height'), // 하단탭과 겹치지 않게 조정
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
});
