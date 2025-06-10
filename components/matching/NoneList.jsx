import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, PixelRatio, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

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

export default function NoneList() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [fontsLoaded] = useFonts({ KaushanScript: KaushanScript_400Regular });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerWrapper}>
        <Text style={styles.logoText} numberOfLines={1} adjustsFontSizeToFit>moyeo </Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileHome', user)}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.headerLine} />
      {/* 아래에 ScrollView 등으로 리스트를 추가할 수 있습니다 */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* 매칭 리스트 아이템들 예시 */}
        <Text style={styles.NoneListText1}>
          같이 떠날 수 있는 여행자가 없어요
        </Text>
        <Text style={styles.NoneListText2}>
          동행자 정보를 수정하시는 걸 추천드려요
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity /*로켓 모양 누르면 MatchingList로 돌아감*/
            style={styles.MachingListButton}
            onPress={() => navigation.navigate('MatchingList')}
          >
            <Ionicons name="rocket-outline" size={normalize(24)} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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

  NoneListText1: {
    fontSize: normalize(24),
    color: '#1E1E1E',
    textAlign: 'center',
    marginVertical: normalize(12, 'height'),
    top: normalize(170, 'height'),
  },

  NoneListText2: {
    fontSize: normalize(18),
    color: '#7E7E7E',
    textAlign: 'center',
    marginVertical: normalize(12, 'height'),
    top: normalize(170, 'height'),
  },
  contentContainer: {
    padding: normalize(25),
    paddingBottom: normalize(100, 'height'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    position: "absolute",
    right: normalize(20),
    bottom: normalize(20, 'height'),
    flexDirection: "row",
    gap: normalize(12),
  },
  MachingListButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    top: normalize(-120, 'height'),
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
  },
});
