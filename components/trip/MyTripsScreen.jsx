import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HeaderBar from '../../components/common/HeaderBar';
import { MaterialIcons } from '@expo/vector-icons';

// ✅ D-Day 계산 함수
const calculateDday = (startDate) => {
  const today = new Date();
  const target = new Date(startDate);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
};

export default function MyTripsScreen() {
  const navigation = useNavigation();

  const [isEditing, setIsEditing] = useState(false);
  const [myTrips, setMyTrips] = useState([
    {
      title: '경주 여행',
      startDate: '2025-04-20',
      endDate: '2025-04-30',
    },
    {
      title: '청주 여행',
      startDate: '2025-05-10',
      endDate: '2025-05-15',
    },
    {
      title: '부산 여행',
      startDate: '2025-06-20',
      endDate: '2025-06-30',
    },
  ]);

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleDeleteTrip = (indexToDelete) => {
    setMyTrips((prevTrips) => prevTrips.filter((_, i) => i !== indexToDelete));
  };

  const onPressCreate = () => {
    navigation.navigate('Home', { screen: 'PlannerInfo' });
  };

  return (
    <View style={styles.screen}>
      <HeaderBar />

      {/* 여행 TIP */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipTitle}>
          오늘의 여행 <Text style={{ fontStyle: 'italic' }}>TIP</Text>
        </Text>
        <Text style={styles.tipText}>
          전통시장, 관광안내소에서 제공하는 스탬프 투어에 참여하면 지역 특산품 할인권 또는 기념품을 받을 수 있어요!
        </Text>
      </View>

      <View style={styles.listContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>내 여행 리스트</Text>
          <TouchableOpacity onPress={toggleEditMode}>
            <Text style={styles.editButton}>{isEditing ? '편집완료' : '삭제'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {myTrips.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>제작된 여행 플랜이 없어요</Text>
              <Text style={styles.emptySub}>나에게 맞춘 여행계획을 세워볼까요?</Text>
            </View>
          ) : (
            myTrips.map((trip, index) => (
              <View key={index} style={styles.tripRow}>
                <View style={styles.tripBox}>
                  <View style={styles.tripContent}>
                    <View>
                      <Text style={styles.tripTitle}>{trip.title}</Text>
                      <Text style={styles.tripDate}>
                        {trip.startDate.replace(/-/g, '.')} ~ {trip.endDate.replace(/-/g, '.')}
                      </Text>
                    </View>
                    <Text style={styles.dDayText}>{calculateDday(trip.startDate)}</Text>
                  </View>
                </View>

                {isEditing && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTrip(index)}
                  >
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}

          {/* 여행 플랜 만들기 버튼 */}
          <TouchableOpacity style={styles.createBtn} onPress={onPressCreate}>
            <View style={styles.plusCircle}>
              <MaterialIcons name="add" size={21} color="#FFFFFF" />
            </View>
            <Text style={styles.createText}>여행 플랜 만들러 가기</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tipContainer: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 10,
  },
  tipTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#111827',
    fontSize: 20,
    fontFamily: 'KaushanScript',
    textAlign: 'center',
  },
  tipText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 20,
    fontFamily: 'KaushanScript',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '400',
    color: '#1E1E1E',
  },
  editButton: {
    fontSize: 18,
    color: '#F97575',
    marginRight: 15
  },
  scrollContent: {
    paddingBottom: 40,
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#373737',
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 16,
    color: '#7E7E7E',
  },
  tripRow: {
  flexDirection: 'row',
  alignItems: 'stretch',
  marginBottom: 12,
  overflow: 'hidden', // 🔹 양쪽 radius를 자연스럽게 이어주기 위함
},

  tripBox: {
  flex: 1,
  backgroundColor: '#fff',
  paddingVertical: 28,
  paddingHorizontal: 20,
  borderWidth: 1,
  borderColor: '#8F80F3',
  borderRadius: 12,
},
  tripContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  tripDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dDayText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4F46E5',
  },
  deleteButton: {
  width: 60,
  backgroundColor: '#F97575',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 12,
},
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    fontStyle:'Roboto'
  },
  createBtn: {
    height: 48,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 36,
    marginTop: 20,
    marginBottom: 30,
  },
  plusCircle: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  createText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 12,
    color: '#000000',
    textAlign: 'center',
    flex: 1,
    paddingRight: 36,
  },
});
