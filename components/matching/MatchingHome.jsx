// components/matching/MatchingHome.jsx
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts } from 'expo-font';
import AccordionCard from '../common/AccordionCard';


export default function MatchingHome() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [fontsLoaded] = useFonts({ KaushanScript: KaushanScript_400Regular });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerWrapper}>
        <Text style={styles.logo} numberOfLines={1} adjustsFontSizeToFit>
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

      <View style={styles.divider} />

      {/* Main Content */}
      <View style={styles.centerWrapper}>
        <Text style={styles.title}>이런 유형의 사람들과 함께 가고 싶어요</Text>

        <TouchableOpacity>
          <Text style={styles.titletext}>편집</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('MatchingInfo')}>
            {/* 임시 버튼 생성 */}
        <Text style={{ fontSize: 18, color: 'blue', marginTop: 20 }}> 
            👉 다음 
        </Text>
        </TouchableOpacity>


        {/* ✅ AccordionCard 적용 */}
        <AccordionCard title={`여행 일정    2025.04.20 ~ 2025.04.22
목적지       충청북도 괴산
인원 수      단둘이
`}>
  <View style={styles.accordionContent1}>
  <Text style={styles.textStyle}>선호 성별    여자</Text>
  <Text style={styles.textStyle}>선호 나이    20대</Text>
  </View>
</AccordionCard>
<AccordionCard title={`여행 일정    2025.04.22 ~ 2025.04.27
목적지       선택안함
인원 수      선택안함
`}>
  <View style={styles.accordionContent2}>
  <Text style={styles.textStyle}>선호 성별    남자</Text>
  <Text style={styles.textStyle}>선호 나이    30대</Text>
  </View>
</AccordionCard>
<AccordionCard title={`여행 일정    2025.04.25 ~ 2025.04.30
목적지       선택안함
인원 수      선택안함
`}>
  <View style={styles.accordionContent3}>
  <Text style={styles.textStyle}>선호 성별    선택안함</Text>
  <Text style={styles.textStyle}>선호 나이    선택안함</Text>
  </View>
</AccordionCard>


        <View style={styles.containerBar}>
          <TouchableOpacity style={styles.containerBarButton}>
            <Text style={styles.containerBarButtonText}>새로운 유형의 동행자 찾기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', paddingHorizontal: 16, paddingTop: 24 },
  headerWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: 40, fontFamily: 'KaushanScript', color: '#4F46E5', lineHeight: 80 },
  profileImage: { width: 44, height: 44, borderRadius: 22, marginTop: 22 },
  profilePlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D1D5DB', marginTop: 22 },
  divider: { height: 1, backgroundColor: '#999999', marginVertical: 8, top: -10 },
  centerWrapper: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', marginTop: 20 },
  title: { fontSize: 20, color: '#000000', textAlign: 'center', fontFamily: 'Inter_400Regular', marginBottom: 8, top:-10 },
  titletext: { fontSize: 20, color: '#827CEB', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 40, left: 150, top: 20 },
  containerBar: { width: '100%', padding: 16, backgroundColor: '#FAFAFA', borderRadius: 8, alignItems: 'center' },
  containerBarButton: { backgroundColor: '#4F46E5',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '110%',
    marginLeft: 0,
    marginTop:5,
    top:-5,
  },

  containerBarButtonText: { color: '#FFFFFF', fontSize: 18 },
  accordionContent1: { padding: 1, backgroundColor: '#FFFFFF', borderRadius: 12, marginTop: 4, left: -15, top:-20, width: 352},
  accordionContent2: { padding: 1, backgroundColor: '#FFFFFF', borderRadius: 12, marginTop: 4, left: -15, top:-15, width: 358},
  accordionContent3: { padding: 1, backgroundColor: '#FFFFFF', borderRadius: 12, marginTop: 4, left: -15, top:-15, width: 358},
  textStyle: {
    fontSize: 16, // 크기에 맞게 글자 크기 설정
    lineHeight: 30, // 텍스트 간 간격을 추가
    color: '#000000', // 텍스트 색상
    fontWeight: '400', // 글자 굵기
    fontFamily: 'Roboto', // 텍스트 폰트 설정
    letterSpacing: 2,
    left:12 },
});
