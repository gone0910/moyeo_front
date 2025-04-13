// 테스트용 주석.

import { View, Text, TouchableOpacity, Image, Alert, Modal, StyleSheet } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '../common/SplashScreen';

/**
 * 홈 화면 (메인)
 */
export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);
  const [showSplash, setShowSplash] = useState(false); // ✅ 스플래시 표시 여부

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (e) {
      Alert.alert('로그아웃 실패', '다시 시도해주세요.');
    }
  };

  useEffect(() => {
    if (!user) {
      navigation.replace('Login');
    }
  }, [user]);

  return (
    <View style={styles.container}> {/* 배경색 (전체 앱 테마 컬러 적용 가능) */}
      <Modal visible={showSplash} transparent animationType="fade">
        <SplashScreen />
      </Modal>

      {/* 상단 헤더 (탭바 컬러 적용 대상) */}
      <View style={styles.headerWrapper}> 
        <Text style={styles.logo}>moyeo</Text>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile', user)}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout}>
            <Feather name="log-out" size={28} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 기능 버튼 */}
      <View style={styles.featureRow}>
        <View style={styles.featureItem}>
          <View style={styles.featureBox}>
            <MaterialIcons name="people-outline" size={36} color="#4B5563" />
          </View>
          <Text style={styles.featureLabel}>여행자 매칭</Text>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureBox}>
            <Ionicons name="map-outline" size={36} color="#4B5563" />
          </View>
          <Text style={styles.featureLabel}>여행 플랜 생성</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ borderBottomWidth: 1, borderColor: '#E5E7EB', marginHorizontal: 24, marginTop: 24, marginBottom: 12 }} />

      {/* 내 여행 카드 */}
      <View style={styles.cardWrapper}>
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>내 여행</Text>
          <Text style={styles.cardLocation}>인천 여행</Text>
          <Text style={styles.cardDate}>2025. 4.4 ~ 4.5</Text>
          <Text style={styles.cardDday}>D-3</Text>
        </View>
      </View>

      {/* 하단 우측 고정 버튼 그룹 */}
      {/* 하단 우측 고정 버튼 그룹 (위치 내리기: 기존 80 → 60) */}
      <View style={{ position: 'absolute', right: 20, bottom: 60, flexDirection: 'row', gap: 12 }}>
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
    backgroundColor: '#FDF6EC', // 앱 배경색 (2번 테마도 동일: 크림)
  },
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FDF6EC', // 상단 헤더 배경색 (2번 테마도 동일: 크림)
  },
  logo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000000', // 2번 테마: 검정색
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1D5DB',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 48,
    paddingHorizontal: 24,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureBox: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: '#000000', // 2번 테마: 검정색
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#014421', // 1번 테마: 진녹색
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  cardBox: {
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#111827',
  },
  cardDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardDday: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    color: '#EF4444',
  },
  chatbotButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#014421', // 1번 테마: 진녹색
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#014421', // 1번 테마: 진녹색
    justifyContent: 'center',
    alignItems: 'center',
  },
});
