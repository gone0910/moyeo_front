// 📁 /components/matching/MatchingScreen.jsx
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, PixelRatio, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts } from 'expo-font';
import HeaderBar from '../../components/common/HeaderBar';

const matchingImage = require('../../assets/images/match_image.jpg');

// ==== 반응형 유틸 함수 (iPhone 13 기준) ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height'
    ? SCREEN_HEIGHT / BASE_HEIGHT
    : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

export default function MatchingScreen() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [fontsLoaded] = useFonts({ KaushanScript: KaushanScript_400Regular });

  if (!fontsLoaded) {
    return null; // Avoid rendering until fonts are loaded
  }

  return (
    <View style={styles.container}>
    <HeaderBar/>

      {/* Main Section */}
      <View style={styles.centerWrapper}>
        <Text style={styles.title}>
  여행을 함께할 <Text style={{ color: '#4F46E5' }}>동행자</Text>를 찾아보세요
</Text>
  <Text style={styles.titletext}>자신과 일정이 같으며 목적지, 여행성향이</Text>
  <Text style={styles.titletext2}>비슷한 여행자를 찾아 보실 수 있어요</Text>

  {/* ✅ 그 다음 이미지 */}
  <Image source={matchingImage} style={styles.matchingImage} />

        {/* New Container Bar Section */}
        <View style={styles.containerBar}>
          <Text style={styles.containerBarText}>동행자 찾기</Text>
          <TouchableOpacity
            style={styles.containerBarButton}
            // 후에 변경 필요
            onPress={() => navigation.navigate('MatchingInfo')}
          >
            <Text style={styles.containerBarButtonText}>동행자 찾기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: normalize(40),
    fontFamily: 'KaushanScript',
    color: '#4F46E5',
    lineHeight: normalize(80, 'height'),
    letterSpacing: normalize(0),
  },
  profileImage: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    marginTop: normalize(22, 'height'),
    top: normalize(-5, 'height'),
  },
  profilePlaceholder: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    top: normalize(5, 'height'),
    backgroundColor: '#D1D5DB',
  },
  headerLine: {
    height: normalize(1, 'height'),
    backgroundColor: '#999',
    marginVertical: normalize(8, 'height'),
    top: normalize(-10, 'height'),
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchingImage: {
  width: normalize(360),
  height: normalize(400, 'height'),
  marginBottom: normalize(-40, 'height'),
  borderRadius: normalize(16),
  marginTop: normalize(25, 'height'), // 너무 크면 줄이기
},
title: {
  fontSize: normalize(24),
  color: '#000000',
  textAlign: 'center',
  fontFamily: 'Inter_400Regular',
  marginTop: normalize(40, 'height'), // 🔄 정상 위치에서 시작
},
titletext: {
  fontSize: normalize(18),
  marginTop: normalize(12, 'height'),
  color: '#999999',
  textAlign: 'center',
  fontFamily: 'Inter_400Regular',
},
titletext2: {
  fontSize: normalize(18),
  top: normalize(2, 'height'), // 🔄 top 제거 후 자연스러운 간격
  color: '#999999',
  textAlign: 'center',
  fontFamily: 'Inter_400Regular',
},
  containerBar: {
    width: '100%',
    padding: normalize(16),
    backgroundColor: '#FAFAFA',
    borderRadius: normalize(16),
    marginTop: normalize(40, 'height'),
    alignItems: 'center',
  },
  containerBarText: {
    fontSize: normalize(20),
    color: '#FAFAFA',
    marginBottom: normalize(10, 'height'),
  },
  containerBarButton: {
  backgroundColor: '#4F46E5',
  paddingVertical: normalize(18, 'height'),
  paddingHorizontal: normalize(22),
  borderRadius: normalize(10),
  alignItems: 'center',
  width: '100%',
 top: normalize(-8, 'height'),
  marginLeft: 0,
},
  containerBarButtonText: {
    color: '#FFFFFF',
    fontSize: normalize(18),
  },
});
