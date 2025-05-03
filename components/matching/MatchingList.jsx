import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function MatchingList() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [fontsLoaded] = useFonts({ KaushanScript: KaushanScript_400Regular });
  const [selectedMatch, setSelectedMatch] = useState(null);

  if (!fontsLoaded) return null;

  const matches = [
    {
      name: '김모여',
      date: '2025/4/20 ~ 2025/5/3',
      tags: ['#액티비티', '#문화/관광', '#맛집'],
      image: 'https://via.placeholder.com/60x60.png?text=1',
      gender: '남성',
      travelStyle: ['액티비티', '문화/관광', '맛집'],
      destination: '충북/청주시',
      mbti: '선택안함',
    },
    {
      name: '신세휘',
      date: '2025/4/20 ~ 2025/5/3',
      tags: ['#액티비티', '#문화/관광', '#맛집'],
      image: 'https://via.placeholder.com/60x60.png?text=2',
      gender: '남성',
      travelStyle: ['액티비티', '문화/관광'],
      destination: '충북/청주시',
      mbti: '선택안함',
    },
    {
      name: '김신록',
      date: '2025/4/20 ~ 2025/5/3',
      tags: ['#액티비티'],
      image: 'https://via.placeholder.com/60x60.png?text=2',
      gender: '남성',
      travelStyle: ['액티비티'],
      destination: '충북/청주시',
      mbti: '선택안함',
    },
    {
      name: '구교환',
      date: '2025/4/20 ~ 2025/5/3',
      tags: ['#액티비티', '#문화/관광'],
      image: 'https://via.placeholder.com/60x60.png?text=2',
      gender: '남성',
      travelStyle: ['액티비티', '문화/관광'],
      destination: '충북/청주시',
      mbti: '선택안함',
    },
    {
      name: '김모여',
      date: '2025/4/20 ~ 2025/5/3',
      tags: ['#액티비티', '#문화/관광'],
      image: 'https://via.placeholder.com/60x60.png?text=2',
      gender: '남성',
      travelStyle: ['액티비티', '문화/관광'],
      destination: '충북/청주시',
      mbti: '선택안함',
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerWrapper}>
        <Text style={styles.logo} numberOfLines={1} adjustsFontSizeToFit>moyeo </Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileHome', user)}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: 100 }}>
          <View style={{ backgroundColor: '#CECCF5', padding: 16, borderRadius: 12, marginBottom: 26 }}>
            <Text style={{ color: '#616161', fontSize: 16, textAlign: 'center' }}>나와 여행 스타일이 유사한 사용자들이에요</Text>
            <Text style={{ color: '#616161', fontSize: 16, textAlign: 'center', top: 5 }}>함께 여행갈 사람을 찾아볼까요?</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity /*로켓 모양 누르면 MatchingList로 돌아감*/
            style={styles.NoneListButton}
            onPress={() => navigation.navigate('NoneList')}
            >
          <Ionicons name="rocket-outline" size={24} color="white" />
          </TouchableOpacity>
          </View>

          {matches.map((item, index) => (
            <TouchableOpacity key={index} onPress={() => setSelectedMatch(item)}>
              <View style={styles.matchBox}>
                <Image source={{ uri: item.image }} style={styles.matchImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchName}>{item.name}</Text>
                  <Text style={styles.matchDate}>{item.date}</Text>
                  <View style={styles.tagsContainer}>
                    {item.tags.map((tag, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ✅ Modal for Match Details */}
      <Modal visible={!!selectedMatch} transparent animationType="fade" onRequestClose={() => setSelectedMatch(null)}>
  <BlurView intensity={60} tint="DARK" style={StyleSheet.absoluteFill}>
    <View style={styles.modalCenter}>
      <View style={styles.modalBoxUpdated}>
        {selectedMatch && (
          <>
            <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setSelectedMatch(null)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Image source={{ uri: selectedMatch.image }} style={styles.modalProfileImageUpdated} />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.modalUserName}>{selectedMatch.name}</Text>
                <Text style={styles.modalDate}>{selectedMatch.date}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>성별</Text>
              <Text style={styles.infoTag1}>{selectedMatch.gender}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>여행 성향</Text>
              <View style={styles.tagGroup}>
                {selectedMatch.travelStyle.map((style, idx) => (
                  <Text key={idx} style={styles.infoTag2}>{style}</Text>
                ))}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>목적지</Text>
              <Text style={styles.infoTag3}>{selectedMatch.destination}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>MBTI</Text>
              <Text style={styles.infoTag4}>{selectedMatch.mbti}</Text>
            </View>

            <TouchableOpacity style={styles.chatButton}>
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
}

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
  logo: {
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
  divider: {
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
    fontSize: 18,
    fontWeight: '600',
  },
  modalDate: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 18,
    color: '#1E1E1E',
    marginBottom: 20,
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoTag1: { 
    backgroundColor: '#E1D8FD', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginRight:-10, 
    marginBottom: 16, 
    marginLeft:52
  },
  infoTag2: { 
    backgroundColor: '#E1D8FD', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginRight:-10, 
    marginBottom: 20, 
    marginLeft:20
  },
  infoTag3: { 
    backgroundColor: '#E1D8FD', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginRight:-10, 
    marginBottom: 18, 
    marginLeft:38
  },
  infoTag4: { 
    backgroundColor: '#E1D8FD', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginRight:-10, 
    marginBottom: 18, 
    marginLeft:42
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
