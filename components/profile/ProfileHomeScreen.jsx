// 📁 /components/profile/ProfileHomeScreen.jsx

import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ 토큰 제거용
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons'; // ✅ 뒤로가기 + 로그아웃 아이콘 공용 사용
import { UserContext } from '../../contexts/UserContext';

export default function ProfileHomeScreen({ route }) {
  const navigation = useNavigation();
  // const { user: contextUser, setUser } = useContext(UserContext);
  // const user = route?.params || contextUser; // 초기 화면전환 시 1회성 사용자 정보 반영
  const { user, setUser } = useContext(UserContext); // ✅ 항상 최신 상태의 사용자 정보 사용


  // ✅ 실제 로그아웃 처리
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear(); // 저장된 토큰 등 삭제 ( mock 포함)
      setUser(null);              // UserContext 초기화
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }], // LoginScreen으로 완전 초기화 이동
      });
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // ✅ 사용자에게 로그아웃 확인 알림
  const confirmLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', onPress: handleLogout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}   // HomeScreen.jsx로 이동
        >
          <MaterialIcons name="arrow-back-ios" size={20} color="#4F46E5" />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>프로필 홈</Text>

          {/* ✅ 로그아웃 버튼 (MaterialIcons 사용) */}
          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
            <MaterialIcons name="logout" size={22} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.headerLine} />

      {/* 본문 영역 */}
      <View style={styles.contentWrapper}>
        {/* 프로필 이미지 */}
        <View style={styles.imageContainer}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} /> // 사진은 profileImageUrl 일괄적용.
          ) : (
            <View style={styles.placeholderImage} />
          )}
        </View>

        {/* 정보 표시 */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRowWrapper}>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>닉네임</Text>
              <Text style={styles.label}>성별</Text>
              <Text style={styles.label}>나이</Text>
              <Text style={styles.label}>MBTI</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.value}>{user?.nickname || '-'}</Text>
              <Text style={styles.value}>
                {user?.gender === 'MALE' ? '남성' : user?.gender === 'FEMALE' ? '여성' : '-'}
                </Text>
              <Text style={styles.value}>{user?.age || '-'}</Text>
              <Text style={styles.value}>{user?.mbti || '-'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.footerWrapper}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile', user)} // EditProfileScreen.jsx로 이동
        >
          <Text style={styles.editButtonText}>프로필 편집</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 🔧 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    justifyContent: 'space-between',
    position: 'relative',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingLeft: 16,
  },
  backText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: '400',
    color: '#4F46E5',
    paddingLeft: 12,
  },
  headerTitleWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  logoutButton: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 4,
  },
  headerLine: {
    borderBottomWidth: 1,
    borderColor: '#999',
    marginTop: 1,
    marginBottom: 24,
  },
  contentWrapper: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 120,
    marginTop:30,
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 120,
    marginTop:30,
    backgroundColor: '#D1D5DB',
  },
  infoContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 24,
  },
  infoRowWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 40,
  },
  infoColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: '#7E7E7E',
    textAlign: 'center',
    maxWidth: 140,
  },
  value: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: '#1E1E1E',
    textAlign: 'center',
    maxWidth: 140,
  },
  footerWrapper: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  editButton: {
    marginTop: 32,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  editButtonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
  },
});
