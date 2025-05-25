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
import uuid from 'react-native-uuid';
//import { createSchedule } from '../../api/createSchedule';                                  //묵데이터
import { getCacheData } from '../../caching/cacheService'; // 경로는 실제 위치에 맞게 조정
import { CACHE_KEYS } from '../../caching/cacheService';
import { saveCacheData } from '../../caching/cacheService';
import { editSchedule } from '../../api/planner_edit_request';                               // 편집 api
import { regenerateSchedule } from '../../api/planner_regenerate_request';                   // 재생성 api

const { width } = Dimensions.get('window');

export default function PlannerResponseHome() {
  const navigation = useNavigation();
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [newlyAddedPlaceId, setNewlyAddedPlaceId] = useState(null);
  const [editedPlaces, setEditedPlaces] = useState({});

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => parent?.setOptions({ tabBarStyle: { display: 'flex' } });
  }, [navigation]);

  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cached = await getCacheData(CACHE_KEYS.PLAN_INITIAL);
         console.log('🟢 [PlannerResponseHome] 불러온 PLAN_INITIAL:', JSON.stringify(cached, null, 2));
        if (cached) {
          console.log('📦 캐싱된 PLAN_INITIAL 불러오기 성공');
          const dataWithIds = {
            ...cached,
            days: cached.days.map(day => ({
              ...day,
              places: day.places.map(place => ({
                ...place,
                id: place.id ?? uuid.v4(), // 🔑 ID가 없으면 생성
              }))
            }))
          };
          setScheduleData(dataWithIds); 
        } else {
          /*console.warn('⚠️ 캐싱된 데이터가 없습니다. ');                   //묵데이터 주석
          const response = await createSchedule(                          //
            '2025-05-15',                                                 //
            '2025-05-18',                                                 //
            ['경주'],                                                     //
            'INTJ',                                                       //
            ['NATURE'],                                                   //
            'DUO',                                                        //
            910000                                                        //
          );                                                              //
          setScheduleData(response);      */                                //
        }                                                                  
      } catch (err) {
        console.error('❌ 캐시 또는 일정 생성 실패:', err);
      } 
    };

    loadCachedData();
  }, []); 


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

  // 드래그 후 순서 바꾸는 함수
  const handleDragEnd = ({ data }) => {
    const updatedDays = scheduleData.days.map((day, idx) =>
      idx === selectedDayIndex ? { ...day, places: [...data] } : day
    );
    setScheduleData({ ...scheduleData, days: updatedDays });
  };

  // "장소추가" 버튼에서 index 기준으로 장소 추가 (불변성 및 최신값 사용)
  const handleAddPlace = (insertIndex) => {
    if (newlyAddedPlaceId) return;

    // 반드시 최신 places 사용!
    const currentPlaces = [...scheduleData.days[selectedDayIndex].places];

    const newPlaceId = uuid.v4();
    const newPlace = {
      id: newPlaceId,
      name: '',
      type: '카테고리',
      estimatedCost: 0,
      gptOriginalName: '예시태그',
      fromPrevious: {
        car: 5,
        publicTransport: 8,
        walk: 12,
      },
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

  // 삭제 함수도 최신값 사용!
  const handleDeletePlace = (placeId) => {
    const currentPlaces = [...scheduleData.days[selectedDayIndex].places];
    const updatedPlaces = currentPlaces.filter((p) => p.id !== placeId);
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

  // 이름 변경 적용도 최신값 사용!
  const handleEndEditing = (placeId) => {
    const currentPlaces = [...scheduleData.days[selectedDayIndex].places];
    const updatedPlaces = currentPlaces.map((p) =>
      p.id === placeId
        ? { ...p, name: editedPlaces[placeId] ?? p.name }
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>여행플랜</Text>
          <View style={{ width: 24 }} />
        </View>


         <View style={styles.tripInfo}>
    <View style={styles.tripInfoRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.tripTitle}>{scheduleData.title}</Text>
        <Text style={styles.dateText}>
          {scheduleData.startDate} ~ {scheduleData.endDate}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.totalBudgetLabel}>
          {selectedDay.day} 총 예산
        </Text>
        <Text style={styles.budget}>
          {selectedDay.totalEstimatedCost.toLocaleString()}
          <Text style={styles.budgetUnit}>원</Text>
        </Text>
      </View>
    </View>
  </View>
        {/* 탭 */}
        {isEditing ? (
  // 수정모드: 선택된 Day만 중앙에 보여줌
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
  // 일반 모드: 모든 Day를 가로 스크롤로 보여줌
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
              keyExtractor={(item) => String(item.id)}
              onDragEnd={handleDragEnd}
              extraData={[places, newlyAddedPlaceId, selectedDayIndex]}
              containerStyle={styles.container}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item: place, drag }) => {
                // ⭐️ index 대신 실제 데이터에서 위치를 찾는다!
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
  onPress={() => {}}
>
  {newlyAddedPlaceId === place.id ? (
    // 장소추가로 추가된 카드: 목적지만 입력받기 (1줄만)
    <TextInput
      style={styles.placeNameInput}
      value={editedPlaces[place.id] ?? ''}
      placeholder="장소명을 입력하세요"
      onChangeText={(text) =>
        setEditedPlaces((prev) => ({ ...prev, [place.id]: text }))
      }
      onEndEditing={() => handleEndEditing(place.id)}
      autoFocus
      underlineColorAndroid="transparent"
      placeholderTextColor="#C0C0C0"
    />
  ) : (
    // 기존 카드: 목적지, 카테고리, 태그 모두 표시
    <>
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
    </>
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
                      // index 대신 currentIndex로 위치 지정
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
  <View key={place.id}>
    {/* 모든 카드 위에 교통정보! */}
    {place.fromPrevious && (
      <View style={styles.transportRow}>
        <View style={styles.transportItem}>
          <Ionicons name="car-outline" size={22} color="#6B7280" />
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
    {/* 카드 내용 */}
    <View style={styles.placeRow}>
      <View style={styles.timeline}>
        <View style={[
          styles.dot,
          { backgroundColor: idx === 2 ? '#1270B0' : '#4F46E5' },
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
    {/* ⭐ 마지막 카드라면 교통정보를 아래에 한 번 더! */}
    {idx === places.length - 1 && place.fromPrevious && (
      <View style={styles.transportRow}>
        <View style={styles.transportItem}>
          <Ionicons name="car-outline" size={22} color="#6B7280" />
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

        {/* 하단 버튼 */}
        {isEditing ? (
  <View style={styles.fixedDoneButtonWrapper}>
    <TouchableOpacity
      style={styles.fixedDoneButton}
      onPress={async () => {
        setNewlyAddedPlaceId(null);
        setEditedPlaces({});
        try {
          await saveCacheData(CACHE_KEYS.PLAN_EDITED, scheduleData);
          console.log('💾 PLAN_EDITED 캐시 저장 완료');



          // ⭐️ editSchedule 호출                                                                       //진짜 편집 api 요청
          //const placeNames = scheduleData.days[selectedDayIndex].places.map(p => p.name);             //
          //const result = await editSchedule(placeNames);                                              //
          //console.log('✏️ 서버 일정 편집 응답:', result);                                             //

          // (필요시 아래처럼 응답을 화면에 적용)                                                         //
          // setScheduleData({                                                                          //
          //   ...scheduleData,                                                                         //
          //   days: scheduleData.days.map((day, idx) =>                                                //
          //     idx === selectedDayIndex                                                               //
          //       ? { ...day, places: result.places, totalEstimatedCost: result.totalEstimatedCost }   //
          //       : day                                                                                //
          //   )                                                                                        //
          // });                                                                                        //

        } catch (e) {
          console.warn('⚠️ PLAN_EDITED 캐시 저장 or API 호출 실패:', e);
        }
        // 저장 후, 확인용 캐시 데이터 읽기
      try {
          const cached = await getCacheData(CACHE_KEYS.PLAN_EDITED);
            console.log('📦 저장된 PLAN_EDITED 내용:', JSON.stringify(cached, null, 2));
          } catch (e) {
            console.warn('❌ PLAN_EDITED 캐시 확인 실패:', e);
          }
          setIsEditing(false);
        }}
    >
      <Text style={styles.fixedDoneButtonText}>수정 완료</Text>
    </TouchableOpacity>
  </View>
) : (
  <>
    <View style={styles.bottomButtonContainer}>
      <TouchableOpacity
        style={[styles.editButton, { marginRight: 2 }]}
        onPress={async () => {
          setIsEditing(true);
        }}
      >
        <Text style={styles.editButtonText}>플랜 수정</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.saveButton, { marginLeft: 8 }]}>
        <Text style={styles.saveButtonText}>내 여행으로 저장</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.regenerateButtonWrapper}>
  <TouchableOpacity
    style={styles.regenerateButton}
    onPress={async () => {
      
      try {
        const excludedNames = []; // 실제 제외할 장소명 배열                            // 여행 일정 재생성 api 부분

        const result = await regenerateSchedule({                                      //
          startDate: scheduleData.startDate,                                           //
          endDate: scheduleData.endDate,                                               //
          destination: destinationToSend,                                       //
          mbti: scheduleData.mbti,                                                     //
          travelStyle: scheduleData.travelStyle,                                       //
          peopleGroup: scheduleData.peopleGroup,                                       //
          budget: scheduleData.budget,                                                 //
          excludedNames,                                                               //
        });                                                                            //

        setScheduleData(result);                                                       //
        console.log('✅ 여행 플랜 재생성 성공:', result);                               //
      } catch (err) {                                                                  //
        console.error(                                                                 //
          '❌ 여행 플랜 재생성 실패:',                                                  //
          err.response?.data?.message || err.message                                   //
        );                                                                             //
      }                                                                         //
    }}                                                                                 //
  >                                                                                    //
    <Text style={styles.regenerateButtonText}>플랜 전체 재생성</Text>
  </TouchableOpacity>
</View>
  </>
)}
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
    marginBottom:-80,
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
    paddingTop:18,
  },
  transportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 35,
    top: 0,
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
    fontSize:16,
    color: '#4F46E5',
  },
  saveButton: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
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
  backgroundColor: '#fff',
  borderRadius: 10,
  paddingVertical: 12,
  alignItems: 'center',
  borderWidth: 1,
    borderColor: '#4F46E5',
},

regenerateButtonText: {
  color: '#4F46E5',
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
