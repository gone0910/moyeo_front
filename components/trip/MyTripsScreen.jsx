import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HeaderBar from '../../components/common/HeaderBar';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { fetchPlanList } from '../../api/MyPlanner_fetch_list';
import { deleteSchedule } from '../../api/planner_delete_request';

// ==== 반응형 유틸 함수 ====
// 기준: iPhone 13 (390 x 844)
const BASE_WIDTH = 390;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
function normalize(size) {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
}

const calculateDday = (startDate) => {
  const today = new Date();
  const target = new Date(startDate);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
};

export default function MyTripsScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const [isEditing, setIsEditing] = useState(false);
  const [myTrips, setMyTrips] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const loadTrips = async () => {
        const serverTrips = await fetchPlanList();
        setMyTrips(serverTrips);
        await AsyncStorage.setItem('MY_TRIPS', JSON.stringify(serverTrips));
      };
      loadTrips();
    }, [])
  );

  const containerWidth = Math.min(width * 0.99, normalize(600)); // normalize 추가

  const toggleEditMode = () => setIsEditing(!isEditing);

  const handleDeleteTrip = (index) => {
    Alert.alert(
      '여행 리스트 삭제',
      '여행리스트가 삭제됩니다',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const scheduleId = myTrips[index].id;
              await deleteSchedule(scheduleId);
              setMyTrips((prev) => {
                const updated = prev.filter((_, i) => i !== index);
                AsyncStorage.setItem('MY_TRIPS', JSON.stringify(updated));
                return updated;
              });
            } catch (err) {}
          },
        },
      ],
      { cancelable: true }
    );
  };

  const onPressCreate = () =>
    navigation.navigate('Home', { screen: 'PlannerInfo' });

  return (
    <View style={styles.screen}>
      <HeaderBar />
      <View
        style={[
          styles.tipContainer,
          { alignSelf: 'center', width: containerWidth },
        ]}
      >
        <Text style={styles.tipTitle}>
          오늘의 여행 <Text style={{ fontStyle: 'italic' }}>TIP</Text>
        </Text>
        <Text style={styles.tipText}>
          전통시장, 관광안내소에서 제공하는 스탬프 투어에 참여하면 지역 특산품 할인권 또는 기념품을 받을 수 있어요!
        </Text>
      </View>

      <View
        style={[
          styles.listContainer,
          { alignSelf: 'center', width: containerWidth },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>내 여행 리스트</Text>
          {myTrips.length > 0 && (
            <TouchableOpacity onPress={toggleEditMode}>
              <Text style={styles.editButton}>
                {isEditing ? '편집완료' : '삭제'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { alignItems: 'center' },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {myTrips.length === 0 ? (
            <View style={styles.tripRow}>
              <View
                style={[
                  styles.tripBox,
                  { width: containerWidth, alignItems: 'center' },
                ]}
              >
                <View
                  style={[
                    styles.tripContent,
                    { flexDirection: 'column', alignItems: 'center' },
                  ]}
                >
                  <Text style={styles.tripTitle}>
                    제작된 여행 플랜이 없어요
                  </Text>
                  <Text style={[styles.tripDate, { marginTop: normalize(8) }]}>
                    나에게 맞춘 여행계획을 세워볼까요?
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            myTrips.map((trip, index) => (
              <View key={index} style={[styles.tripRow, isEditing && { overflow: 'visible' }]}>
                <TouchableOpacity
                  style={[
                    styles.tripBox,
                    isEditing && {
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      marginRight: 0,
                      borderRightWidth: 0,
                    },
                  ]}
                  activeOpacity={0.8}
                  disabled={isEditing} // 편집 모드에서는 이동 안 되게
                  onPress={() => {
                    navigation.navigate('Home', {
                      screen: 'PlannerResponse',
                      params: { scheduleId: trip.id, mode: 'read' }
                    });
                  }}
                >
                  <View style={styles.tripContent}>
                    <View>
                      <Text style={styles.tripTitle}>{trip.title}</Text>
                      <Text style={styles.tripDate}>
                        {trip.startDate.replace(/-/g, '.')} ~ {trip.endDate.replace(/-/g, '.')}
                      </Text>
                    </View>
                    <Text style={styles.dDayText}>
                      {trip.dDay ?? calculateDday(trip.startDate)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.deleteButtonPill}
                    onPress={() => handleDeleteTrip(index)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}

          {/* ✅ 2단 wrapper 구조로 둥근 굴곡 + 그림자 구현 */}
          <View
            style={{
              width: containerWidth - normalize(45),
              borderRadius: normalize(16),
              backgroundColor: 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: normalize(10),
              elevation: 2,
              marginTop: normalize(20),
              marginBottom: normalize(30),
              alignSelf: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: normalize(16),
                overflow: 'hidden',
                width: '100%',
              }}
            >
              <TouchableOpacity
                style={{
                  height: normalize(48),
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: normalize(36),
                  backgroundColor: '#fff',
                  borderRadius: normalize(16),
                  width: '100%',
                  marginHorizontal: 0,
                }}
                activeOpacity={0.8}
                onPress={onPressCreate}
              >
                <View
                  style={{
                    width: normalize(36),
                    height: normalize(36),
                    borderRadius: normalize(16),
                    backgroundColor: '#4F46E5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: normalize(12),
                  }}
                >
                  <MaterialIcons name="add" size={normalize(21)} color="#FFFFFF" />
                </View>
                <Text
                  style={{
                    fontFamily: 'Roboto',
                    fontWeight: '400',
                    fontSize: normalize(16),
                    color: '#000000',
                    textAlign: 'center',
                    flex: 1,
                    paddingRight: normalize(36),
                  }}
                >
                  여행 플랜 만들러 가기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ==== 기존 스타일 그대로, 단 값만 모두 normalize로 변경 ====
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  tipContainer: {
    backgroundColor: '#FFF2E5',
    alignSelf: 'center',
    width: '90%',
    maxWidth: normalize(370),
    marginTop: normalize(18),
    paddingVertical: normalize(28),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(18),
  },
  tipTitle: {
    fontWeight: 'bold',
    marginBottom: normalize(6),
    color: '#1E1E1E',
    fontSize: normalize(20),
    fontFamily: 'KaushanScript',
    textAlign: 'center',
  },
  tipText: {
    fontSize: normalize(16),
    color: '#616161',
    lineHeight: normalize(20),
    fontFamily: 'KaushanScript',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: normalize(20),
    marginTop: normalize(24),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(16),
  },
  sectionTitle: {
    fontSize: normalize(24),
    fontWeight: '400',
    color: '#1E1E1E',
  },
  editButton: {
    fontSize: normalize(18),
    color: '#F97575',
    marginRight: normalize(15),
  },
  scrollContent: {
    paddingBottom: normalize(40),
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: normalize(12),
    overflow: 'visible',
  },
  tripBox: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: normalize(28),
    paddingHorizontal: normalize(20),
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: normalize(20),
    marginBottom: normalize(10),
  },
  tripContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripTitle: {
    fontSize: normalize(16),
    fontWeight: '400',
    color: '#373737',
    marginBottom: normalize(8),
  },
  tripDate: {
    fontSize: normalize(14),
    color: '#7E7E7E',
    marginTop: normalize(4),
  },
  dDayText: {
    fontSize: normalize(26),
    fontWeight: '700',
    color: '#4F46E5',
  },
  deleteButtonPill: {
    width: normalize(68),
    backgroundColor: '#F97575',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: normalize(20),
    borderBottomRightRadius: normalize(20),
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderLeftWidth: 0,
    marginBottom: normalize(10),
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '400',
    fontStyle: 'Roboto',
  },
  createBtn: {
    height: normalize(48),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(36),
  },
  plusCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(20),
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(12),
  },
  createText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: normalize(12),
    color: '#000000',
    textAlign: 'center',
    flex: 1,
    paddingRight: normalize(36),
  },
});
