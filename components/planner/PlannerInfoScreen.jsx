import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { UserContext } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';

export default function PlannerInfoScreen() {
  const { user } = useContext(UserContext);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
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
      </ScrollView>

      <View style={styles.fixedButtonContainer1}>
              <TouchableOpacity
                style={styles.fixedButton1}
              >
                <Text style={styles.fixedButtonText1}>여행플랜 바로 제작</Text>
              </TouchableOpacity>
            </View>
        <View style={styles.fixedButtonContainer2}>
            <TouchableOpacity
            style={styles.fixedButton2}
            >
            <Text style={styles.fixedButtonText2}>다음 정보 입력하기</Text>
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
    top:-108
  },
  calendarBox: {
    paddingHorizontal: 20,
    marginTop: 20,
    top:-110,
    marginTop:20
  },
  calendarLabel: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Roboto',
    lineHeight: 24,
    color: '#000',
    marginBottom: 10,
    top:-9
    ,
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
    top:-105
  },
  dateButtonText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: '#373737',
    fontWeight: '500',
  },
  fixedButtonContainer1: {  // 함께할 여행자 찾아보기 버튼
    position: 'absolute',
    bottom: 35,            // 하단탭과 겹치지 않게 조정
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  fixedButtonContainer2: {  // 함께할 여행자 찾아보기 버튼
    position: 'absolute',
    bottom: 35,            // 하단탭과 겹치지 않게 조정
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  fixedButton1: {
    width: 358,
    height: 58,
    backgroundColor: '#FFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    top: -50,
    borderWidth: 2,         
    borderColor: '#4F46E5', 
  },
  fixedButton2: {
    width: 358,
    height: 58,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    top: 20,
  },
  fixedButtonText1: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#4F46E5',
    fontWeight: '500',
    lineHeight: 22,
  },
  fixedButtonText2: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 22,
  },
});
