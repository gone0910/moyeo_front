// HomeScreen.jsx
// (원본 주석 유지) 
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
import HeaderBar from '../../components/common/HeaderBar';


// ==== 반응형 유틸 함수 (iPhone 13 기준) ====
// (원본 유지)
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
  const USE_MOCK = true; // ← 목 플로우면 true
  const [showSplash, setShowSplash] = useState(false);
  const [myTrips, setMyTrips] = useState([]); // 여행 플랜 리스트 관리
  

  useEffect(() => {
    if (!user) navigation.replace('Login');
  }, [user]);

  // 여행 플랜 불러오기 (마운트/포커스 시)
  useFocusEffect(
    React.useCallback(() => {
      const fetchTrips = async () => {
        try {
          const trips = await fetchPlanList(); // 여기서 AxiosInstance 사용하는지 확인
          setMyTrips(trips);
        } catch (err) {
          setMyTrips([]);
        }
      };
      fetchTrips();
    }, [])
  );

  useFocusEffect(
  React.useCallback(() => {
    const fetchTrips = async () => {
      try {
       if (USE_MOCK) {
         const raw = await AsyncStorage.getItem('MY_TRIPS');
         setMyTrips(raw ? JSON.parse(raw) : []);
         return;
       }
       const res = await fetchPlanList();
       // 서버가 페이지네이션이면 content 사용
       setMyTrips(Array.isArray(res) ? res : (res?.content ?? []));
      } catch (err) {
       // 서버 실패 시에도 로컬 폴백
       const raw = await AsyncStorage.getItem('MY_TRIPS');
       setMyTrips(raw ? JSON.parse(raw) : []);
      }
    };
    fetchTrips();
  }, [])
);

  return (
    <View style={styles.container}>
      {/* 상단바 챗봇 아이콘 추가 (로고/프로필 상단줄은 다른 컴포넌트일 수 있음) */}
      <HeaderBar showChatBot={true} />

      {/* 사용자 인사말 */}
      <View style={styles.greetingWrapper}>
      {/*
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
      */}

      {/* ✅ 항상 두 줄로 고정 */}
      <Text style={styles.greetingText}>{nickname}님</Text>
      <Text style={styles.greetingText}>좋은 하루 보내세요</Text>

      <Text style={styles.subGreetingText}>오늘은 어디로 떠나고 싶으세요?</Text>
    </View>

      {/* 기능 카드 - 시안: 하나의 큰 그룹 카드 안에 2타일 */}
      <View style={styles.featureGroup /* [NEW] 그룹 카드 컨테이너 */}>
        <View style={styles.featureRow}>
          <TouchableOpacity
            style={[styles.featureItem, styles.featureItemLeft /* [UPDATED] */]}
            onPress={() => navigation.navigate('Planner')}
          >
            <View style={styles.featureCard}>
              <View style={[styles.iconCircleSmall, { backgroundColor: '#E9CDFF' } /* [UPDATED] 44px 원 */]}>
                <MaterialIcons
                  name="route"
                  size={normalize(24)} // [UPDATED] 아이콘 시각적 축소
                  color="#533E92"
                />
              </View>
              <Text style={styles.featureTitle /* [UPDATED] 14/500 */}>AI 플랜 제작</Text>
              <Text style={styles.featureDesc /* [UPDATED] 12/400 */}>여행계획을 세워볼까요?</Text>
            </View>
          </TouchableOpacity>

          {/* [NEW] 중앙 얇은 세로 구분선 */}
          <View style={styles.featureDivider} />

          <TouchableOpacity
            style={[styles.featureItem, styles.featureItemRight /* [UPDATED] */]}
            onPress={() => navigation.navigate('Matching')}
          >
            <View style={styles.featureCard}>
              <View style={[styles.iconCircleSmall, { backgroundColor: '#FFF1A8' } /* [UPDATED] */]}>
                <MaterialIcons
                  name="person-outline"
                  size={normalize(24)}
                  color="#B28500" // [UPDATED] 스트로크 컬러 톤
                />
              </View>
              <Text style={styles.featureTitle}>동행자 찾기</Text>
              <Text style={styles.featureDesc}>동행자를 찾아볼까요?</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 여행 플랜 타이틀 */}
      <View style={styles.travelHeader}>
        <Text style={styles.travelTitle /* [UPDATED] 20/500 */}>다가오는 여행</Text>
        {/* ‘여행 전체보기’는 유지 (표시 로직/네비 동일) */}
        {myTrips.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('MyTrips')}>
            <Text style={styles.travelViewAll}>여행 전체보기</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.travelDesc /* [UPDATED] 14/400 */}>곧 떠날 여행 플랜을 만드세요</Text>

      {/* 여행 카드 리스트 (스크롤 정책은 기존 유지) */}
      {myTrips.length > 1 ? (
        <ScrollView
          style={styles.travelScrollArea}
          contentContainerStyle={{ paddingBottom: normalize(120, 'height') }}
          showsVerticalScrollIndicator={false}
        >
          <TravelSection
            travelList={myTrips}
            onPressCreate={() => navigation.navigate('Planner')}
            onPressCard={(scheduleId) => {
              navigation.navigate('PlannerResponse', { scheduleId, from: 'Home' });
            }}
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
  },
  greetingWrapper: {
    marginTop: normalize(16, 'height'),
    paddingHorizontal: normalize(20), // [UPDATED] 좌우 20 기준
  },
  greetingText: {
    fontSize: normalize(24),
    fontWeight: '500', // [UPDATED] Pretendard Medium 대응
    color: '#141414',
    lineHeight: normalize(33.6, 'height'), // [UPDATED] 140%
    letterSpacing: normalize(-0.6), // [UPDATED] -2.5%
  },
  subGreetingText: {
    // [UPDATED] 14/400, color #767676
    fontFamily: 'Inter_400Regular',
    fontSize: normalize(14),
    color: '#767676',
    marginTop: normalize(6, 'height'),
    letterSpacing: normalize(-0.35),
  },

  // ===== 기능 그룹 카드 =====
  featureGroup: {
    // [NEW] 시안: 하나의 큰 카드 (335x155, radius 16, 약한 shadow)
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(16),
    marginTop: normalize(16, 'height'),
    marginHorizontal: normalize(20),
    paddingVertical: normalize(8, 'height'),
    // 부드러운 그림자
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: normalize(8),
    shadowOffset: { width: 0, height: normalize(4, 'height') },
    elevation: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '50%',
    paddingVertical: normalize(8, 'height'),
  },
  featureItemLeft: { paddingRight: normalize(8) },
  featureItemRight: { paddingLeft: normalize(8) },
  featureDivider: {
    // [NEW] 중앙 세로 구분선 (#F1F1F5)
    position: 'absolute',
    left: '50%',
    top: normalize(8, 'height'),
    bottom: normalize(8, 'height'),
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F1F5',
    transform: [{ translateX: -StyleSheet.hairlineWidth / 2 }],
  },
  featureCard: {
    // 기존 구조 유지(아이콘/타이틀/설명)
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(16),
    alignItems: 'flex-start', // [UPDATED] 좌측 정렬
    justifyContent: 'flex-start',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12, 'height'),
  },
  // [UPDATED] 아이콘 원 44px
  iconCircleSmall: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(100),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(12, 'height'),
  },
  featureTitle: {
    // [UPDATED] 14/500, color #111111
    fontSize: normalize(14),
    fontFamily: 'Inter_600SemiBold',
    color: '#111111',
    letterSpacing: normalize(-0.35),
  },
  featureDesc: {
    // [UPDATED] 12/400, color #767676
    fontSize: normalize(12),
    fontFamily: 'Inter_400Regular',
    color: '#767676',
    letterSpacing: normalize(-0.3),
    marginTop: normalize(2, 'height'),
  },

  // ===== 섹션 헤더 =====
  travelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalize(24, 'height'),
    paddingHorizontal: normalize(20), // [UPDATED]
  },
  travelTitle: {
    // [UPDATED] 20/500
    fontFamily: 'Inter_600SemiBold',
    fontSize: normalize(20),
    color: '#141414',
    letterSpacing: normalize(-0.5),
  },
  travelViewAll: {
    fontFamily: 'Inter_400Regular',
    fontSize: normalize(14),
    color: '#4F46E5B2',
  },
  travelDesc: {
    // [UPDATED] 14/400
    paddingHorizontal: normalize(20),
    fontSize: normalize(14),
    fontFamily: 'Inter_400Regular',
    color: '#767676',
    marginTop: normalize(6, 'height'),
    marginBottom: normalize(6, 'height'),
    letterSpacing: normalize(-0.35),
  },

  travelScrollArea: {
    flex: 1,
    marginTop: normalize(8, 'height'),
  },

  // (기타 스타일 원본 유지)
  chatbotButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
  },
  splashButton: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(24),
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  profileContainer: {
    // 기존 구조 유지
  },
});