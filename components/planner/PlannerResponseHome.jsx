import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
//import { createSchedule } from '../../api/createSchedule';
import { getCacheData } from '../../caching/cacheService'; // 경로는 실제 위치에 맞게 조정
import { CACHE_KEYS } from '../../caching/cacheService';
import { saveCacheData } from '../../caching/cacheService';
import { editSchedule } from '../../api/planner_edit_request';
import { regenerateSchedule } from '../../api/planner_regenerate_request';
import { saveSchedule } from '../../api/planner_save_request';
import { deleteSchedule } from '../../api/planner_delete_request';
import { getScheduleDetail } from '../../api/MyPlanner_detail';
import { useRoute } from '@react-navigation/native';
import uuid from 'react-native-uuid';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '../../components/common/SplashScreen';
import { Modal } from 'react-native';

const { width } = Dimensions.get('window');

const saveTripToList = async (tripData) => {
  try {
    const existing = await AsyncStorage.getItem('MY_TRIPS');
    let trips = [];
    if (existing) trips = JSON.parse(existing);

    // 이미 같은 title/startDate인 플랜이 있으면 덮어쓰기, 없으면 추가
    const idx = trips.findIndex(
      t => t.title === tripData.title && t.startDate === tripData.startDate
    );
    if (idx !== -1) trips[idx] = tripData;
    else trips.push(tripData);

    await AsyncStorage.setItem('MY_TRIPS', JSON.stringify(trips));
  } catch (e) {
    console.warn('저장 실패:', e);
  }
};

export default function PlannerResponseHome() {
  const navigation = useNavigation();
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [newlyAddedPlaceId, setNewlyAddedPlaceId] = useState(null);
  const [editedPlaces, setEditedPlaces] = useState({});
  const [editedPlaceId, setEditedPlaceId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const route = useRoute();
  const isReadOnly = route.params?.mode === 'read';
  const [isRegenerating, setIsRegenerating] = useState(false);

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => parent?.setOptions({ tabBarStyle: { display: 'flex' } });
  }, [navigation]);

  const ensurePlaceIds = (data) => ({
  ...data,
  days: data.days.map(day => ({
    ...day,
    places: day.places.map(place => ({
      ...place,
      id: place.id ? String(place.id) : uuid.v4(),
    })),
  })),
});

useEffect(() => {
  const loadCachedData = async () => {
    try {
      const cached = await getCacheData(CACHE_KEYS.PLAN_INITIAL);
      if (cached) setScheduleData(ensurePlaceIds(cached));
    } catch (err) {
      console.error('❌ 캐시 또는 일정 생성 실패:', err);
    }
  };
  loadCachedData();
}, []);

useEffect(() => {
  const fetchDetail = async () => {
    if (route.params?.scheduleId) {
      try {
        const detail = await getScheduleDetail(route.params.scheduleId);
        setScheduleData(ensurePlaceIds(detail));
      } catch (e) {
        navigation.goBack();
      }
    }
  };
  fetchDetail();
}, [route.params?.scheduleId]);

  if (!scheduleData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <Text style={styles.loadingText}>⏳ 데이터를 불러오는 중입니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedDay = scheduleData.days[selectedDayIndex];
  const places = scheduleData.days[selectedDayIndex].places;

  const handleDragEnd = ({ data }) => {
    const updatedDays = scheduleData.days.map((day, idx) =>
      idx === selectedDayIndex ? { ...day, places: [...data] } : day
    );
    setScheduleData({ ...scheduleData, days: updatedDays });
  };

  const handleAddPlace = (insertIndex) => {
    if (newlyAddedPlaceId) return;
    const currentPlaces = [...scheduleData.days[selectedDayIndex].places];
    const newPlaceId = uuid.v4();
    const newPlace = {
      id: newPlaceId,
      name: '',
      type: '카테고리',
      estimatedCost: 0,
      gptOriginalName: '예시태그',
      fromPrevious: { car: 5, publicTransport: 8, walk: 12 },
    };
    const updatedPlaces = [
      ...currentPlaces.slice(0, insertIndex + 1),
      newPlace,
      ...currentPlaces.slice(insertIndex + 1),
    ];
    const updatedDays = scheduleData.days.map((day, i) =>
      i === selectedDayIndex ? { ...day, places: updatedPlaces } : day
    );
    setScheduleData({ ...scheduleData, days: updatedDays });
    setNewlyAddedPlaceId(newPlaceId);
  };

  const handleDeletePlace = (placeId) => {
  // 🔽 여기에 추가!
  const currentPlaces = [...scheduleData.days[selectedDayIndex].places];
  console.log('삭제 전:', currentPlaces.map(p => `${p.id}:${p.name}`));

  const updatedPlaces = currentPlaces.filter((p) => p.id !== placeId);
  console.log('삭제 후:', updatedPlaces.map(p => `${p.id}:${p.name}`));

  const updatedDays = scheduleData.days.map((day, i) =>
    i === selectedDayIndex ? { ...day, places: updatedPlaces } : day
  );
  setScheduleData({ ...scheduleData, days: updatedDays });

  if (newlyAddedPlaceId === placeId) setNewlyAddedPlaceId(null);
  setEditedPlaces((prev) => {
    const updated = { ...prev };
    delete updated[placeId];
    return updated;
  });
};

  const handleEndEditing = (placeId) => {
    const currentPlaces = [...scheduleData.days[selectedDayIndex].places];
    const newName = editedPlaces[placeId] ?? '';
    const updatedPlaces = currentPlaces.map((p) =>
      p.id === placeId
        ? {
            ...p,
            name: newName,
            type: (!newName || newName !== p.name) ? '' : p.type,
            gptOriginalName: (!newName || newName !== p.name) ? '' : p.gptOriginalName,
            estimatedCost: (!newName || newName !== p.name) ? '' : p.estimatedCost,
          }
        : p
    );
    const updatedDays = scheduleData.days.map((day, i) =>
      i === selectedDayIndex ? { ...day, places: updatedPlaces } : day
    );
    setScheduleData({ ...scheduleData, days: updatedDays });
    setNewlyAddedPlaceId(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={styles.headerLine}>
          <TouchableOpacity
            onPress={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>여행플랜</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 여행 정보 */}
        <View style={styles.tripInfo}>
          <View style={styles.tripInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tripTitle}>{scheduleData.title}</Text>
              <Text style={styles.dateText}>
                {scheduleData.startDate} ~ {scheduleData.endDate}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalBudgetLabel}>{selectedDay.day} 총 예산</Text>
              <Text style={styles.budget}>
                {selectedDay.totalEstimatedCost?.toLocaleString()}
                <Text style={styles.budgetUnit}>원</Text>
              </Text>
            </View>
          </View>
        </View>
        {/* 탭 */}
        {isEditing ? (
          <View style={{
            alignItems: 'center',
            backgroundColor: '#FAFAFA',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: '#E5E7EB',
          }}>
            <View style={styles.tabBox}>
              <Text style={[styles.tabText, styles.tabTextSelected]}>
                Day - {selectedDayIndex + 1}
              </Text>
              <View style={styles.activeBar} />
            </View>
          </View>
        ) : (
          <View style={styles.tabScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabContainer}
            >
              {scheduleData.days.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => !isEditing && setSelectedDayIndex(idx)}
                  disabled={isEditing}
                >
                  <View style={styles.tabBox}>
                    <Text
                      style={[
                        styles.tabText,
                        selectedDayIndex === idx && styles.tabTextSelected,
                        isEditing && selectedDayIndex !== idx && { opacity: 0.3 },
                      ]}
                    >
                      Day - {idx + 1}
                    </Text>
                    {selectedDayIndex === idx && (
                      <>
                        <View style={styles.activeBar} />
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 본문 */}
        <View style={{ flex: 1 }}>
          {isEditing ? (
            <DraggableFlatList
              data={places}
              keyExtractor={(item, idx) => item.id ? String(item.id) : `temp-${idx}`}
              onDragEnd={handleDragEnd}
              extraData={[places, newlyAddedPlaceId, selectedDayIndex]}
              containerStyle={styles.container}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item: place, drag }) => {
                const currentIndex = places.findIndex((p) => p.id === place.id);
                return (
                  <View key={place.id}>
                    <View style={styles.placeRow}>
                      <View style={styles.timeline} />
                      <View style={styles.placeContent}>
                        {/* 드래그 아이콘 */}
                        <TouchableOpacity
                          style={styles.dragHandle}
                          onLongPress={drag}
                          delayLongPress={100}
                        >
                          <Ionicons name="reorder-two-outline" size={30} color={place.type === '식사' ? '#1270B0' : '#4F46E5'} />
                        </TouchableOpacity>
                        {/* 삭제 버튼 */}
                        <TouchableOpacity
                          style={{
                            position: 'absolute',
                            top: 25,
                            right: 0,
                            backgroundColor: '#F87171',
                            borderRadius: 20,
                            padding: 4,
                            zIndex: 10,
                          }}
                          onPress={() => handleDeletePlace(place.id)}
                        >
                          <Ionicons name="remove" size={22} color="#fff" />
                        </TouchableOpacity>
                        {/* placeCard */}
                        <TouchableOpacity
                          style={[styles.placeCard3, { marginLeft: 24 }]}
                          disabled={newlyAddedPlaceId === place.id}
                          onPress={() => {
                            if (isEditing && !newlyAddedPlaceId && editedPlaceId !== place.id) {
                              setEditedPlaceId(place.id);
                              setEditedPlaces((prev) => ({ ...prev, [place.id]: place.name }));
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          {(newlyAddedPlaceId === place.id || editedPlaceId === place.id) ? (
                            <TextInput
                              style={styles.placeNameInput}
                              value={editedPlaces[place.id] ?? ''}
                              placeholder="장소명을 입력하세요"
                              onChangeText={(text) =>
                                setEditedPlaces((prev) => ({ ...prev, [place.id]: text }))
                              }
                              onEndEditing={() => {
                                handleEndEditing(place.id);
                                setEditedPlaceId(null);
                              }}
                              autoFocus
                              underlineColorAndroid="transparent"
                              placeholderTextColor="#C0C0C0"
                            />
                          ) : (
                            <View style={{ minHeight: 60, justifyContent: 'center' }}>
                              <View style={styles.placeHeader}>
                                <Text style={styles.placeName}>{place.name}</Text>
                                {(place.name && place.estimatedCost !== '' && place.estimatedCost !== undefined && place.estimatedCost !== null) && (
                                  <Text style={styles.placeCost}>
                                    {place.estimatedCost?.toLocaleString()}원
                                  </Text>
                                )}
                              </View>
                              {place.name && place.type && (
                                <Text style={styles.placeType}>{place.type}</Text>
                              )}
                              {place.name && place.gptOriginalName && (
                                <Text style={styles.keywords}>#{place.gptOriginalName}</Text>
                              )}
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* 카드 아래에 추가 버튼 */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#A19CFF',
                        paddingVertical: 8,
                        borderRadius: 16,
                        marginTop: 16,
                        marginBottom: 14,
                        alignSelf: 'flex-start',
                        width: '50%',
                        marginLeft: 90,
                        opacity: newlyAddedPlaceId ? 0.5 : 1,
                      }}
                      disabled={!!newlyAddedPlaceId}
                      onPress={() => handleAddPlace(currentIndex)}
                    >
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: 18,
                          fontWeight: 'bold',
                          textAlign: 'center',
                          lineHeight: 20,
                        }}
                      >
                        장소추가
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          ) : (
            <ScrollView
              style={styles.container}
              contentContainerStyle={{ paddingBottom: 120 }}
            >
              {places.map((place, idx) => (
                <View key={place.id ? String(place.id) : `temp-${idx}`}>
                  {/* 교통정보 (맨 위 카드 제외) */}
                  {idx !== 0 && place.fromPrevious && (
                    <View style={styles.transportRow}>
                      <View style={styles.transportItem}>
                        <Ionicons name="car-outline" size={22} color="#6B7280" style={{ marginLeft: 15 }} />
                        <Text style={styles.transportText}>{place.fromPrevious.car}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <Ionicons name="bus-outline" size={22} color="#6B7280" />
                        <Text style={styles.transportText}>{place.fromPrevious.publicTransport}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <MaterialCommunityIcons name="walk" size={22} color="#6B7280" />
                        <Text style={styles.transportText}>{place.fromPrevious.walk}분</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.placeRow}>
                    <View style={styles.timeline}>
                      <View style={[
                        styles.dot,
                        { backgroundColor: place.type === '식사' ? '#1270B0' : '#4F46E5' },
                      ]} />
                      {idx !== places.length - 1 && <View style={styles.verticalLine} />}
                    </View>
                    <View style={styles.placeContent}>
                      <TouchableOpacity
                        style={styles.placeCard}
                        onPress={() => navigation.navigate('PlaceDetail', { place })}
                      >
                        <View style={styles.placeHeader}>
                          <Text style={styles.placeName}>{place.name}</Text>
                          <Text style={styles.placeCost}>
                            {place.estimatedCost?.toLocaleString()}원
                          </Text>
                        </View>
                        <Text style={styles.placeType}>{place.type}</Text>
                        {place.gptOriginalName && (
                          <Text style={styles.keywords}>#{place.gptOriginalName}</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* 마지막 카드라면 교통정보를 아래 한 번 더 (마지막 day 제외) */}
                  {idx === places.length - 1 && place.fromPrevious && selectedDayIndex !== scheduleData.days.length - 1 && (
                    <View style={styles.transportRow}>
                      <View style={styles.transportItem}>
                        <Ionicons name="car-outline" size={22} color="#6B7280" style={{ marginLeft: 15 }} />
                        <Text style={styles.transportText}>{place.fromPrevious.car}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <Ionicons name="bus-outline" size={22} color="#6B7280" />
                        <Text style={styles.transportText}>{place.fromPrevious.publicTransport}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <MaterialCommunityIcons name="walk" size={22} color="#6B7280" />
                        <Text style={styles.transportText}>{place.fromPrevious.walk}분</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 하단 버튼, 아래 한 번만! */}
        {isEditing ? (
          <View style={styles.fixedDoneButtonWrapper}>
            <TouchableOpacity
              style={styles.fixedDoneButton}
              onPress={async () => {
                setNewlyAddedPlaceId(null);
                setEditedPlaces({});
                try {
                  await saveCacheData(CACHE_KEYS.PLAN_EDITED, scheduleData);
                  const placeNames = scheduleData.days[selectedDayIndex].places.map(p => p.name);
                  const result = await editSchedule(placeNames);
                  if (result.places && result.totalEstimatedCost !== undefined) {
                    setScheduleData({
                      ...scheduleData,
                      days: scheduleData.days.map((day, idx) =>
                        idx === selectedDayIndex
                          ? { ...day, places: result.places, totalEstimatedCost: result.totalEstimatedCost }
                          : day
                      )
                    });
                  } else if (Array.isArray(result)) {
                    setScheduleData({
                      ...scheduleData,
                      days: scheduleData.days.map((day, idx) =>
                        idx === selectedDayIndex
                          ? { ...day, places: result }
                          : day
                      )
                    });
                  }
                } catch (e) {
                  console.warn('⚠️ PLAN_EDITED 캐시 저장 or API 호출 실패:', e);
                }
                setIsEditing(false);
              }}
            >
              <Text style={styles.fixedDoneButtonText}>수정 완료</Text>
            </TouchableOpacity>
          </View>
        ) : (isReadOnly || isSaved) ? (         
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
  style={[
    styles.editButton,
    { flex: 1, marginRight: 8, backgroundColor: '#F87171', borderColor: '#F87171' }
  ]}
   onPress={() => {
    Alert.alert(
      '플랜 삭제',
      '정말로 이 여행 플랜을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              
              const scheduleId = scheduleData.id; // ← 실제 id값!
              await deleteSchedule(scheduleId);
              Alert.alert('삭제 완료', '플랜이 삭제되었습니다!');
              navigation.goBack(); // 또는 초기화 등 원하는 동작
            } catch (e) {
              Alert.alert('삭제 실패', '플랜 삭제에 실패했습니다.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }}
>
  <Text style={[styles.editButtonText, { color: '#fff' }]}>플랜 삭제</Text>
</TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, { flex: 1, backgroundColor: '#4F46E5', borderColor: '#4F46E5' }]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={[styles.editButtonText, { color: '#fff' }]}>플랜 수정</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity
                style={[styles.editButton, { marginRight: 2 }]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editButtonText}>플랜 수정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { marginLeft: 8 }]}
                onPress={async () => {
                  setIsRegenerating(true);
                  try {
                    const excludedNames = [];
                    const destinationToSend = scheduleData.destination || "NONE";
                    const mbtiToSend = scheduleData.mbti || "NONE";
                    const travelStyleToSend = scheduleData.travelStyle || "NONE";
                    const peopleGroupToSend = scheduleData.peopleGroup || "NONE";
                    const budgetToSend = scheduleData.budget ?? 0;


                    const requestData = {
      startDate: scheduleData.startDate,
      endDate: scheduleData.endDate,
      destination: destinationToSend,
      mbti: mbtiToSend,
      travelStyle: travelStyleToSend,
      peopleGroup: peopleGroupToSend,
      budget: budgetToSend,
      excludedNames,
    };

    // [2] 요청 데이터 로그
    console.log('📤 일정 재생성 요청:', JSON.stringify(requestData, null, 2));

    // [3] 재생성 요청 및 응답 로그
    const result = await regenerateSchedule(requestData);

    // [2] result가 성공적으로 왔으면 화면 갱신
    if (result && result.days) {
          setScheduleData(prev => ({
            ...prev,
            days: result.days,
            startDate: result.startDate,
            endDate: result.endDate,
            title: result.title || prev.title,
          }));
        } else {
          Alert.alert('재생성 실패', '서버에서 정상 데이터가 오지 않았습니다.');
        }
      } catch (err) {
        Alert.alert('오류', '재생성 중 오류가 발생했습니다.');
      } finally {
        setIsRegenerating(false); // 3. 모든 처리 후, 로딩 끄기
      }
    }}
  >
                <Text style={styles.saveButtonText}>플랜 전체 재조회</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.regenerateButtonWrapper}>
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={async () => {
                  try {
                    const saveRequest = {
                      title: scheduleData.title,
                      startDate: scheduleData.startDate,
                      endDate: scheduleData.endDate,
                      days: scheduleData.days.map(day => ({
                        places: day.places.map(place => ({
                          name: place.name,
                          type: place.type,
                          address: place.address,
                          lat: place.lat,
                          lng: place.lng,
                          description: place.description,
                          estimatedCost: place.estimatedCost,
                          gptOriginalName: place.gptOriginalName,
                          fromPrevious: place.fromPrevious,
                          placeOrder: place.placeOrder,
                        })),
                      })),
                    };

                     // 1) 서버에 저장 요청
        const response = await saveSchedule(saveRequest);
        const savedScheduleId = response.id || response.scheduleId; // 실제 응답 구조에 따라 다름

        // 2) 캐시도 필요하다면 추가 (optional)
        await saveCacheData(CACHE_KEYS.PLAN_SAVE_READY, scheduleData);

        // 3) id 포함해서 내 여행에 저장!
        await saveTripToList({
          ...saveRequest,
          id: savedScheduleId, // 반드시 id 포함!
        });
                    Alert.alert(
                      '여행 플랜 저장',
                      '여행 플랜이 "내여행"으로 저장되었습니다.',
                      [
                        {
                          text: 'OK',
                          onPress: () => setIsSaved(true),
                        },
                      ]
                    );
                  } catch (e) {
                    alert('저장에 실패했습니다. 다시 시도해 주세요.');
                  }
                }}
              >
                <Text style={styles.regenerateButtonText}>내 여행으로 저장</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <Modal visible={isRegenerating} transparent animationType="fade">
  <SplashScreen />
</Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#Fafafa' },
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingText: { marginTop: 100, textAlign: 'center', fontSize: 16 },
  headerLine: {
    height: 48,
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    backgroundColor: '#FAFAFA',
  },
  headerTitle: { fontSize: 18, color: '#000' },
  tripInfo: { backgroundColor: '#FAFAFA', padding: 16, paddingBottom: 4 },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tripTitle: { fontSize: 24, color: '#1E1E1E' },
  totalBudgetLabel: { fontSize: 18, color: '#1E1E1E', top: -2 },
  budget: { color: '#4F46E5', fontSize: 18, marginTop: 4 },
  budgetUnit: { color: '#4F46E5', fontSize: 14 },
  dateText: { fontSize: 20, color: '#7E7E7E', marginTop: 4, marginBottom: 0 },
  tabScrollWrapper: {
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 6 },
  tabBox: { alignItems: 'center', marginHorizontal: 6, paddingHorizontal: 10 },
  tabText: { fontSize: 20, color: '#9CA3AF' },
  tabTextSelected: { color: '#4F46E5', fontWeight: 'bold' },
  activeBar: {
    marginTop: 5,
    height: 4,
    width: 80,
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  container: {
    paddingHorizontal: 16,
    marginBottom: -80,
    marginTop: 20,
    backgroundColor: '#FAFAFA',
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: -20,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  timeline: {
    width: 30,
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    position: 'absolute',
    top: 40,
    zIndex: 2,
  },
  verticalLine: {
    position: 'absolute',
    top: -20,
    left: 13,
    width: 4,
    height: 330,
    backgroundColor: '#A19CFF',
  },
  placeContent: { flex: 1, marginLeft: 10 },
  placeCard: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 10,
    borderRadius: 20,
    marginBottom: -25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  placeCard2: {
    backgroundColor: '#fff',
    padding: 16,
    paddingRight: 5,
    paddingLeft: 12,
    paddingBottom: 6,
    borderRadius: 20,
    marginBottom: -35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: '85%',
    left: -20,
  },
  placeCard3: {
    backgroundColor: '#fff',
    padding: 16,
    paddingRight: 5,
    paddingLeft: 12,
    paddingBottom: 6,
    borderRadius: 20,
    marginBottom: -35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: '85%',
    left: -20,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  placeName: { fontSize: 18, marginBottom: 4, color: '#373737' },
  placeCost: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'Inter',
    color: '#8B76E8',
    bottom: -15,
  },
  placeType: { fontSize: 14, color: '#9CA3AF', marginBottom: 4 },
  keywords: { fontSize: 13, color: '#333333', marginBottom: 6 },
  transportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  placeNameInput: {
    fontSize: 18,
    marginBottom: 19,
    color: '#373737',
    paddingVertical: 4,
    paddingTop: 18,
  },
  transportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  transportText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#000',
  },
  dragHandle: {
    position: 'absolute',
    left: -45,
    top: 25,
    padding: 4,
    zIndex: 5,
  },
  editButton: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4F46E5',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 16,
    color: '#4F46E5',
  },
  saveButton: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4F46E5',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#4F46E5',
    fontSize: 16,
  },
  regenerateButtonWrapper: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: '#fafafa',
    paddingVertical: 5,
    borderRadius: 12,
  },
  regenerateButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  fixedDoneButtonWrapper: {
    position: 'absolute',
    bottom: 5,
    left: 20,
    right: 20,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  fixedDoneButton: {
    width: '100%',
    alignItems: 'center',
  },
  fixedDoneButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});
