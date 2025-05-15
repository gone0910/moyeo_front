// components/matching/MatchingList.jsx   매칭 동행자 리스트
// 매칭 결과 시 Matchinglist, 없는 결과시 NoneList.jsx 로 이동.
// - API 연동일 경우: 백엔드에서 사용자 리스트 조회 후 표시
// - 카드 클릭 시 상세정보를 모달로 출력
// ✅ MatchingList.jsx - UI 전체 복원 및 API 연동 완성본

import React, { useEffect, useState, useContext } from 'react';
import {View,Text,Image,TouchableOpacity,Modal,ScrollView,Alert, StyleSheet,} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMatchingList, getUserMatchingDetail } from '../../api/matching';
import { UserContext } from '../../contexts/UserContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
// 🔹 ENUM → 한글 변환을 위한 매핑 객체들
import { GENDER_ENUM_TO_KOR, STYLE_ENUM_TO_KOR, AGE_ENUM_TO_KOR } from './utils/matchingUtils';
import { ENUM_TO_PROVINCE_KOR, ENUM_TO_CITY_KOR } from '../common/regionMap';

// 🟡 더미 데이터 (mock 모드에서만 사용)
const dummyMatches = [
  {
    name: '김모여',
    date: '2025/4/20 ~ 2025/5/3',
    image: 'https://via.placeholder.com/60x60.png?text=1',
    gender: 'MALE',
    travelStyle: ['ACTIVITY', 'CULTURE', 'FOOD'],
    ageGroup: 'TWENTIES',
    mbti: 'INFP',
    province: 'CHUNGBUK',
    cities: ['CHEONGJU'],
  },
];

const MatchingList = () => {
  const [matches, setMatches] = useState([]);  // 🔹 동행자 리스트 상태
  const [selectedMatch, setSelectedMatch] = useState(null); // 🔹 선택한 유저 상세정보 상태 (모달용)
  const navigation = useNavigation();
  const { user } = useContext(UserContext); // 🔹 사용자 전역 (프로필 이미지 등에 사용)


  // mock / api 분기 처리: 사용자 리스트 불러오기
  useEffect(() => {
    const fetchData = async () => {
      const isMock = await AsyncStorage.getItem('mock');
      if (isMock === 'true') {
        setMatches(dummyMatches);
        return;
      }
      const token = await AsyncStorage.getItem('jwt');
      const result = await getMatchingList(token);
      if (!result) {
        Alert.alert('에러', '서버 연결 실패');
      } else if (result.length === 0) {
        navigation.navigate('NoneList');
      } else {
        setMatches(result);
      }
    };
    fetchData();
  }, []);

  // mock / api 분기 처리: 상세 정보 요청 및 모달 표시
  const handleCardPress = async (nickname) => {
    const isMock = await AsyncStorage.getItem('mock');
    if (isMock === 'true') {
      const dummyDetail = dummyMatches.find((item) => item.name === nickname);
      setSelectedMatch(dummyDetail);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const detail = await getUserMatchingDetail(nickname, token);
      setSelectedMatch(detail);
    } catch (error) {
      Alert.alert('상세정보 조회 실패');
    }
  };

   // 성별, 나이, 여행 성향 ENUM → 한글로  역변환
  const renderGender = (gender) => GENDER_ENUM_TO_KOR[gender] || gender;
  const renderAgeGroup = (age) => AGE_ENUM_TO_KOR[age] || age;
  const renderTravelStyles = (styleList) =>
    Array.isArray(styleList)
      ? styleList.map((style, i) => (
          <Text key={i} style={styles.tagText}>
            #{STYLE_ENUM_TO_KOR[style] || style}
          </Text>
        ))
      : null;

  // 🔹 지역 정보 ENUM → 한글 변환 (도/시)
  const renderLocation = (user) => {
    if (!user?.province || !Array.isArray(user?.cities)) return '지역 정보 없음';
    const province = ENUM_TO_PROVINCE_KOR[user.province] || user.province;
    const cityList = user.cities.map((code) => ENUM_TO_CITY_KOR[code] || code).join(', ');
    return `${province} / ${cityList}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {matches.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleCardPress(item.nickname || item.name)}
          >
            <View style={styles.matchBox}>
              <Image
                source={{ uri: item.image || item.imageUrl }}
                style={styles.matchImage}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.matchName}>{item.name || item.nickname}</Text>
                <Text style={styles.matchDate}>{item.date || `${item.startDate} ~ ${item.endDate}`}</Text>
                <Text style={styles.matchAge}>{renderAgeGroup(item.ageGroup)}</Text>
                <View style={styles.tagsContainer}>
                  {renderTravelStyles(item.travelStyle || item.travelStyles)}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* 사용자 모달 화면 */}
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
                  <TouchableOpacity
                    style={styles.modalCloseIcon}
                    onPress={() => setSelectedMatch(null)}
                  >
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>

                  <View style={styles.modalHeader}>
                    <Image
                      source={{ uri: selectedMatch.image || selectedMatch.imageUrl }}
                      style={styles.modalProfileImageUpdated}
                    />
                    <View style={{ marginLeft: 16 }}>
                      <Text style={styles.modalUserName}>{selectedMatch.name || selectedMatch.nickname}</Text>
                      <Text style={styles.modalDate}>{selectedMatch.date || `${selectedMatch.startDate} ~ ${selectedMatch.endDate}`}</Text>
                    </View>
                  </View>
                  
                  {/* 🔹 성별 출력 */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>성별</Text>
                    <Text style={styles.infoTag1}>{renderGender(selectedMatch.gender)}</Text>
                  </View>

                  {/* 🔹 나이 출력 */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>나이</Text>
                    <Text style={styles.infoTag1}>{renderAgeGroup(selectedMatch.ageGroup)}</Text>
                  </View>

                  {/* 🔹 여행 성향 출력 */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>여행 성향</Text>
                    <View style={styles.tagGroup}>
                      {renderTravelStyles(selectedMatch.travelStyle || selectedMatch.travelStyles)}
                    </View>
                  </View>

                  {/* 🔹 지역 출력 */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>지역</Text>
                    <Text style={styles.infoTag3}>{renderLocation(selectedMatch)}</Text>
                  </View>
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
    width: 340,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'flex-start', // 왼쪽 정렬
    position: 'relative',
  },
  modalProfileImageUpdated: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    top: 12,
    right: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalDate: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: '#1E1E1E',
    fontWeight: '500',
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    
    justifyContent: 'flex-end',
    flex: 1,
    gap: 6,
  },
  infoTag1: {
    backgroundColor: '#ADB3DD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    left:-158
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
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    marginBottom: 6,
    marginLeft: 12,
  },
  infoTag: {
    backgroundColor: '#B3A4F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    marginBottom: 6,
  },
  infoTag2: {
    backgroundColor: '#F4F4FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    color: '#7E7E7E',
    minWidth: 60,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#D6C9DF',
    marginBottom: 6,
    marginLeft: 12,
  },
  infoTag3: {
    backgroundColor: '#B3A4F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    marginBottom: 6,
    marginLeft: 12,
  },
  chatButton: {
    backgroundColor: '#4F46E5',
    marginTop: 20,
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
