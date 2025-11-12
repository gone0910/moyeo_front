// ProfileHomeScreen.jsx
import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  PixelRatio,
  Platform,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { UserContext } from '../../contexts/UserContext';
import { logoutUser } from '../../api/AuthApi';


// ==== 반응형 유틸 함수 (보존) ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390; // iPhone 13 기준
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}


export default function ProfileHomeScreen({ route }) {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);

  // 로그아웃 처리 (기능 보존)
  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: 'Login' }],
      // });
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };


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

  // 표시 데이터 (기능 보존)
  const infoItems = [
    { label: '닉네임', value: user?.nickname || '-' },
    { label: '성별', value: user?.gender === 'MALE' ? '남성' : user?.gender === 'FEMALE' ? '여성' : '-' },
    { label: '나이',   value: user?.age ? String(user.age) : '-' },
    { label: 'MBTI',  value: user?.mbti || '-' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* === 상단 헤더 (수정 제외) === */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="뒤로가기"
        >
          <Ionicons name="chevron-back" size={normalize(24)} color="#111111" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>프로필 홈</Text>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={confirmLogout}
          accessibilityLabel="로그아웃"
        >
          <MaterialIcons name="logout" size={normalize(27)} color="#F97575" />
        </TouchableOpacity>
      </View>

      {/* === 본문 영역 === */}
      <View style={styles.container}>
        {/* 프로필 이미지 (수정 제외) */}
        <View style={styles.imageContainer}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage} />
          )}
        </View>

        {/* 정보 표시 (수정 제외) */}
        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            {infoItems.map((item, idx) => (
              <View key={idx} style={styles.infoRow}>
                <View style={styles.labelBox}>
                  <Text style={styles.labelText}>{item.label}</Text>
                </View>
                <View style={styles.valueBox}>
                  <Text style={styles.valueText}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* === 하단 버튼 (EditProfileScreen.jsx 기준으로 수정) === */}
        <View style={styles.footerWrapper}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile', user)}
          >
            <Text style={styles.editButtonText}>프로필 편집</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}


// ======= 반응형 스타일 =======
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // [MODIFIED] container: EditProfileScreen.jsx의 formArea, scrollContent 참조
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: normalize(32), 
    paddingTop: normalize(18, 'height'),
    // [MODIFY] 버튼 높이(56) + 하단 여백(24) 만큼 공간 확보
    paddingBottom: normalize(56 + 24, 'height'), 
  },

  /** =========================
   * 헤더 (수정 제외)
   * ========================= */
  headerBar: {
    height: normalize(56, 'height'),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
  },
  backButton: {
    width: normalize(24),
    height: normalize(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: '500',
    color: '#111111',
    letterSpacing: -0.3,
    marginLeft: normalize(8),
  },
  logoutButton: {
    width: normalize(27),
    height: normalize(27),
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** =========================
   * 프로필 이미지 (수정 제외)
   * ========================= */
  imageContainer: {
    alignItems: 'center',
    marginBottom: normalize(34, 'height'), 
    marginTop: normalize(40, 'height'),
  },
  profileImage: {
    width: normalize(110),
    height: normalize(110),
    borderRadius: normalize(55),
    backgroundColor: '#E5E7EB',
  },
  placeholderImage: {
    width: normalize(110),
    height: normalize(110),
    borderRadius: normalize(55),
    backgroundColor: '#D1D5DB',
  },

  /** =========================
   * 정보 영역 (수정 제외)
   * ========================= */
  infoContainer: {
    marginTop: 0, 
    marginBottom: normalize(8, 'height'),
    width: '100%',
  },
  infoBox: {
    width: '100%',
    paddingHorizontal: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: normalize(58, 'height'),
    backgroundColor: '#F0F0FE',
    borderRadius: normalize(12),
    padding: normalize(4),
    gap: normalize(1),
    marginBottom: normalize(16),
  },
  labelBox: {
    width: normalize(105),
    height: normalize(50, 'height'),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: normalize(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueBox: {
    flex: 1,
    height: normalize(50, 'height'),
    borderRadius: normalize(8),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(16),
  },
  labelText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#4F46E5',
    letterSpacing: -0.4,
  },
  valueText: {
    fontSize: normalize(16),
    fontWeight: '400',
    color: '#111111',
    letterSpacing: -0.4,
    textAlign: 'center',
  },

  /** =========================
   * 하단 버튼
   * ========================= */

  footerWrapper: {
    // [DELETE] marginTop: normalize(76, 'height'), // <-- 삭제
    position: 'absolute',
    bottom: normalize(45, 'height'),
    left: normalize(32),
    right: normalize(32),
  },
  editButton: {
    marginHorizontal: normalize(-10),
    height: normalize(56, 'height'), 
    borderRadius: normalize(12),
    backgroundColor: '#4F46E5', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: normalize(20), 
    fontWeight: '600', 
    letterSpacing: -0.2, 
  },
});