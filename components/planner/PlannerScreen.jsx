import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, PixelRatio } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts } from 'expo-font';
import HeaderBar from '../../components/common/HeaderBar';

const PlanImage = require('../../assets/images/Plan_image_new.png');

// 현재 기기의 화면 너비 / 높이 가져오기
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontWeight:500,
    marginTop: normalize(36, 'height'),
    marginBottom: normalize(6),
    lineHeight: normalize(34, 'height'),
  },
  desc: {
    fontSize: normalize(17.5),
    fontWeight:400,
    color: '#6B7280',
    textAlign: 'center',
  },
  PlanImage: {
      width: normalize(264.5),              
      height: normalize(327.5, 'height'),
      borderRadius: normalize(16),
      marginTop: normalize(22, 'height'),
    },
  illustrationWrapper: {
    alignItems: 'center',
    alignItems: 'center',
    // 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  },
});