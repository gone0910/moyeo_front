// 파일: components/matching/MatchingInfoScreen.jsx
// 매칭 기입 화면

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { UserContext } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import AccordionCardInfo from '../common/AccordionCardInfo';
import ToggleSelector from '../common/ToggleSelector';
import ToggleSelector2 from '../common/ToggleSelector2';

export default function MatchingInfoScreen() {
  const { user } = useContext(UserContext);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');  // 목적지용 토글
  const navigation = useNavigation();

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

  
  return (
    <View style={{ flex: 1 }}>
      {/* 상단 고정 영역 */}
      <View style={styles.fixedHeader}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigation.replace('BottomTab')}>
            <Text style={styles.logoText}>moyeo </Text>
          </TouchableOpacity>
          <Image source={{ uri: user?.profileImageUrl }} style={styles.profileImage} />
        </View>
        <View style={styles.headerLine} />
      </View>

      {/* ✅ 나머지 스크롤 영역 */}
      <ScrollView style={styles.scrollArea} 
      contentContainerStyle={[styles.wrapper, { paddingTop: 115 }]}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>여행 일정은 필수 입력이에요.</Text>
          <Text style={styles.infoText}>그 외의 여행 스타일은 자유롭게 선택해주세요.</Text>
        </View>

        <View style={styles.calendarBox}>
          <Text style={styles.calendarLabel}>일정 선택</Text>
          <Calendar
            hideDayNames={false}
            markingType={'period'}
            markedDates={{}} // marking 무효화
            onDayPress={handleDayPress}
            dayComponent={({ date, state }) => {
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
            items={["선택없음", "서울", "제주", "경기도", "강원도", "충청북도", "충청남도"
                    , "전라북도", "전라남도", "경상북도", "경상남도"]}
            selectedItem={selectedRegion}
            onSelect={setSelectedRegion}
            size="large"
          />

          {selectedRegion === '서울' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
                        "노원구",
                        "도봉구", "동대문구", "동작구",
                        "마포구",
                        "서대문구", "서초구", "성동구", "성북구", "송파구",
                        "양천구", "영등포구", "용산구", "은평구",
                        "종로구", "중구", "중랑구"]}
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
                items={["고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시",
                        "남양주시",
                        "동두천시",
                        "부천시",
                        "성남시", "수원시", "시흥시",
                        "안산시", "안성시", "안양시", "양주시", "여주시", "오산시", "용인시", "의왕시", "의정부시", "의천시",
                        "파주시", "평택시", "포천시",
                        "하남시", "화성시"]}
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
                items={["천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시"]}
                selectedItem={selectedCity}
                onSelect={setSelectedCity}
                size="small"
              />
            </View>
          )}
          {selectedRegion === '전라북도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시"]}
                selectedItem={selectedCity}
                onSelect={setSelectedCity}
                size="small"
              />
            </View>
          )}
          {selectedRegion === '전라남도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["목포시", "여수시", "순천시", "나주시", "광양시"]}
                selectedItem={selectedCity}
                onSelect={setSelectedCity}
                size="small"
              />
            </View>
          )}
          {selectedRegion === '경상북도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시"]}
                selectedItem={selectedCity}
                onSelect={setSelectedCity}
                size="small"
              />
            </View>
          )}
          {selectedRegion === '경상남도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시"]}
                selectedItem={selectedCity}
                onSelect={setSelectedCity}
                size="small"
              />
            </View>
          )}
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
        <TouchableOpacity style={styles.fixedButton}>
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
