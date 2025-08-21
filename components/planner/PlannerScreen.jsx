import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts } from 'expo-font';
import HeaderBar from '../../components/common/HeaderBar';

const matchingImage = require('../../assets/images/Planner_image.png');

// 현재 기기의 화면 너비 / 높이 가져오기
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 📐 클램핑 함수: 크기가 너무 작거나 커지지 않도록 제한
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function PlannerScreen() {
  const navigation = useNavigation();                 // 화면 전환 기능
  const { user } = useContext(UserContext);           // 사용자 정보 가져오기
  const [fontsLoaded] = useFonts({                    // 폰트 비동기 로드
    KaushanScript: KaushanScript_400Regular,
  });

  if (!fontsLoaded) return null;                      // 폰트 로딩되기 전까지 렌더 중지

  // ✅ 반응형 포인트 설정 (기기 비율 기반 + 최대/최소값 제한)
  const titleFontSize = clamp(SCREEN_HEIGHT * 0.033, 20, 32);       // 메인 제목 폰트
  const subtitleGap = clamp(SCREEN_HEIGHT * 0.0047, 2, 8);          // 서브제목 간격
  const descFontSize = clamp(SCREEN_HEIGHT * 0.0213, 14, 22);       // 설명문구 폰트
  const descGap = clamp(SCREEN_HEIGHT * 0.0166, 10, 24);            // 설명문구 간격
  const imageSize = clamp(SCREEN_WIDTH * 0.75, 200, 300);           // 일러스트 이미지 크기
  const buttonWidth = clamp(SCREEN_WIDTH * 0.9, 280, 360);          // 버튼 너비
  const buttonPadding = clamp(SCREEN_HEIGHT * 0.021, 14, 24);       // 버튼 상하 여백
  const buttonFontSize = clamp(SCREEN_HEIGHT * 0.0213, 14, 22);     // 버튼 글자 크기

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <HeaderBar />

      {/* Main 안내 문구 영역 */}
      <View style={styles.mainSection}>
        <Text style={[styles.title, { fontSize: titleFontSize }]}>
          일정만 입력하셔도
        </Text>
        <Text style={[styles.subtitle, { fontSize: titleFontSize, marginTop: subtitleGap }]}>
          여행 플랜 완성
        </Text>
        <Text style={[styles.desc, { fontSize: descFontSize, marginTop: descGap }]}>
          내 취향에 맞춘 여행 계획을 세워보세요
        </Text>
      </View>

      {/* 여행 이미지 일러스트 */}
      <View style={styles.illustrationWrapper}>
        <Image
          source={matchingImage}
          style={{
            width: imageSize,
            height: imageSize,
            borderRadius: imageSize / 2, // 원형 이미지로 만들기
          }}
          resizeMode="contain"
        />
      </View>

      {/* 하단 버튼 영역 */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: buttonWidth,
              paddingVertical: buttonPadding,
            },
          ]}
          onPress={() => navigation.navigate('PlannerInfo')} 
        >
          <Text style={[styles.buttonText, { fontSize: buttonFontSize }]}>
            여행 플랜 만들러 가기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // 전체 배경색
  },
  mainSection: {
    marginTop: SCREEN_HEIGHT * 0.06, // 상단 여백
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#1E1E1E',
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Inter_400Regular', // 커스텀 폰트
  },
  subtitle: {
    color: '#1E1E1E',
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  desc: {
    color: '#7E7E7E',
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  illustrationWrapper: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.06,    // 상단 여백
    marginBottom: SCREEN_HEIGHT * 0.028, // 하단 여백
  },
  bottomSection: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.04,     // 화면 하단에서 띄우기
    left: SCREEN_WIDTH * 0.041,       // 좌우 여백
    right: SCREEN_WIDTH * 0.041,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4F46E5',        // 버튼 색상
    paddingHorizontal: SCREEN_WIDTH * 0.051, // 좌우 패딩
    borderRadius: SCREEN_WIDTH * 0.025,      // 버튼 둥글게
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',                     // 버튼 글씨 흰색
  },
});