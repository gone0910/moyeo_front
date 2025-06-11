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
    destination: '충북/청주시',
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
          {matches.map((item, index) => (
            <TouchableOpacity key={index} onPress={() => handleCardPress(item.nickname || item.name)}>
              <View style={styles.matchBox}>
                <Image source={{ uri: item.image || item.imageUrl }} style={styles.matchImage} />
                <View style={styles.matchInfoColumn}>
                  <Text style={styles.matchName}>{item.name || item.nickname}</Text>
                  <Text style={styles.matchDate}>
                    {item.date? item.date.replace(/-/g, '/'): `${formatDate(item.startDate)} ~ ${formatDate(item.endDate)}`}
                  </Text>
                  <View style={styles.tagsContainer}>
                    {(item.tags || item.travelStyles)?.map((tag, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>#{STYLE_ENUM_TO_KOR[tag] || tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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

                  {/* 🔹 목적지, 백엔드에서 받은 ENUM 값 한글로 변환 */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>목적지</Text>
                    <Text style={styles.infoTag3}>
                      {selectedMatch.destination
                        ? selectedMatch.destination // destination 문자열 있으면 그대로 사용
                        : formatDestination(selectedMatch.province, selectedMatch.cities)}
                    </Text>
                  </View>

                  {/* 🔹 MBTI */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>MBTI</Text>
                    <Text style={styles.infoTag4}>{selectedMatch.mbti}</Text>
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
    borderRadius: scale(12),
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
    borderRadius: scale(20),
    padding: scale(16),
    alignItems: 'center',
    shadowColor: '#888',
    shadowOffset: { width: 0, height: vScale(10) },
    shadowOpacity: 0.14,
    shadowRadius: scale(22),
    elevation: 9,
    position: 'relative',
  },
  modalProfileImageUpdated: {
    width: scale(86),
    height: scale(86),
    borderRadius: scale(14),
    backgroundColor: '#ECECEC',
    borderWidth: 2,
    borderColor: '#E0E7FF',
    marginLeft: scale(12),

  }, // 매칭 값
  matchImage: { width: scale(71), height: scale(71), borderRadius: scale(21), marginRight: scale(12) },
  matchName: { fontSize: scale(16), color: '#1E1E1E' },
  matchDate: { fontSize: scale(14), color: '#7E7E7E', marginTop: vScale(8) },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: vScale(8) },
  tag: { backgroundColor: '#EFEAE5', paddingVertical: vScale(3), paddingHorizontal: scale(6), borderRadius: scale(4), marginRight: scale(6) },
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
    width: '100%',
    justifyContent: 'row',  // 사진 좌측정렬
  },
  modalUserName: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#4F46E5',
    marginLeft: scale(20),
  },
  modalDate: {
    fontSize: scale(13),
    color: '#888',
    marginTop: vScale(6),
    marginLeft: scale(20),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: scale(35),
    marginLeft: scale(24),
    marginTop: scale(8), // 위 요소와의 간격
  },
  infoLabel: {
    width: scale(77), // ex. 성별: 40, 여행성향: 77
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16),
    color: '#1E1E1E',
    textAlignVertical: 'center',
    backgroundColor: '#FFFFFF',
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    flex: 1,
    // marginLeft: scale(8), // ← 반드시 삭제 또는 주석!
  },
  infoTag1: {
    MaxWidth: scale(69),
    height: scale(30),
    marginLeft: scale(10),
    borderRadius: scale(8),
    backgroundColor: '#ADB3DD',
    color: '#fff',
    fontSize: scale(14),
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: scale(30),
    paddingHorizontal: scale(8),
  },
  infoTag2: {
    MaxWidth: scale(98),
    height: scale(30),
    marginLeft: scale(10),
    borderRadius: scale(8),
    backgroundColor: '#B3A4F7',
    color: '#fff',
    fontSize: scale(14),
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: scale(30),
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
    lineHeight: scale(30),
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
  lineHeight: scale(30),
  },
  chatButton: {
    backgroundColor: '#4F46E5',
    marginTop: vScale(25),
    borderRadius: scale(14),
    paddingVertical: vScale(15),
    width: '100%',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: vScale(5) },
    shadowOpacity: 0.18,
    shadowRadius: scale(10),
    elevation: 5,
  },
  chatButtonText: {
    color: 'white',
    fontSize: scale(17),
    fontWeight: '700',
  },
  contentContainer: {
    padding: scale(25),
    paddingBottom: vScale(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  NoneListText1: {
    fontSize: scale(24),
    color: '#1E1E1E',
    textAlign: 'center',
    marginVertical: vScale(12),
    top: vScale(170),
  },
  NoneListText2: {
    fontSize: scale(18),
    color: '#7E7E7E',
    textAlign: 'center',
    marginVertical: vScale(12),
    top: vScale(170),
  },
});
