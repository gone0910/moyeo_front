// components/matching/MatchingList.jsx   매칭 동행자 리스트
// 매칭 결과 시 Matchinglist, 없는 결과시 NoneList.jsx 로 이동.
// - API 연동일 경우: 백엔드에서 사용자 리스트 조회 후 표시
// - 카드 클릭 시 상세정보를 모달로 출력
// ✅ MatchingList.jsx - UI 전체 복원 및 API 연동 완성본
import React, { useEffect, useState, useContext } from 'react';
import {  View, Text, Image, TouchableOpacity,  Modal,  ScrollView, Alert, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getMatchingList, getUserMatchingDetail } from '../../api/matching';
import { createChatRoom } from '../../api/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../contexts/UserContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ENUM_TO_PROVINCE_KOR, ENUM_TO_CITY_KOR } from '../common/regionMap';
import { STYLE_ENUM_TO_KOR, GENDER_ENUM_TO_KOR } from './utils/matchingUtils';
import HeaderBar from '../common/HeaderBar';
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const vScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;


// 🟡 더미 데이터 (mock 모드에서만 사용)
const dummyMatches = [
  {
    name: '김모여',
    date: '2025/4/20 ~ 2025/5/3',
    tags: ['액티비티', '문화/관광', '맛집'],
    image: 'https://via.placeholder.com/60x60.png?text=1',
    gender: '남성',
    travelStyle: ['액티비티', '문화/관광', '맛집'],
    destination: ['충북/청주시'], // destination 아님! dto 참고
    mbti: '선택안함',
  },
];

// 백엔드에서 받아온 지역 NONE 처리 변환 함수
function formatDestination(province, cities = []) {
  // province: 'SEOUL' 등 ENUM, cities: ['NONE'] 또는 []
  if (!province || province === 'NONE') {
    return '선택없음';
  }
  // cities가 없거나 'NONE'만 있으면 → 도만
  if (!cities || cities.length === 0 || (cities.length === 1 && (cities[0] === 'NONE' || !cities[0]))) {
    return ENUM_TO_PROVINCE_KOR[province] || province;
  }
  // 도+시 모두 있을 때
  const cityNames = cities
    .filter((c) => c !== 'NONE' && !!c)
    .map((code) => ENUM_TO_CITY_KOR[code] || code);
  return `${ENUM_TO_PROVINCE_KOR[province] || province} / ${cityNames.join(', ')}`;
}

const MatchingList = () => {
  const [matches, setMatches] = useState([]); // 🔹 동행자 리스트 상태
  const [selectedMatch, setSelectedMatch] = useState(null); // 🔹 선택한 유저 상세정보 상태 (모달용)
  const navigation = useNavigation();
  const { user } = useContext(UserContext); // 🔹 사용자 컨텍스트 (프로필 이미지 등에 사용)
  const [loading, setLoading] = useState(true);


  // ✅ 매칭 결과 리스트 불러오기 (mock 또는 실제 API)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const isMock = await AsyncStorage.getItem('mock');
      if (isMock === 'true') {
        console.log('[mock] 더미 데이터 사용');
        setMatches(dummyMatches);
        setLoading(false);
        return;
      }

      const token = await AsyncStorage.getItem('jwt');
      console.log('[현재 JWT]', token); // 정식 발급 토큰인지 확인
      const result = await getMatchingList(token);
      console.log('[api 응답 확인] /matching/result:', result);

      if (result === null) {
        Alert.alert('에러', '서버 연결에 실패했습니다.');
        setMatches([]);
      } else {
        setMatches(result);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // ✅ 상세 정보 API 요청 및 모달 표시
  const handleCardPress = async (nickname) => {

    const isMock = await AsyncStorage.getItem('mock');
    if (isMock === 'true') {
      // ✅ 더미 상세정보 반환
      const dummyDetail = dummyMatches.find((item) => item.name === nickname);
      setSelectedMatch(dummyDetail);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('jwt');
      const detail = await getUserMatchingDetail(nickname, token);
      console.log(`[api 응답 확인] /matching/profile (${nickname}):`, detail);
      setSelectedMatch(detail);
    } catch (error) {
      Alert.alert('상세정보 조회 실패', '다시 시도해주세요.');
      console.error('[에러] /matching/profile 호출 실패:', error);
    }
  };

  if (matches.length === 0) {
  return (
    <View style={styles.container}>
      {/* ✅ 상단 헤더 (로고 + 프로필 이미지) */}
      <HeaderBar />

            {/* 안내 메시지 */}
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.NoneListText1}>
            같이 떠날 수 있는 여행자가 없어요
          </Text>
          <Text style={styles.NoneListText2}>
            동행자 정보를 수정하시는 걸 추천드려요
          </Text>
        </ScrollView>
      </View>
    );
  }

      function formatDate(dateStr) { // 날짜 출력 포맷 변환
      // "yyyy-mm-dd" → "yyyy/mm/dd"
      if (!dateStr) return '';
      return dateStr.replace(/-/g, '/');
    }

      return (
    <View style={styles.container}>
        <HeaderBar />
    <View/>
      {/* ✅ 안내 문구 + 리스트 출력 */}
      <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: 100 }}>
          {/* 🔹 안내 메시지 박스 */}
          <View style={{ backgroundColor: '#CECCF5', padding: 16, borderRadius: 12, marginBottom: 26 }}>
            <Text style={{ color: '#616161', fontSize: 16, textAlign: 'center',top:-3 }}>나와 여행 스타일이 유사한 사용자들이에요</Text>
            <Text style={{ color: '#616161', fontSize: 16, textAlign: 'center', top: 3 }}>함께 여행할 사람을 찾아볼까요?</Text>
          </View>

          {/* 🔹 NoneList로 이동 (테스트용 버튼) */}

          

          {/* 🔹 동행자 리스트 출력 */}
          {matches.map((item, index) => {

            // [ADD] 👇 1. 최대 보여줄 태그 개수 (이 숫자를 2, 3 등으로 조절하세요)
            const MAX_TAGS_VISIBLE = 3;

            // [ADD] 👇 2. 원본 태그 리스트 계산 (한글 변환)
            const allTags = Array.from(
              new Set(
                (item.travelStyles || item.travelStyle || item.tags || [])
                  .filter(Boolean)
                  .map(s => String(s).trim())
              )
            ).map(tag => STYLE_ENUM_TO_KOR[tag] || tag); // '#'은 렌더링 시점에 붙임

            // [ADD] 👇 3. 화면에 실제 렌더링할 태그 목록 (MAX_TAGS_VISIBLE 개수만큼 자름)
            const tagsToShow = allTags.slice(0, MAX_TAGS_VISIBLE);

            // [ADD] 👇 4. 잘린 태그가 더 있는지 여부 (true/false)
            const hasMoreTags = allTags.length > MAX_TAGS_VISIBLE;

            // [MODIFY] 👇 5. 이제 JSX를 렌더링합니다.
            return (
              <TouchableOpacity key={index} onPress={() => handleCardPress(item.nickname || item.name)}>
                <View style={styles.matchBox}>
                  <Image source={{ uri: item.image || item.imageUrl }} style={styles.matchImage} />
                  <View style={styles.matchInfoColumn}>
                    <Text style={styles.matchName}>{item.name || item.nickname}</Text>
                    <Text style={styles.matchDate}>
                      {item.date? item.date.replace(/-/g, '/'): `${formatDate(item.startDate)} ~ ${formatDate(item.endDate)}`}
                    </Text>
                    
                    {/* [MODIFY] 👇 6. 태그 컨테이너 로직 전체 수정 */}
                    <View style={styles.tagsContainer}>
                      
                      {/* 6-1. '보여줄 태그 목록(tagsToShow)'만 map으로 렌더링 */}
                      {tagsToShow.map((tag, i) => (
                        <View key={`${tag}-${i}`} style={styles.tag}>
                          {/* 여기서 '#'를 붙여줍니다 */}
                          <Text style={styles.tagText}>#{tag}</Text> 
                        </View>
                      ))}

                      {/* 6-2. 'hasMoreTags'가 true일 때만 '...' 박스를 추가로 렌더링 */}
                      {hasMoreTags && (
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>...</Text>
                        </View>
                      )}

                    </View>
                    {/* [MODIFY] 👆 (여기까지 수정) */}
                    
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ✅ 모달 (선택한 사용자 상세정보 출력) */}
      <Modal
        visible={!!selectedMatch}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMatch(null)}
      >
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.modalCenter}>
            <View style={styles.modalBoxUpdated}>
              {selectedMatch && (
                <>
                  {/* [ADD] 👇 목적지 태그 배열을 생성하는 로직 (여기부터) */}
                  {(() => {
                    let destinationTags = [];
                    if (selectedMatch.destination) {
                      // 1. destination 문자열이 통째로 오는 경우
                      destinationTags = [selectedMatch.destination];
                    } else if (selectedMatch.province && selectedMatch.province !== 'NONE') {
                      // 2. province와 cities 배열로 오는 경우
                      const provinceName = ENUM_TO_PROVINCE_KOR[selectedMatch.province] || selectedMatch.province;
                      const cityNames = (selectedMatch.cities || [])
                        .filter((c) => c !== 'NONE' && !!c)
                        .map((code) => ENUM_TO_CITY_KOR[code] || code);

                      if (cityNames.length === 0) {
                        // 2-1. 도/특별시만 있는 경우
                        destinationTags = [provinceName];
                      } else {
                        // 2-2. 도시가 여러 개인 경우 (요청하신 형식)
                        // ex: ['서울 / 강남구', '강동구', '서초구']
                        destinationTags.push(`${provinceName} / ${cityNames[0]}`);
                        destinationTags.push(...cityNames.slice(1));
                      }
                    } else {
                      // 3. 둘 다 없는 경우
                      destinationTags = ['선택없음'];
                    }
                    // [ADD] 👆 (여기까지)

                    return (
                      <>
                        {/* 🔹 모달 닫기 버튼 */}
                        <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setSelectedMatch(null)}>
                          <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>

                        {/* 🔹 모달 상단 유저 이미지/닉네임 */}
                        <View style={styles.modalHeader}>
                          <Image source={{ uri: selectedMatch.image || selectedMatch.imageUrl }} style={styles.modalProfileImageUpdated} />
                          <View>
                            <Text style={styles.modalUserName}>{selectedMatch.name || selectedMatch.nickname}</Text>
                            <Text style={styles.modalDate}>
                              {selectedMatch.date
                                ? selectedMatch.date.replace(/-/g, '/')
                                : `${formatDate(selectedMatch.startDate)} ~ ${formatDate(selectedMatch.endDate)}`}
                            </Text>
                          </View>
                        </View>

                        {/* 🔹 성별 */}
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>성별</Text>
                          <Text style={styles.infoTag1}>{GENDER_ENUM_TO_KOR[selectedMatch.gender] || selectedMatch.gender}</Text>
                        </View>

                        {/* 🔹 여행 성향 */}
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>여행 성향</Text>
                          <View style={styles.tagGroup}>
                            {(selectedMatch.travelStyle || selectedMatch.travelStyles)?.map((style, idx) => (
                              style === 'NONE'
                                ? <Text key={idx} style={styles.infoTag2}>{STYLE_ENUM_TO_KOR[style] || '선택없음'}</Text>
                                : <Text key={idx} style={styles.infoTag2}>#{STYLE_ENUM_TO_KOR[style] || style}</Text>
                            ))}
                          </View>
                        </View>

                        {/* [MODIFIED] 👇 목적지, 백엔드에서 받은 ENUM 값 한글로 변환 */}
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>목적지</Text>
                          {/* "여행 성향"과 동일한 tagGroup 레이아웃 적용 */}
                          <View style={styles.tagGroup}>
                            {destinationTags.map((tag, idx) => (
                              <Text key={idx} style={styles.infoTag3}> {/* infoTag3 스타일 사용 (색상 동일) */}
                                {tag}
                              </Text>
                            ))}
                          </View>
                        </View>

                        {/* 🔹 MBTI */}
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>MBTI</Text>
                          <Text style={styles.infoTag4}>{selectedMatch.mbti || '선택없음'}</Text>
                        </View>

                        {/* 🔹 채팅 버튼 */}
                        <TouchableOpacity
                          style={styles.chatButton}
                          onPress={async () => {
                            const isMock = await AsyncStorage.getItem('mock');
                            if (isMock === 'true') {
                              // 🔹 mock 모드 → 채팅방 화면으로 더미 정보 전달
                              navigation.navigate('Chat', {
                                screen: 'ChatRoomScreen',
                                params: {
                                  roomId: 'mock-room',
                                  nickname: selectedMatch.nickname || selectedMatch.name,
                                  profileUrl: selectedMatch.image || selectedMatch.imageUrl,
                                },
                              });
                              return;
                            }

                            try {
                              const token = await AsyncStorage.getItem('jwt');
                              const nickname = selectedMatch.nickname.trim(); // ← 이 줄 추가

                              console.log('[nickname 전달]', `"${nickname}"`); // ✅ 여기
                              console.log('[nickname 전달]', `"${selectedMatch.nickname}"`);
                              console.log(
                                '[요청 주소]',
                                `http://ec2-54-180-25-3.ap-northeast-2.compute.amazonaws.com:8080/chat/room/create?otherUserNickname=${encodeURIComponent(nickname)}`
                              );

                              const res = await createChatRoom(nickname, token); // 실제 API
                              console.log('[✅ 응답 전체]', JSON.stringify(res, null, 2));
                              console.log('[채팅방 생성 응답]', res); // roomid 제대로 지정됐는지 확인필요.

                              navigation.navigate('ChatRoomScreen', {
                                roomId: res.roomId,
                                nickname: res.nickname,
                                profileUrl: res.profileUrl,
                                origin: 'Matching',
                              });;

                              setSelectedMatch(null); // 이건 navigate 이후에 실행

                            } catch (error) {
                              Alert.alert('채팅방 생성 실패', '잠시 후 다시 시도해주세요.');
                              console.error('[에러] 채팅방 생성 실패:', error);
                            }
                          }}
                        >
                          <Text style={styles.chatButtonText}>동행을 위해 채팅하기</Text>
                        </TouchableOpacity>
                      </>
                    );
                  })()}
                </>
              )}
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

export default MatchingList;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  matchBox: {
    backgroundColor: '#fff',
    borderRadius: scale(20),
    padding: scale(12),
    marginBottom: vScale(12),
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: scale(358),
  },
  matchInfoColumn: {
    flex: 1,
    justifyContent: 'flex-start', // ★ 상단부터 배치
  },
  modalBoxUpdated: {
    width: '90%',
    maxWidth: scale(400),
    backgroundColor: '#FFF',
    borderRadius: scale(18), 
    paddingVertical: vScale(12), 
    paddingHorizontal: scale(16), 
    alignItems: 'center',
    shadowColor: '#888',
    shadowOffset: { width: 0, height: vScale(10) },
    shadowOpacity: 0.14,
    shadowRadius: scale(22),
    elevation: 9,
    position: 'relative',
  },
  modalProfileImageUpdated: {  // 프로필 이미지
    width: scale(68), 
    height: scale(68), 
    borderRadius: scale(21),
    backgroundColor: '#ECECEC',
    // borderWidth: 2,
    // borderColor: '#E0E7FF',
    marginLeft: scale(0), 

  }, // 매칭 값
  matchImage: { width: scale(69), height: scale(69), borderRadius: scale(21), marginRight: scale(12) },
  matchName: { fontSize: scale(16), color: '#1E1E1E' },
  matchDate: { fontSize: scale(14), color: '#7E7E7E', marginTop: vScale(8) },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: vScale(8) },
  tag: { backgroundColor: '#EFEAE5', paddingVertical: vScale(5), paddingHorizontal: scale(6), borderRadius: scale(6), 
    marginRight: scale(7), marginBottom: scale(4), },
  tagText: { fontSize: scale(12), color: '#7E7E7E' },

  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    position: 'absolute',
    top: scale(14),
    right: scale(14),
    zIndex: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vScale(18),
    marginTop: vScale(10),
    width: '100%',
    justifyContent: 'flex-start',
  },
  modalUserName: {
    fontSize: scale(20),
    color: '#111111', 
    marginLeft: scale(20),
  },
  modalDate: {
    fontSize: scale(18), 
    color: '#7E7E7E', 
    marginTop: vScale(0),
    marginLeft: scale(20),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginLeft: scale(24),
    marginTop: scale(10),
    marginBottom: scale(4),
    paddingRight: scale(12),
  },
  infoLabel: {
    width: scale(77),
    fontSize: scale(15),
    fontWeight: '400',
    color: '#1E1E1E',
    textAlignVertical: 'top',
    lineHeight: scale(22),
    marginTop: scale(0),
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'flex-start', // 추가: 줄 시작에 맞춤
    rowGap: scale(6),
  },
  infoTag1: {
    MaxWidth: scale(69),
    height: scale(30),
    marginLeft: scale(10),
    borderRadius: scale(8),
    backgroundColor: '#ADB3DD',
    color: '#fff',
    fontSize: scale(14), // 기존 태그 내 폰트박스 크기 14
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: scale(28),  // height와 lineHeight를 같게 해야 중앙정렬, ios 꼼수로 2 삭감
    paddingHorizontal: scale(16),
  },
  infoTag2: {
    MaxWidth: scale(68),
    height: scale(30),
    marginLeft: scale(10),
    borderRadius: scale(8),
    backgroundColor: '#C4A8E2',
    color: '#fff',
    fontSize: scale(14),
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: scale(28),
    paddingHorizontal: scale(11),
  },
  infoTag3: {
    MaxWidth: scale(98),
    height: scale(30),
    marginLeft: scale(10),
    borderRadius: scale(8),
    backgroundColor: '#B3A4F7',
    color: '#fff',
    fontSize: scale(14),
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: scale(28),
    paddingHorizontal: scale(11),
  },
  infoTag4: {
    width: scale(83),
    height: scale(30),
    marginLeft: scale(10),
    borderRadius: scale(8),
    backgroundColor: '#FAF4FF',
    color: '#7E7E7E',
    fontSize: scale(14),
    borderWidth: 1,
    borderColor: '#D6C9DF',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: scale(28),
  },
  chatButton: {
    backgroundColor: '#4F46E5',
    marginTop: vScale(20), 
    borderRadius: scale(10), 
    paddingVertical: vScale(10), 
    width: '100%',
    alignItems: 'center',
  },
  chatButtonText: {
    color: 'white',
    fontSize: scale(16), 
    fontWeight: '400'
  },
  contentContainer: {
    padding: scale(25),
    paddingBottom: vScale(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  NoneListText1: {
    fontSize: scale(22),
    color: '#1E1E1E',
    textAlign: 'center',
    marginVertical: vScale(12),
    top: vScale(170),
  },
  NoneListText2: {
    fontSize: scale(16),
    color: '#7E7E7E',
    textAlign: 'center',
    marginVertical: vScale(12),
    top: vScale(170),
  },
});