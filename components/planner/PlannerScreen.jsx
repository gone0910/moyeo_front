// 📁 /components/matching/MatchingScreen.jsx
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext'; // Ensure correct import path
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts } from 'expo-font';

const matchingImage = require('../../assets/images/planning_image.jpg');

export default function PlannerScreen() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [fontsLoaded] = useFonts({ KaushanScript: KaushanScript_400Regular });

  if (!fontsLoaded) {
    return null; // Avoid rendering until fonts are loaded
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerWrapper}>
        <Text style={styles.logotext} numberOfLines={1} adjustsFontSizeToFit>moyeo </Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileHome', user)}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.headerLine} />

      {/* Main Section */}
      <View style={styles.centerWrapper}>
        <Image source={matchingImage} style={styles.PlannerImage} />
        <Text style={styles.title}>일정만 입력하셔도</Text>
        <Text style={styles.titletext}>여행 플랜 완성</Text>
        <Text style={styles.titletext2}>내 취향에 맞춘 여행 계획을 세워보세요</Text>

        {/* New Container Bar Section */}
        <View style={styles.containerBar}>
          <Text style={styles.containerBarText}>동행자 찾기</Text>
          <TouchableOpacity style={styles.containerBarButton}
          후에 변경 필요
              onPress={() => navigation.navigate('PlannerInfo')}>   
           <Text style={styles.containerBarButtonText}>여행 플랜 만들러 가기</Text>
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
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logotext: {
    fontSize: 40,
    fontFamily: 'KaushanScript',
    color: '#4F46E5',
    lineHeight: 80,
    letterSpacing: 0,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: 22,
    top:-5,
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    top:5,
    backgroundColor: '#D1D5DB',
  },
  headerLine: {
    height: 1,
    backgroundColor: '#999',
    marginVertical: 8,
    top:-10,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  PlannerImage: {
    width: 330, 
    height: 330, 
    marginBottom: 20, 
    borderRadius:16,
    marginTop:250,
    top:-20,
  },
  title: {
    fontSize: 26,
    color: '#1E1E1E',
    textAlign: 'center',
    top: -525,
    fontFamily: 'Inter_400Regular',                                                                                                                                                                                                                                                                                                                                                                                                                                
  },
  titletext: {
    fontSize: 26,
    marginTop: 16,
    color: '#1E1E1E', 
    textAlign: 'center',
    top: -530,
    fontFamily: 'Inter_400Regular',
  },
  titletext2: {
    fontSize: 20,
    marginTop: 10,
    color: '#7E7E7E', 
    textAlign: 'center',
    top: -515,
    fontFamily: 'Inter_400Regular',
    marginTop:0,
  },
  containerBar: {
    width: '100%',
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    marginTop: 0,
    alignItems: 'center',
  },
  containerBarText: {
    fontSize: 20,
    color: '#FAFAFA',
    marginBottom: 10,
  },
  containerBarButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '110%',
    marginLeft: 0,
    marginTop:-102,
    top:-5,
  },
  containerBarButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});
