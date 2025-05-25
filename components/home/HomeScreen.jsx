// 📁 components/home/HomeScreen.jsx (병합 버전)
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TravelSection from './TravelSection';
import SplashScreen from '../common/SplashScreen'; // 🔁 팀원 코드 병합


// (📌 임시 데이터)
const dummyTravelList = [
  // { id: 1, title: '경주 여행', period: '2025.04.20 ~ 2025.04.30', dDay: 'D-5', route: ['첨성대', '국밥'] },
  // { id: 2, title: '부산 여행', period: '2025.05.05 ~ 2025.05.07', dDay: 'D-20', route: ['광안리', '해운대'] }
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext); //  user 불러옴
  const nickname = user?.nickname || '사용자';
  const isLong = nickname.length > 4;

  const [showSplash, setShowSplash] = useState(false); //  팀원 기능: splash

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (e) {
      Alert.alert('로그아웃 실패', '다시 시도해주세요.');
    }
  };

  useEffect(() => {
    if (!user) navigation.replace('Login');
  }, [user]);

  return (
    <View style={styles.container}>
      {/* ✅ Splash 모달 */}
      <Modal visible={showSplash} transparent animationType="fade">
        <SplashScreen />
      </Modal>

      {/* 헤더 */}
      <View style={styles.headerWrapper}>
        <Text style={styles.logoText} numberOfLines={1} adjustsFontSizeToFit>moyeo </Text>
        {/*임시 로그아웃 */}
        <TouchableOpacity onPress={handleLogout}>
            <Feather name="log-out" size={24} color="#4B5563" />
          </TouchableOpacity>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileHome', user)}>
            {user?.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.headerLine} />

      {/* 사용자 인사말 */}
      <View style={styles.greetingWrapper}>
        {isLong ? (
          <>
            <Text style={styles.greetingText}>{nickname}님</Text>
            <Text style={styles.greetingText}>좋은 하루 보내세요</Text>
          </>
        ) : (
          <Text style={styles.greetingText}>{nickname}님 좋은 하루 보내세요</Text>
        )}
        <Text style={styles.subGreetingText}>오늘은 어디로 떠나고 싶으세요?</Text>
      </View>

      {/* 기능 카드 */}
      <View style={styles.featureRow}>
        <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('Planner')}>
          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E9CDFF' }]}>
              <MaterialIcons name="route" size={64} color="#533E92" />
            </View>
            <Text style={styles.featureTitle}>AI 여행 플랜 제작</Text>
            <Text style={styles.featureDesc}>나에게 맞춘 여행계획을 세워볼까요?</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureItem} onPress={() => navigation.navigate('Matching')}>
          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF1A8' }]}>
              <MaterialIcons name="person-outline" size={64} color="#928023" />
            </View>
            <Text style={styles.featureTitle}>여행 동행자 찾기</Text>
            <Text style={styles.featureDesc}>나와 함께할 동행자를 찾아볼까요?</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 여행 플랜 타이틀 */}
      <View style={styles.travelHeader}>
        <Text style={styles.travelTitle}>다가오는 여행</Text>
        {dummyTravelList.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Planner')}>
            <Text style={styles.travelViewAll}>여행 전체보기</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.travelDesc}>곧 떠날 여행 플랜</Text>

      {/* 여행 카드 리스트 */}
      {dummyTravelList.length > 1 ? (
        <ScrollView
          style={styles.travelScrollArea}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <TravelSection travelList={dummyTravelList} onPressCreate={() => navigation.navigate('Planner')} />
        </ScrollView>
      ) : (
        <View style={styles.travelScrollArea}>
          <TravelSection travelList={dummyTravelList} onPressCreate={() => navigation.navigate('Planner')} />
        </View>
      )}

      {/* ✅ 하단 우측 버튼 */}
      <View style={{ position: 'absolute', right: 20, bottom: 20, flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity style={styles.chatbotButton} onPress={() => console.log('챗봇 열기')}>
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.splashButton} onPress={() => setShowSplash(true)}>
          <Ionicons name="rocket-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
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
  logoText: {
    fontSize: 40,
    fontFamily: 'KaushanScript_400Regular',
    color: '#4F46E5',
    lineHeight: 80,
    letterSpacing: 0,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: 20,
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: 20,
    backgroundColor: '#D1D5DB',
  },
  headerLine: {
    borderBottomWidth: 1,
    borderColor: '#999',
    marginTop: 1,
  },
  greetingWrapper: {
    marginTop: 4,
  },
  greetingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 25,
    color: '#141414',
    letterSpacing: 0,
  },
  subGreetingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#999999',
    marginTop: 4,
    letterSpacing: 0,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  featureItem: {
    width: '48%',
    aspectRatio: 1,
    paddingHorizontal: 2,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#000000',
    marginTop: 4,
    letterSpacing: 0,
  },
  featureDesc: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#7E7E7E',
    textAlign: 'center',
    letterSpacing: -1,
  },
  travelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
  },
  travelTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 25,
    color: '#000000',
    letterSpacing: 0,
  },
  travelViewAll: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#4F46E5B2',
    letterSpacing: 0,
  },
  travelDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#999999',
    textAlign: 'left',
    marginTop: 8,
    marginBottom: 0,
    letterSpacing: 0,
  },
  travelScrollArea: {
    flex: 1,
    marginTop: 8,
  },
});
