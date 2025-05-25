// components/matching/MatchingList.jsx   매칭 동행자 리스트
// 매칭 결과 시 Matchinglist, 없는 결과시 NoneList.jsx 로 이동.
// - API 연동일 경우: 백엔드에서 사용자 리스트 조회 후 표시
// - 카드 클릭 시 상세정보를 모달로 출력
// ✅ MatchingList.jsx - UI 전체 복원 및 API 연동 완성본
import React, { useEffect, useState, useContext } from 'react';
import {  View, Text, Image, TouchableOpacity,  Modal,  ScrollView, Alert, StyleSheet,} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getMatchingList, getUserMatchingDetail } from '../../api/matching';
import { createChatRoom } from '../../api/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../contexts/UserContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ENUM_TO_PROVINCE_KOR, ENUM_TO_CITY_KOR } from '../common/regionMap';
import { GENDER_ENUM_TO_KOR, STYLE_ENUM_TO_KOR } from '../matching/utils/matchingUtils';



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

const MatchingList = () => {
  const [matches, setMatches] = useState([]); // 🔹 동행자 리스트 상태
  const [selectedMatch, setSelectedMatch] = useState(null); // 🔹 선택한 유저 상세정보 상태 (모달용)
  const navigation = useNavigation();
  const { user } = useContext(UserContext); // 🔹 사용자 컨텍스트 (프로필 이미지 등에 사용)

  // ✅ 매칭 결과 리스트 불러오기 (mock 또는 실제 API)
  useEffect(() => {
    const fetchData = async () => {
      const isMock = await AsyncStorage.getItem('mock');
      if (isMock === 'true') {
        console.log('[mock] 더미 데이터 사용');
        setMatches(dummyMatches);
        return;
      }

      const token = await AsyncStorage.getItem('jwt');
      console.log('[현재 JWT]', token); // 정식 발급 토큰인지 확인
      const result = await getMatchingList(token);
      console.log('[api 응답 확인] /matching/result:', result);

      if (result === null) {
        Alert.alert('에러', '서버 연결에 실패했습니다.');
      } else if (result.length === 0) {
        console.log('[api 결과] 조건에 맞는 동행자 없음 → NoneList 이동');
        navigation.navigate('NoneList');
      } else {
        console.log('[api 결과] 동행자 리스트:', result);
        setMatches(result);
      }
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

  return (
    <View style={styles.container}>
      {/* ✅ 상단 헤더 (로고 + 프로필 이미지) */}
      <View style={styles.headerWrapper}>
        <Text style={styles.logoText} numberOfLines={1} adjustsFontSizeToFit>moyeo </Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileHome', user)}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.headerLine} />

      {/* ✅ 안내 문구 + 리스트 출력 */}
      <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: 100 }}>
          {/* 🔹 안내 메시지 박스 */}
          <View style={{ backgroundColor: '#CECCF5', padding: 16, borderRadius: 12, marginBottom: 26 }}>
            <Text style={{ color: '#616161', fontSize: 16, textAlign: 'center',top:-3 }}>나와 여행 스타일이 유사한 사용자들이에요</Text>
            <Text style={{ color: '#616161', fontSize: 16, textAlign: 'center', top: 3 }}>함께 여행갈 사람을 찾아볼까요?</Text>
          </View>

          {/* 🔹 NoneList로 이동 (테스트용 버튼) */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.NoneListButton} onPress={() => navigation.navigate('NoneList')}>
              <Ionicons name="rocket-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* 🔹 동행자 리스트 출력 */}
          {matches.map((item, index) => (
            <TouchableOpacity key={index} onPress={() => handleCardPress(item.nickname || item.name)}>
              <View style={styles.matchBox}>
                <Image source={{ uri: item.image || item.imageUrl }} style={styles.matchImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchName}>{item.name || item.nickname}</Text>
                  <Text style={styles.matchDate}>{item.date || `${item.startDate} ~ ${item.endDate}`}</Text>
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
                    <View style={{ marginLeft: 16 }}>
                      <Text style={styles.modalUserName}>{selectedMatch.name || selectedMatch.nickname}</Text>
                      <Text style={styles.modalDate}>{selectedMatch.date || `${selectedMatch.startDate} ~ ${selectedMatch.endDate}`}</Text>
                    </View>
                  </View>

                  {/* 🔹 성별 */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>성별</Text>
                    <Text style={styles.infoTag1}>{selectedMatch.gender && GENDER_ENUM_TO_KOR?.[selectedMatch.gender] || '선택없음'}</Text>
                  </View>

                  {/* 🔹 여행 성향 */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>여행 성향</Text>
                    <View style={styles.tagGroup}>
                      {(selectedMatch.travelStyle || selectedMatch.travelStyles)?.map((style, idx) => (
                        <Text key={idx} style={styles.infoTag2}>#{STYLE_ENUM_TO_KOR?.[style] || '선택없음'}</Text>
                      ))}
                    </View>
                  </View>

                  {/* 🔹 목적지, 백엔드에서 받은 ENUM 값 한글로 변환 */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>목적지</Text>
                    <Text style={styles.infoTag3}>
                      {selectedMatch.destination ||
                           `${ENUM_TO_PROVINCE_KOR[selectedMatch.province] || selectedMatch.province} / ${
                            (selectedMatch.cities || [])
                              .map((code) => ENUM_TO_CITY_KOR[code] || code)
                              .join(', ')
                          }`
                      }
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
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontFamily: 'KaushanScript',
    color: '#4F46E5',
    lineHeight: 80,
    letterSpacing: 0,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: 22,
    top: -5,
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    top: 5,
    backgroundColor: '#D1D5DB',
  },
  headerLine: {
    height: 1,
    backgroundColor: '#999',
    marginVertical: 8,
    top: -10,
  },
  matchBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBoxUpdated: {
    width: '90%', // 디바이스 폭 90% (or 340 고정도 가능)
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 26,
    alignItems: 'center', // 내부 모두 중앙정렬(필요시 flex-start로 변경)
    // 그림자 효과
    shadowColor: '#888',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 9,
    position: 'relative',
  },
  modalProfileImageUpdated: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ECECEC',
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  matchImage: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  matchName: { fontSize: 18, color: '#1E1E1E' },
  matchDate: { fontSize: 16, color: '#7E7E7E', marginTop: 8 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tag: { backgroundColor: '#EFEAE5', paddingVertical: 3, paddingHorizontal: 6, borderRadius: 4, marginRight: 6 },
  tagText: { fontSize: 12, color: '#7E7E7E' },

  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    width: '100%',
    justifyContent: 'center',
  },
  modalUserName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginLeft: 20,
  },
  modalDate: {
    fontSize: 15,
    color: '#888',
    marginTop: 6,
    marginLeft: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 13,
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    width: 70,
    marginTop: 7,
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
    marginLeft: 8,
  },
  infoTag1: {
    backgroundColor: '#ADB3DD',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    fontSize: 14,
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    marginBottom: 4,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: '#1E1E1E',
    fontWeight: '500',
    width: 60, // 고정 너비로 정렬 기준 맞추기
    marginTop: 8, // 텍스트 상단 맞춤
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    marginLeft: 12,
  },
  infoTag1: {
    backgroundColor: '#ADB3DD',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    fontSize: 14,
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    marginBottom: 4,
    marginLeft: 8,
  },
  infoTag2: {
    backgroundColor: '#B3A4F7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    fontSize: 14,
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    marginBottom: 4,
    marginLeft: 8,
  },
  infoTag3: {
    backgroundColor: '#F4F4FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    fontSize: 14,
    color: '#7E7E7E',
    minWidth: 60,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#D6C9DF',
    marginBottom: 4,
    marginLeft: 8,
  },
  infoTag4: {
    backgroundColor: '#B3A4F7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    fontSize: 14,
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    marginBottom: 4,
    marginLeft: 8,
  },
  chatButton: {
    backgroundColor: '#4F46E5',
    marginTop: 25,
    borderRadius: 14,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    // 그림자 효과(버튼만)
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
    flexDirection: "row",
    gap: 12,
    },
    NoneListButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    top:0,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
  },
});
