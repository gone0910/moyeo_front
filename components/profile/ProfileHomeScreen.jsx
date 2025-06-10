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
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserContext } from '../../contexts/UserContext';

// ==== 반응형 유틸 함수 ====
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

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      setUser(null);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
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

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        {/* 상단 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back-ios" size={normalize(22)} color="#5347EA" style={{ marginBottom: normalize(-10) }}/>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>프로필 홈</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
            <MaterialIcons name="logout" size={normalize(22)} color="#5347EA" style={{ marginBottom: normalize(-10) }}/>
          </TouchableOpacity>
        </View>
        <View style={styles.headerLine} />

        {/* 본문 영역 */}
        <View style={styles.contentWrapper}>
          {/* 프로필 이미지 */}
          <View style={styles.imageContainer}>
            {user?.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
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
                  {user?.gender === 'MALE'
                    ? '남성'
                    : user?.gender === 'FEMALE'
                    ? '여성'
                    : '-'}
                </Text>
                <Text style={[styles.value, styles.boldValue]}>
                  {user?.age ? String(user.age) : '-'}
                </Text>
                <Text style={[styles.value, styles.boldValue]}>
                  {user?.mbti || '-'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 하단 버튼 */}
        <View style={styles.footerWrapper}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile', user)}
          >
            <Text style={styles.editButtonText}>프로필 편집</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ======= 반응형 스타일 =======
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingHorizontal: normalize(14),
    paddingTop: normalize(18, 'height'),
    borderRadius: normalize(24),
    margin: normalize(10),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: normalize(80, 'height'),
    justifyContent: 'space-between',
    position: 'relative',
    paddingHorizontal: normalize(2),
    marginBottom: normalize(-25, 'height'),
  },
  backButton: {
    padding: normalize(3),
    paddingLeft: normalize(2),
    zIndex: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: normalize(16),
    marginBottom: normalize(-10, 'height'),
    fontWeight: '400',
    color: '#000000',
    letterSpacing: -0.2,
    zIndex: 1,
  },
  logoutButton: {
    padding: normalize(3),
    zIndex: 2,
  },
  headerLine: {
    height: 1,
    backgroundColor: '#B5B5B5',
    marginTop: 12,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: normalize(18, 'height'),
    marginTop: normalize(70, 'height'),
  },
  profileImage: {
    width: normalize(200),
    height: normalize(200),
    borderRadius: normalize(100),
    backgroundColor: '#E5E7EB',
  },
  placeholderImage: {
    width: normalize(200),
    height: normalize(200),
    borderRadius: normalize(100),
    backgroundColor: '#D1D5DB',
  },
  infoContainer: {
    marginTop: normalize(70, 'height'),
    marginBottom: normalize(8, 'height'),
    width: '100%',
  },
  infoRowWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    columnGap: normalize(36),
  },
  infoColumn: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    rowGap: normalize(40, 'height'),
  },
  label: {
    fontFamily: 'System',
    fontSize: normalize(18),
    fontWeight: '700',
    color: '#1E1E1E',
    textAlign: 'left',
    minWidth: normalize(60),
    marginBottom: 0,
    marginRight: normalize(20),
  },
  value: {
    fontFamily: 'System',
    fontSize: normalize(18),
    fontWeight: '400',
    color: '#1E1E1E',
    textAlign: 'left',
    minWidth: normalize(60),
    marginTop: normalize(0),
    marginLeft: normalize(30),
  },
  boldValue: {
    fontFamily: 'System',
    fontSize: normalize(18),
    fontWeight: '400',
    color: '#1E1E1E',
    textAlign: 'left',
    minWidth: normalize(60),
    marginTop: normalize(-2),
    marginLeft: normalize(30),
    
  },
  footerWrapper: {
    paddingBottom: normalize(15, 'height'),
    paddingTop: normalize(10, 'height'),
    paddingHorizontal: normalize(0),
  },
  editButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: normalize(18, 'height'),
    borderRadius: normalize(8),
    alignItems: 'center',
    marginTop: normalize(30, 'height'),
    marginBottom: normalize(24, 'height'),
  },
  editButtonText: {
    fontFamily: 'System',
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
