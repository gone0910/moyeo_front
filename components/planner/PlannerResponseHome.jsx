import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { getCacheData } from '../../caching/cacheService';
import { CACHE_KEYS } from '../../caching/cacheService';
import { saveCacheData } from '../../caching/cacheService';
import { editSchedule } from '../../api/planner_edit_request';
import { regenerateSchedule } from '../../api/planner_regenerate_request';
import { saveSchedule } from '../../api/planner_save_request';
import { deleteSchedule } from '../../api/planner_delete_request';
import { getScheduleDetail } from '../../api/MyPlanner_detail';
import { useRoute } from '@react-navigation/native';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '../../components/common/SplashScreen';
import { Modal } from 'react-native';
import { useLayoutEffect } from 'react';
import { Alert, InteractionManager, KeyboardAvoidingView, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
}

const saveTripToList = async (tripData) => {
  try {
    const existing = await AsyncStorage.getItem('MY_TRIPS');
    let trips = [];
    if (existing) trips = JSON.parse(existing);
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

//묵데이터

const MOCK_SCHEDULE = {
  title: '🧪 목데이터 플랜',
  startDate: '2025-07-01',
  endDate: '2025-07-03',
  days: [
    {
      places: [
        {
          id: uuid.v4(),
          name: '목 장소 1',
          type: '관광',
          estimatedCost: 0,
          gptOriginalName: 'mock-tag',
          fromPrevious: { car: 0, publicTransport: 0, walk: 0 },
        },
        {
          id: uuid.v4(),
          name: '목 장소 2',
          type: '식사',
          estimatedCost: 10000,
          gptOriginalName: 'mock-food',
          fromPrevious: { car: 5, publicTransport: 8, walk: 12 },
        },
      ],
    },
  ],
};

//여기까지
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
  const { from = 'Home', mode = 'read' } = route.params || {};
  const isReadOnly = mode === 'read';
  const showEditDeleteButtons = from === 'Home' || isReadOnly || isSaved;
  const [isRegenerating, setIsRegenerating] = useState(false);
  const scrollRef = useRef();        
  const listRef = useRef(null);      
  const [newlyAddedIndex, setNewlyAddedIndex] = useState(-1); 
  const [originalScheduleData, setOriginalScheduleData] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const inputRefs = useRef({});
  const placeRefs = useRef({});
  
  useLayoutEffect(() => {
    const parent = navigation.getParent(); // BottomTabNavigator
    parent?.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      parent?.setOptions({
        tabBarStyle: {
          display: 'flex',
          height: 70,
          paddingBottom: 6,
          paddingTop: 6,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
      });
    };
  }, [navigation]);

  
  useEffect(() => {
    if (!isEditing && scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [selectedDayIndex, isEditing]);

  useEffect(() => {
    if (route.params?.mode === 'edit') {
      setOriginalScheduleData(null); // 기존 원본 필요 없으면 null로
      setEditDraft(null); // 불필요한 초기화
      setIsEditing(true); // ✅ 자동 수정 모드 진입
    }
  }, [route.params?.mode]);

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
 //묵데이터

  useEffect(() => {
    const loadData = async () => {
      if (route.params?.mock && route.params?.data) {
        console.log('🧪 목데이터 사용');
        setScheduleData(ensurePlaceIds(route.params.data));
        return;
      }

      // 아래 API 호출 생략하고 mock 강제 삽입
      setScheduleData(ensurePlaceIds(MOCK_SCHEDULE));
    };
    loadData();
  }, []); 

//여기까지

// api 사용
/*
  useEffect(() => {
    const loadData = async () => {
      try {
        const cached = await getCacheData(CACHE_KEYS.PLAN_INITIAL);
        if (cached) setScheduleData(ensurePlaceIds(cached));
      } catch (err) {
        console.error('❌ 캐시 또는 일정 생성 실패:', err);
      }
    };
    loadData();
  }, []); 
*/
//여기까지
 useEffect(() => {
   // 편집 중이고, 유효한 index/ID가 있고, 리스트 ref가 있을 때만
   if (!isEditing || newlyAddedIndex < 0 || !newlyAddedPlaceId || !listRef.current) return;

   // 레이아웃/애니메이션 끝난 뒤 실행 → 화면 튐 방지
   InteractionManager.runAfterInteractions(() => {
     // 약간의 딜레이를 두면 index 계산 안정적
     setTimeout(() => {
       let scrolled = false;
       try {
         // 1) FlatList API 우선 시도
         listRef.current.scrollToIndex?.({
           index: newlyAddedIndex,
           viewPosition: 0.4,  // 화면 중앙 근처
           animated: true,
         });
         scrolled = true;
       } catch (e) {
         // 2) 폴백: measure → scrollToOffset
         const target = placeRefs.current[newlyAddedPlaceId];
         target?.measure?.((x, y, w, h, pageX, pageY) => {
           listRef.current.scrollToOffset?.({
             offset: Math.max((pageY ?? 0) - 120, 0),
             animated: true,
           });
         });
       }

       // 스크롤 직후 포커스(키보드가 뜨며 레이아웃 재조정되는 시간 고려)
       setTimeout(() => {
         inputRefs.current[newlyAddedPlaceId]?.focus?.();
       }, scrolled ? 150 : 220);
     }, 60);
   });
 }, [isEditing, newlyAddedIndex, newlyAddedPlaceId]);

  useEffect(() => {
    console.log('🔥 PlannerResponseHome mounted!', route.params);
    const fetchDetail = async () => {
      if (route.params?.scheduleId) {
        try {
          const detail = await getScheduleDetail(route.params.scheduleId);
          let detailWithId = detail;
          if (!detail.id && route.params?.scheduleId) {
            detailWithId = { ...detail, id: route.params.scheduleId };
          }
          setScheduleData(ensurePlaceIds(detailWithId));
          console.log('[상세보기 불러온 scheduleData]', detailWithId);
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

  // 편집모드면 임시본에서, 아니면 원본에서 읽어옴
  const selectedDay = isEditing
    ? editDraft?.days[selectedDayIndex]
    : scheduleData.days[selectedDayIndex];
  const places = selectedDay?.places ?? [];

  // 수정모드 진입: 임시본 생성
  const enterEditMode = () => {
    setOriginalScheduleData(JSON.parse(JSON.stringify(scheduleData))); // 원본 백업
    setEditDraft(JSON.parse(JSON.stringify(scheduleData))); // 편집본 생성
    setIsEditing(true);
  };

  // 뒤로가기: 임시본 파기, 수정모드 해제
  const handleBack = () => {
  console.log('🔙 handleBack 호출됨');
  if (isEditing) {
    console.log('✏️ 수정모드 종료');
    setEditDraft(null);
    setIsEditing(false);
    return;
  }

  const tabNav = navigation.getParent();
  console.log('📦 tabNav:', tabNav);
  console.log('🧭 from:', from);

  if (from === 'Home') {
    if (tabNav?.reset) {
      console.log('🏠 Home으로 reset 이동');
      tabNav.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } else {
      console.log('📌 tabNav 없음 → navigation.navigate("Home")');
      navigation.navigate('Home');
    }
  } else if (tabNav && tabNav.navigate) {
    console.log('📄 MyTrips로 이동');
    tabNav.navigate('MyTrips');
  } else if (navigation.canGoBack()) {
    console.log('🔙 goBack() 실행');
    navigation.goBack();
  } else {
    console.log('📌 fallback: navigation.navigate("MyTrips")');
    navigation.navigate('MyTrips');
  }
};


  // 드래그 결과 임시본에 반영
  const handleDragEnd = ({ data }) => {
    setEditDraft(prev => {
      const updatedDays = prev.days.map((day, idx) =>
        idx === selectedDayIndex ? { ...day, places: [...data] } : day
      );
      return { ...prev, days: updatedDays };
    });
  };

  // 장소 추가: 임시본에만 반영
  const handleAddPlace = (insertIndex) => {
    if (newlyAddedPlaceId) return;
    setEditDraft(prev => {
      const currentPlaces = [...prev.days[selectedDayIndex].places];
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
      const updatedDays = prev.days.map((day, i) =>
        i === selectedDayIndex ? { ...day, places: updatedPlaces } : day
      );
      setNewlyAddedPlaceId(newPlaceId);
      setNewlyAddedIndex(insertIndex + 1);    
      setEditedPlaceId(newPlaceId);           
      setEditedPlaces(p => ({ ...p, [newPlaceId]: '' })); 
      return { ...prev, days: updatedDays };
    });
  };

  // 삭제: 임시본에만 반영
  const handleDeletePlace = (placeId) => {
    setEditDraft(prev => {
      const currentPlaces = [...prev.days[selectedDayIndex].places];
      const updatedPlaces = currentPlaces.filter((p) => p.id !== placeId);
      const updatedDays = prev.days.map((day, i) =>
        i === selectedDayIndex ? { ...day, places: updatedPlaces } : day
      );
      return { ...prev, days: updatedDays };
    });
    if (newlyAddedPlaceId === placeId) setNewlyAddedPlaceId(null);
    setEditedPlaces((prev) => {
      const updated = { ...prev };
      delete updated[placeId];
      return updated;
    });
  };

  // 인풋 편집 완료: 임시본에만 반영
  const handleEndEditing = (placeId) => {
    setEditDraft(prev => {
      const currentPlaces = [...prev.days[selectedDayIndex].places];
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
      const updatedDays = prev.days.map((day, i) =>
        i === selectedDayIndex ? { ...day, places: updatedPlaces } : day
      );
      return { ...prev, days: updatedDays };
    });
    setNewlyAddedPlaceId(null);
  };

  // 수정 완료: editDraft를 실제 데이터로 반영
  const handleEditDone = async () => {
    setNewlyAddedPlaceId(null);
    setNewlyAddedIndex(-1);
    setEditedPlaces({});
    const emptyPlaces = editDraft.days[selectedDayIndex].places.filter(p => !p.name?.trim());
    if (emptyPlaces.length > 0) {
      Alert.alert(
        '빈 장소가 있어요',
        '장소명을 입력하지 않은 항목이 있어요. 수정 후 저장해주세요'
      );
      return;
    }
    setIsRegenerating(true);
    try {
      await saveCacheData(CACHE_KEYS.PLAN_EDITED, editDraft);
      const placeNames = editDraft.days[selectedDayIndex].places.map(p => p.name);
      const result = await editSchedule(placeNames);
      if (result.places && result.totalEstimatedCost !== undefined) {
        const newPlaces = ensurePlaceIds({ days: [{ places: result.places }] }).days[0].places;
        const updatedDraft = {
          ...editDraft,
          days: editDraft.days.map((day, idx) =>
            idx === selectedDayIndex
              ? {
                  ...day,
                  places: newPlaces,
                  totalEstimatedCost: result.totalEstimatedCost,
                }
              : day
          ),
        };
        setScheduleData(updatedDraft);
        setEditDraft(null);
      } else if (Array.isArray(result)) {
        const newPlaces = ensurePlaceIds({ days: [{ places: result }] }).days[0].places;
        const updatedDraft = {
          ...editDraft,
          days: editDraft.days.map((day, idx) =>
            idx === selectedDayIndex
              ? { ...day, places: newPlaces }
              : day
          ),
        };
        setScheduleData(updatedDraft);
        setEditDraft(null);
      } else {
        setScheduleData(editDraft);
        setEditDraft(null);
      }
    } catch (e) {
      console.warn('⚠️ PLAN_EDITED 캐시 저장 or API 호출 실패:', e);
    }
    setIsEditing(false);
    setOriginalScheduleData(null);
    setIsRegenerating(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: normalize(16),
          paddingVertical: normalize(12),
        }}>
          <TouchableOpacity onPress={handleBack}>
           <Ionicons
             name="chevron-back"
             size={24}
             color="#4F46E5"
             style={{ marginTop: -12 }} // ✅ 여기서 위로 올림
           />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>여행플랜</Text>
          <View style={{ width: normalize(24) }} />
        </View>
        <View style={styles.headerLine} />
        {/* 여행 정보 */}
        <View style={styles.tripInfo}>
          <View style={styles.tripInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tripTitle}>{scheduleData.title}</Text>
              <Text style={styles.dateText}>
                {scheduleData.startDate} ~ {scheduleData.endDate}
              </Text>
            </View>
            {selectedDay && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.totalBudgetLabel}>
                  {selectedDay.day ?? `Day ${selectedDayIndex + 1}`} 총 예산
                </Text>
                <Text style={styles.budget}>
                  {selectedDay.totalEstimatedCost?.toLocaleString()}
                  <Text style={styles.budgetUnit}>원</Text>
                </Text>
              </View>
            )}
          </View>
        </View>
        {/* 탭 */}
        {isEditing ? (
          <View style={{
            alignItems: 'center',
            backgroundColor: '#FAFAFA',
            paddingVertical: normalize(10),
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
                      <View style={styles.activeBar} />
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
              ref={listRef}
              data={places}
              keyExtractor={(item, idx) => item.id ? String(item.id) : `temp-${idx}`}
              onDragEnd={handleDragEnd}
              extraData={[places, newlyAddedPlaceId, selectedDayIndex]}
              containerStyle={styles.container}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingBottom: normalize(160, 'height'), // ⬅️ 120→160
              }}
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
                          <Ionicons name="reorder-two-outline" size={normalize(30)} color={place.type === '식사' ? '#1270B0' : '#4F46E5'} />
                        </TouchableOpacity>
                        {/* 삭제 버튼 */}
                        <TouchableOpacity
                          style={{
                            position: 'absolute',
                            top: normalize(25),
                            right: 0,
                            backgroundColor: '#F87171',
                            borderRadius: normalize(20),
                            padding: normalize(4),
                            zIndex: 10,
                          }}
                          onPress={() => handleDeletePlace(place.id)}
                        >
                          <Ionicons name="remove" size={normalize(16)} color="#fff" />
                        </TouchableOpacity>
                        {/* placeCard */}
                        <TouchableOpacity
                          ref={(ref) => {
                            if (ref) {
                              placeRefs.current[place.id] = ref;
                            }
                          }}
                          style={[styles.placeCard3, { marginLeft: normalize(24) }]}
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
                              ref={(ref) => { if (ref) inputRefs.current[place.id] = ref; }}
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
                            <View style={{ minHeight: normalize(60, 'height'), justifyContent: 'center' }}>
                              <View style={styles.placeHeader}>
                                <Text style={styles.placeName}>{place.name}</Text>
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
                        paddingVertical: normalize(4),
                        borderRadius: normalize(16),
                        marginTop: normalize(16),
                        marginBottom: currentIndex === places.length - 1
                          ? normalize(28)
                          : normalize(10),
                        alignSelf: 'flex-start',
                        width: '50%',
                        marginLeft: normalize(90),
                        opacity: newlyAddedPlaceId ? 0.5 : 1,
                      }}
                      disabled={!!newlyAddedPlaceId}
                      onPress={() => handleAddPlace(currentIndex)}
                    >
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: normalize(15),
                          textAlign: 'center',
                          lineHeight: normalize(20),
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
              ref={scrollRef}
              style={styles.container}
              contentContainerStyle={{
                paddingBottom: normalize(160, 'height'), // ⬅️ 120→160
              }}
            >
              {places.map((place, idx) => (
                <View key={place.id ? String(place.id) : `temp-${idx}`}>
                  {/* 교통정보 (맨 위 카드 제외) */}
                  {idx !== 0 && place.fromPrevious && (
                    <View style={styles.transportRow}>
                      <View style={styles.transportItem}>
                        <Ionicons name="car-outline" size={normalize(19)} color="#6B7280" style={{ marginRight: normalize(-10) }}/>
                        <Text style={styles.transportTextss}>{place.fromPrevious.car}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <Ionicons name="bus-outline" size={normalize(17)} color="#6B7280" />
                        <Text style={styles.transportText}>{place.fromPrevious.publicTransport}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <MaterialCommunityIcons name="walk" size={normalize(17)} color="#6B7280" style={{ marginRight: normalize(30) }}/>
                        <Text style={styles.transportTexts}>{place.fromPrevious.walk}분</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.placeRow}>
                    <View style={styles.timeline}>
                      <View style={[
                        styles.dot,
                        { backgroundColor: place.type === '식사' ? '#1270B0' : '#4F46E5' },
                        { width: normalize(20), height: normalize(20), borderRadius: normalize(10), top: normalize(40) }
                      ]} />
                      {idx !== places.length - 1 && <View style={[styles.verticalLine, { left: normalize(13), width: normalize(4), height: normalize(330, 'height') }]} />}
                    </View>
                    <View style={styles.placeContent}>
                      <TouchableOpacity
                        style={styles.placeCard}
                        onPress={() => navigation.navigate('PlaceDetail', { place })}
                      >
                        <View style={styles.placeHeader}>
                          <Text style={styles.placeName}>{place.name}</Text>
                          <Text style={styles.placeCost}>
                            {place.estimatedCost === 0 ? '무료' : `${place.estimatedCost?.toLocaleString()}원`}
                          </Text>
                        </View>
                        <Text style={styles.placeType}>{place.type}</Text>
                        {place.gptOriginalName && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
                            {place.gptOriginalName.split(' ').map((tag, i) => (
                              <Text
                                key={i}
                                style={{
                                  color: '#606060',
                                  fontSize: 14,
                                  marginRight: 4,
                                  fontWeight: '400',
                                  lineHeight: 19,
                                }}
                              >
                                #{tag}
                              </Text>
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* 마지막 카드라면 교통정보를 아래 한 번 더 (마지막 day 제외) */}
                  {idx === places.length - 1 && place.fromPrevious && selectedDayIndex !== scheduleData.days.length - 1 && (
                    <View style={styles.transportRow}>
                      <View style={styles.transportItem}>
                        <Ionicons name="car-outline" size={normalize(19)} color="#6B7280" style={{ marginRight: normalize(-10)}}/>
                        <Text style={styles.transportTextss}>{place.fromPrevious.car}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <Ionicons name="bus-outline" size={normalize(17)} color="#6B7280" />
                        <Text style={styles.transportText}>{place.fromPrevious.publicTransport}분</Text>
                      </View>
                      <View style={styles.transportItem}>
                        <MaterialCommunityIcons name="walk" size={normalize(17)} color="#6B7280" style={{ marginRight: normalize(30) }}/>
                        <Text style={styles.transportTexts}>{place.fromPrevious.walk}분</Text>
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
              onPress={handleEditDone}
            >
              <Text style={styles.fixedDoneButtonText}>수정 완료</Text>
            </TouchableOpacity>
          </View>
        ) : (from === 'Home' || isReadOnly || isSaved) ? (  // ✅ 여기 수정됨
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={[
                styles.editButton,
                { flex: 1, marginRight: normalize(8), backgroundColor: '#F87171', borderColor: '#F87171' }
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
                          console.log('[삭제 요청 id]', scheduleData.id);
                          const scheduleId = scheduleData.id;
                          await deleteSchedule(scheduleId);
                          Alert.alert('삭제 완료', '플랜이 삭제되었습니다!');
                          navigation.goBack();
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
              onPress={enterEditMode}
            >
              <Text style={[styles.editButtonText, { color: '#fff' }]}>플랜 수정</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.bottomButtonContainer1}>
              <TouchableOpacity
                style={[styles.editButton, { marginRight: normalize(2) }]}
                onPress={enterEditMode}
              >
                <Text style={styles.editButtonText}>플랜 수정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { marginLeft: normalize(8) }]}
                onPress={() => {
                  navigation.push('PlannerResponse', {
                    mock: true,
                    data: MOCK_SCHEDULE,
                    from: 'mock',
                  });
                }}
              > 
                {/* 묵데이터 여기까지 */}
                {/* api 사용
                onPress={async () => {
                  setIsRegenerating(true);
                  try {
                    const excludedNames = scheduleData.days
                      .flatMap(day => day.places.map(place => place.name))
                      .filter(name => !!name);
                    const destinationToSend = scheduleData.destination || "NONE";
                    const mbtiToSend = scheduleData.mbti || "NONE";
                    const travelStyleToSend = scheduleData.travelStyle || "NONE";
                    const peopleGroupToSend = scheduleData.peopleGroup || "NONE";
                    const budgetToSend = scheduleData.budget ?? 0;

                    const requestData = { ... };
                    const result = await regenerateSchedule(requestData);
                    // ...
                  } catch (err) {
                    // ...
                  } finally {
                    setIsRegenerating(false);
                  }
                }} 
                api 사용 여기까지 */}
                <Text style={styles.saveButtonText}>플랜 전체 재조회</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.regenerateButtonWrapper}>
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={async () => {
                  try {
                    {/* 묵데이터 */}
                    const mockWithId = {
                      ...MOCK_SCHEDULE,
                      id: uuid.v4(), // 반드시 있어야 함
                    };

                    const existingRaw = await AsyncStorage.getItem('MY_TRIPS');
                    const existingTrips = existingRaw ? JSON.parse(existingRaw) : [];

                    const filtered = existingTrips.filter(
                      trip =>
                        !(
                          trip.title === mockWithId.title &&
                          trip.startDate === mockWithId.startDate
                        )
                    );

                    const updatedTrips = [...filtered, mockWithId];
                    await AsyncStorage.setItem('MY_TRIPS', JSON.stringify(updatedTrips));

                    setScheduleData(mockWithId);

                    Alert.alert('저장 완료', '내 여행에 저장되었습니다.', [
                      {
                        text: '확인',
                        onPress: () => {
                          navigation.push('PlannerResponse', {
                            scheduleId: mockWithId.id,
                            mode: 'read',
                            from: 'Home',
                          });
                        },
                      },
                    ]);
                  } catch (e) {
                    console.warn('저장 실패:', e);
                    Alert.alert('오류', '저장에 실패했습니다.');
                  }
                }} 
              >
                {/* 여기까지 */}
                {/* api 사용
                onPress={async () => {
                  const saveRequest = { ... };
                  const response = await saveSchedule(saveRequest);
                  // ...
                }}
                api 사용 여기까지 */}
                <Text style={styles.regenerateButtonText}>내 여행으로 저장</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {/* 묵데이터 */}
        {/* <Modal visible={isRegenerating} transparent animationType="fade">  */}
        {/*   <SplashScreen />   */}
        {/* </Modal>    */}
        {/* 여기까지 */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#Fafafa' },
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingText: { marginTop: normalize(100, 'height'), textAlign: 'center', fontSize: normalize(16) },
  headerLine: {
    height: 1,
    backgroundColor: '#B5B5B5',
    marginTop: normalize(-1),
  },
  headerTitle: { fontSize: normalize(18), alignItems: 'center', color: '#000' , marginTop: normalize(-8),},
  tripInfo: { backgroundColor: '#FAFAFA', padding: normalize(16), paddingBottom: normalize(4) },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tripTitle: { fontSize: normalize(20), color: '#1E1E1E' },
  totalBudgetLabel: { fontSize: normalize(14), color: '#1E1E1E', top: -2 },
  budget: { color: '#4F46E5', fontSize: normalize(14), marginTop: normalize(4) },
  budgetUnit: { color: '#4F46E5', fontSize: normalize(14) },
  dateText: { fontSize: normalize(14), color: '#7E7E7E', marginTop: normalize(4), marginBottom: 0 },
  tabScrollWrapper: {
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabContainer: { flexDirection: 'row', paddingHorizontal: normalize(6), paddingVertical: normalize(6) },
  tabBox: { alignItems: 'center', marginHorizontal: normalize(6), paddingHorizontal: normalize(10) },
  tabText: { fontSize: normalize(18), color: '#9CA3AF' },
  tabTextSelected: { color: '#4F46E5', fontWeight: 'bold' },
  activeBar: {
    marginTop: normalize(5),
    height: normalize(4),
    width: normalize(80),
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  container: {
    paddingHorizontal: normalize(16),
    marginBottom: -normalize(70),
    marginTop: normalize(20),
    backgroundColor: '#FAFAFA',
  },
  bottomButtonContainer1: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    paddingVertical: normalize(20),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(12),
    marginBottom: -normalize(20)
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    paddingVertical: normalize(18),
    paddingHorizontal: normalize(20),
    top:normalize(10),
    borderRadius: normalize(12),
    paddingBottom: normalize(20), // 👈 이거 추가
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: normalize(32),
  },
  timeline: {
    width: normalize(30),
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: normalize(20),
    height: normalize(20),
    borderRadius: normalize(10),
    backgroundColor: '#6366F1',
    position: 'absolute',
    top: normalize(40),
    zIndex: 2,
  },
  verticalLine: {
    position: 'absolute',
    top: -normalize(20),
    left: normalize(13),
    width: normalize(4),
    height: normalize(330, 'height'),
    backgroundColor: '#A19CFF',
  },
  placeContent: { flex: 1, marginLeft: normalize(10) },
  placeCard: {
    backgroundColor: '#fff',
    padding: normalize(16),
    paddingBottom: normalize(10),
    borderRadius: normalize(20),
    marginBottom: -normalize(25),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  placeCard2: {
    backgroundColor: '#fff',
    padding: normalize(16),
    paddingRight: normalize(5),
    paddingLeft: normalize(12),
    paddingBottom: normalize(6),
    borderRadius: normalize(20),
    marginBottom: -normalize(35),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: '85%',
    left: -normalize(20),
  },
  placeCard3: {
    backgroundColor: '#fff',
    padding: normalize(16),
    paddingRight: normalize(5),
    paddingLeft: normalize(16),
    paddingBottom: normalize(6),
    borderRadius: normalize(20),
    marginBottom: -normalize(40),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: '88%',
    left: -normalize(20),
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  placeName: { fontSize: normalize(16), marginBottom: normalize(4), color: '#373737' },
  placeCost: {
    fontSize: normalize(15),
    fontWeight: '600',
    fontStyle: 'Inter',
    color: '#8B76E8',
    bottom: -normalize(15),
  },
  placeType: { fontSize: normalize(13), color: '#9CA3AF', marginBottom: normalize(4) , top:normalize(2)},
  keywords: { fontSize: normalize(12), color: '#333333', marginBottom: normalize(6) },
  transportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(12),
    marginBottom: normalize(12),
  },
  placeNameInput: {
    fontSize: normalize(18),
    marginBottom: normalize(19),
    color: '#373737',
    paddingVertical: normalize(4),
    paddingTop: normalize(18),
  },
  transportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: normalize(120),
    marginLeft: normalize(10),
    justifyContent: 'center',
  },
  transportText: {
    marginLeft: normalize(6),
    fontSize: normalize(14),
    color: '#000',
  },
  transportTexts: {
    marginLeft: normalize(-28),
    fontSize: normalize(14),
    color: '#000',
  },
  transportTextss: {
    marginLeft: normalize(14),
    fontSize: normalize(14),
    color: '#000',
  },
  dragHandle: {
    position: 'absolute',
    left: -normalize(45),
    top: normalize(25),
    padding: normalize(4),
    zIndex: 5,
  },
  editButton: {
    flex: 1,
    height: normalize(45),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: '#4F46E5',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: normalize(16),
    color: '#4F46E5',
  },
  saveButton: {
    flex: 1,
    height: normalize(45),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: '#4F46E5',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#4F46E5',
    fontSize: normalize(16),
  },
  regenerateButtonWrapper: {
    position: 'absolute',
    bottom: normalize(50),
    left: normalize(16),
    right: normalize(16),
    backgroundColor: '#fafafa',
    paddingVertical: normalize(5),
    borderRadius: normalize(12),
  },
  regenerateButton: {
    backgroundColor: '#4F46E5',
    borderRadius: normalize(10),
    paddingVertical: normalize(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: normalize(16),
  },
  fixedDoneButtonWrapper: {
    position: 'absolute',
    bottom: normalize(5),
    left: normalize(20),
    right: normalize(20),
    backgroundColor: '#4F46E5',
    borderRadius: normalize(12),
    paddingVertical: normalize(14),
    alignItems: 'center',
  },
  fixedDoneButton: {
    width: '100%',
    alignItems: 'center',
  },
  fixedDoneButtonText: {
    color: '#fff',
    fontSize: normalize(18),
  },
});
