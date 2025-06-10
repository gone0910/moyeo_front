// components/chatBot/ResultSightBubble.jsx  관광지 출력
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ChatBotCardList from './common/ChatBotCardList';
import ChatBotCard from './common/ChatBotCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const vScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

// 더미 데이터: 실제 API 연동 전 테스트용
const dummySightList = [
  {
    name: "한라산 국립 공원",
    description: "“ 한국의 가장 높은 산, 한라산이 있는 곳”",
    hours: "매일 00:00 ~ 24:00",
    fee: "무료",
    location: "제주특별자치도 서귀포시 중앙로48번길 14"
  },
  {
    name: "성산일출봉",
    description: "“일출 명소로 유명한 제주 대표 관광지입니다.”",
    hours: "06:00 ~ 20:00",
    fee: "성인 2,000원",
    location: "제주특별자치도 서귀포시 성산읍 일출로 284-12"
  }
];


// 카드 내부 내용 정의 (아래 함수도 Bubble 파일 내부에 포함)
function SightCardContent({ name, description, hours, fee, location }) {
  return (
    <View style={styles.innerContainer}>
      <Text style={styles.title}>{name}</Text> 
      <View style={styles.addressRow}>
        <MaterialIcons name="location-on" size={12} color="#4F46E5" style={{ marginRight: 4 }} />
        <Text style={styles.address}>{location}</Text>
      </View>
      <Text style={styles.desc}>{description}</Text>   
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>운영시간 :</Text>
        <Text style={styles.infoValue}>
          {
            typeof hours === 'string'
              ? hours.split(/ *[\/,] *|\s*\(/).join('\n(') // (도 줄바꿈되게, (는 붙여줌
              : Array.isArray(hours)
                ? hours.join('\n')
                : hours
          }
          </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>입장료 :</Text>
        <Text style={styles.infoValue}>{fee}</Text>
      </View>      
    </View>
  );
}



export default function ResultSightBubble({ data }) {
  const viewData = data || dummySightList; // 배열!

  return (
    <ChatBotCardList data={viewData} renderItem={({ item }) => (
      <ChatBotCard>
        <SightCardContent {...item} />
      </ChatBotCard>
    )} />
  );
}

// Figma 기준 스타일 반영
const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: vScale(100),        // 필요시 110~120까지 조절
    paddingVertical: vScale(2),
  },
  title: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(18),
    lineHeight: scale(24),
    color: '#373737',
    marginLeft: scale(10),
    marginRight: scale(10),
    marginBottom: vScale(2),
    flexWrap: 'wrap',
    flexShrink: 1,
    // height: scale(24), // 삭제!
  },
  desc: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(18),
    color: '#616161',
    marginLeft: scale(10),
    marginRight: scale(10),
    marginBottom: vScale(10),
    flexWrap: 'wrap',
    flexShrink: 1,
    alignSelf: 'flex-start',
    width: '90%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: scale(10),
    marginBottom: vScale(2),
  },
  infoLabel: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(18),
    color: '#373737',
    width: scale(70),
    // height: scale(18), // 삭제!
  },
  infoValue: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(18),
    color: '#616161',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: vScale(6),
    marginLeft: scale(10),
    marginBottom: vScale(10),
  },
  address: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(14),
    color: '#868686',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
});