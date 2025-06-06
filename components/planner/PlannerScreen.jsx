import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts } from 'expo-font';
import { RFValue } from 'react-native-responsive-fontsize';

const matchingImage = require('../../assets/images/Planner_image.png');

// 기준 width (iPhone 13)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scale = SCREEN_WIDTH / BASE_WIDTH;

function normalize(size) {
  // 폰트, 마진 등 크기 보정
  return Math.round(RFValue(size, BASE_HEIGHT));
}

export default function PlannerScreen() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [fontsLoaded] = useFonts({ KaushanScript: KaushanScript_400Regular });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <Text
          style={[
            styles.logotext,
            { fontSize: normalize(36), fontFamily: 'KaushanScript' }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          moyeo
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileHome', user)}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.headerLine} />

      {/* Main 안내 문구 */}
      <View style={styles.mainSection}>
      <Text style={[styles.title, { fontSize: normalize(28) }]}>
          일정만 입력하셔도
        </Text>
        <Text style={[styles.subtitle, { fontSize: normalize(28), marginTop: normalize(4) }]}>
          여행 플랜 완성
        </Text>
        <Text style={[styles.desc, { fontSize: normalize(18), marginTop: normalize(14) }]}>
          내 취향에 맞춘 여행 계획을 세워보세요
        </Text>
      </View>

      {/* 일러스트 이미지 */}
      <View style={styles.illustrationWrapper}>
        <Image
          source={matchingImage}
          style={{
            width: SCREEN_WIDTH * 0.8,
            height: SCREEN_WIDTH * 0.8,
            borderRadius: SCREEN_WIDTH * 0.4,
          }}
          resizeMode="contain"
        />
      </View>

      {/* 버튼 */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.button, { width: SCREEN_WIDTH * 0.9, paddingVertical: normalize(18) }]}
          onPress={() => navigation.navigate('PlannerInfo')}
        >
          <Text style={[styles.buttonText, { fontSize: normalize(18) }]}>
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
    backgroundColor: '#FAFAFA',
    paddingTop: Platform.OS === 'ios' ? 48 : 28,
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 4,
  },
  logotext: {
    color: '#4F46E5',
    // fontFamily, fontSize는 인라인에서 반응형 처리
    letterSpacing: 0,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEE',
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1D5DB',
  },
  headerLine: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginTop: 6,
    marginBottom: 0,
    marginHorizontal: 10,
  },
  mainSection: {
    marginTop: normalize(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#1E1E1E',
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
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
    marginTop: 0,
  },
  illustrationWrapper: {
    alignItems: 'center',
    marginTop: normalize(50),
    marginBottom: normalize(24),
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: normalize(25),
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // width/padding은 인라인에서 반응형 적용
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    // fontSize는 인라인에서 반응형 적용
  },
});
