import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  PixelRatio,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TravelSection from './TravelSection';
import SplashScreen from '../common/SplashScreen';
import { fetchPlanList } from '../../api/MyPlanner_fetch_list'; // <-- 실제 플랜 목록 fetch
import { useFocusEffect } from '@react-navigation/native';

// ==== 반응형 유틸 함수 (iPhone 13 기준) ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale =
    based === 'height'
      ? SCREEN_HEIGHT / BASE_HEIGHT
      : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);
  const nickname = user?.nickname || '사용자';
  const isLong = nickname.length > 4;

  const [showSplash, setShowSplash] = useState(false);
  const [myTrips, setMyTrips] = useState([]); // 여행 플랜 리스트 관리

  useEffect(() => {
    if (!user) navigation.replace('Login');
  }, [user]);

  // 여행 플랜 불러오기 (마운트 시 한 번)
  useFocusEffect(
    React.useCallback(() => {
      const fetchTrips = async () => {
        try {
          const trips = await fetchPlanList();
          setMyTrips(trips);
        } catch (err) {
          setMyTrips([]);
        }
      };
      fetchTrips();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* ✅ Splash 모달 */}
      <Modal visible={showSplash} transparent animationType="fade">
        <SplashScreen />
      </Modal>

      {/* 헤더 */}
      <View style={styles.headerWrapper}>
        <Text style={styles.logoText} numberOfLines={1} adjustsFontSizeToFit>
          moyeo{' '}
        </Text>
        {/*임시 로그아웃 + 임시 챗봇 */}
        <TouchableOpacity
          style={{ marginRight: normalize(1) }}
          onPress={() => navigation.navigate('ChatBot')}
        >
          <MaterialIcons name="smart-toy" size={normalize(24)} color="#4F46E5" />
        </TouchableOpacity>
        <View style={styles.profileContainer} />
        <View style={styles.profileContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileHome', user)}
          >
            {user?.profileImageUrl ? (
              <Image
                source={{ uri: user.profileImageUrl }}
                style={styles.profileImage}
              />
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
          <Text style={styles.greetingText}>
            {nickname}님 좋은 하루 보내세요
          </Text>
        )}
        <Text style={styles.subGreetingText}>오늘은 어디로 떠나고 싶으세요?</Text>
      </View>

      {/* 기능 카드 */}
      <View style={styles.featureRow}>
        <TouchableOpacity
          style={styles.featureItem}
          onPress={() => navigation.navigate('Planner')}
        >
          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E9CDFF' }]}>
              <MaterialIcons
                name="route"
                size={normalize(64)}
                color="#533E92"
              />
            </View>
            <Text style={styles.featureTitle}>AI 여행 플랜 제작</Text>
            <Text style={styles.featureDesc}>
              나에게 맞춘 여행계획을 세워볼까요?
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureItem}
          onPress={() => navigation.navigate('Matching')}
        >
          <View style={styles.featureCard}>
            <View style={[styles.iconCircle, { backgroundColor: 
              '#FFF1A8' }]}>
              <MaterialIcons
                name="person-outline"
                size={normalize(64)}
                color="#928023"
              />
            </View>
            <Text style={styles.featureTitle}>여행 동행자 찾기</Text>
            <Text style={styles.featureDesc}>
              나와 함께할 동행자를 찾아볼까요?
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 여행 플랜 타이틀 */}
      <View style={styles.travelHeader}>
        <Text style={styles.travelTitle}>다가오는 여행</Text>
        {myTrips.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('MyTrips')}>
            <Text style={styles.travelViewAll}>여행 전체보기</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.travelDesc}>곧 떠날 여행 플랜</Text>

      {/* 여행 카드 리스트 */}
      {myTrips.length > 1 ? (
        <ScrollView
          style={styles.travelScrollArea}
          contentContainerStyle={{ paddingBottom: normalize(120, 'height') }}
          showsVerticalScrollIndicator={false}
        >
          <TravelSection
            travelList={myTrips}
            onPressCreate={() => navigation.navigate('Planner')}
          />
        </ScrollView>
      ) : (
        <View style={styles.travelScrollArea}>
          <TravelSection
  travelList={Array.isArray(myTrips) ? myTrips : []}
  onPressCreate={() => navigation.navigate('Planner')}
/>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: normalize(16),
    paddingTop: normalize(24, 'height'),
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: normalize(40),
    fontFamily: 'KaushanScript_400Regular',
    color: '#4F46E5',
    lineHeight: normalize(80, 'height'),
    letterSpacing: normalize(0),
  },
  profileImage: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    marginTop: normalize(20, 'height'),
  },
  profilePlaceholder: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    marginTop: normalize(20, 'height'),
    backgroundColor: '#D1D5DB',
  },
  headerLine: {
    borderBottomWidth: normalize(1, 'height'),
    borderColor: '#999',
    marginTop: normalize(1, 'height'),
  },
  greetingWrapper: {
    marginTop: normalize(4, 'height'),
  },
  greetingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: normalize(25),
    color: '#141414',
    letterSpacing: normalize(0),
  },
  subGreetingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: normalize(15),
    color: '#999999',
    marginTop: normalize(4, 'height'),
    letterSpacing: normalize(0),
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: normalize(24, 'height'),
  },
  featureItem: {
    width: '48%',
    aspectRatio: 1,
    paddingHorizontal: normalize(2),
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(24),
    paddingTop: normalize(16, 'height'),
    paddingBottom: normalize(16, 'height'),
    paddingHorizontal: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconCircle: {
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(8, 'height'),
  },
  featureTitle: {
    fontSize: normalize(15),
    fontFamily: 'Inter_400Regular',
    color: '#000000',
    marginTop: normalize(4, 'height'),
    letterSpacing: normalize(0),
  },
  featureDesc: {
    fontSize: normalize(10),
    fontFamily: 'Inter_400Regular',
    color: '#7E7E7E',
    textAlign: 'center',
    letterSpacing: normalize(-1),
  },
  travelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(32, 'height'),
  },
  travelTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: normalize(25),
    color: '#000000',
    letterSpacing: normalize(0),
  },
  travelViewAll: {
    fontFamily: 'Inter_400Regular',
    fontSize: normalize(15),
    color: '#4F46E5B2',
    letterSpacing: normalize(0),
  },
  travelDesc: {
    fontSize: normalize(12),
    fontFamily: 'Inter_400Regular',
    color: '#999999',
    textAlign: 'left',
    marginTop: normalize(8, 'height'),
    marginBottom: normalize(0),
    letterSpacing: normalize(0),
  },
  travelScrollArea: {
    flex: 1,
    marginTop: normalize(8, 'height'),
  },
  chatbotButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
  },
  splashButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  profileContainer: {
    // 기존 구조 유지
  },
});
