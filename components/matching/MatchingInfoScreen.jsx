// components/matching/MatchingInfoScreen.jsx  매칭 정보 기입 화면
import React, { useState, useContext } from 'react';
import { View,Text,Image,StyleSheet,ScrollView, TouchableOpacity, Alert,} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { UserContext } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import AccordionCardInfo from '../common/AccordionCardInfo';
import ToggleSelector from '../common/ToggleSelector';
import ToggleSelector2 from '../common/ToggleSelector2';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { convertMatchingInputToDto } from './utils/matchingUtils';
import { submitMatchingProfile } from '../../api/matching';

export default function MatchingInfoScreen() {
  // 🔐 로그인한 사용자 정보 가져오기
  const { user } = useContext(UserContext);
  const navigation = useNavigation();

  // 📆 날짜 선택 상태값
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // 📍 지역(도/시군) 선택 상태값
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // 👥 사용자 조건(성향, 인원, 나이대, 성별 등) 상태값
  const [selectedItems, setSelectedItems] = useState({
    group: '',
    tripstyle: '',
    gender: '',
    age: '',
  });

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

    try {
      // 📌 JWT 토큰 가져오기
      const token = await AsyncStorage.getItem('jwt');

      // ✏️ 입력값을 서버 DTO 형식으로 변환
      const rawInput = {
        startDate,
        endDate,
        province: selectedRegion,
        selectedCities: selectedCity ? [selectedCity] : [],
        groupType: selectedItems.group,
        ageRange: selectedItems.age,
        travelStyles: selectedItems.tripstyle ? [selectedItems.tripstyle] : [],
      };

      const dto = convertMatchingInputToDto(rawInput);
      console.log('📦 백엔드 전송 DTO:', dto); // ✅ 전송 전 로그

      // 🔁 axios 전송 → 백엔드에 매칭 조건 저장 요청
      const response = await submitMatchingProfile(dto, token);
      console.log('✅ 백엔드 응답 성공:', response?.data || response); // ✅ 성공 로그

      // 🔜 리스트 화면으로 이동
      navigation.navigate('MatchingList');
    } catch (error) {
      console.error('❌ 매칭 정보 전송 실패:', error); // 🔴 실패 로그
      Alert.alert('오류', '매칭 조건 전송에 실패했습니다.');
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

      <ScrollView style={styles.scrollArea} contentContainerStyle={[styles.wrapper, { paddingTop: 115 }]}>
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
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor,
                    }}
                  >
                    <Text style={{ color: isSelected ? '#fff' : textColor }}>
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

        <AccordionCardInfo title="이번 여행, 어디로 떠나시나요?">
          <ToggleSelector
            items={["선택없음", "서울", "제주", "경기도", "강원도", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도"]}
            selectedItem={selectedRegion}
            onSelect={setSelectedRegion}
            size="large"
          />
          {/* 지역에 따른 세부 토글들 */}
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
          {/* 다른 지역들도 동일하게 추가됨 */}
          {/* ... */}
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
            items={["선택없음", "액티비티", "문화/관광", "힐링", "맛집", "도심", "자연"]}
            selectedItem={selectedItems.tripstyle}
            onSelect={handleSelect('tripstyle')}
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
          style={styles.fixedButton}
          onPress={handleSubmit}  // ✅ mock / 실제 API 모두 대응
        >
          <Text style={styles.fixedButtonText}>함께할 여행자 찾아보기</Text>
        </TouchableOpacity>
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
    top:15,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginTop: 30,
    top:5,
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
  },
  infoBox: {
    width: 358,
    height: 67,
    borderRadius: 10,
    backgroundColor: '#CECCF5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '400',
    color: '#616161',
    textAlign: 'center',
  },
  calendarBox: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  calendarLabel: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Roboto',
    lineHeight: 24,
    color: '#373737',
    marginBottom: 8,
  },
  dateButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom : 12,
  },
  dateButton: {
    backgroundColor: '#EAE6FB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: '#373737',
    fontWeight: '500',
  },
  fixedButtonContainer: {  // 함께할 여행자 찾아보기 버튼
    position: 'absolute',
    bottom: 35,            // 하단탭과 겹치지 않게 조정
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  fixedButton: {
    width: 358,
    height: 58,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    top: 10,
  },
  fixedButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 22,
  },
});