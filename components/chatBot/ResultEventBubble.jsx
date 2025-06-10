// components/chatbot/ResultEventBubble.jsx 축제/이벤트
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

// 더미 데이터 (실제 연동 전까지 사용)
const dummyEventList = [
  {
    name: "서귀포 칠십리축제",
    highlight: "전통 문화 공연, 지역 특산물 체험",
    period: "2025.10.06 ~ 2025.10.09",
    fee: "무료",
    location: "제주특별자치도 서귀포시 색달로 10"
  },
  {
    name: "제주 불꽃축제",
    highlight: "불꽃놀이, 버스킹 공연",
    period: "2025.11.05 ~ 2025.11.07",
    fee: "5,000원",
    location: "제주시 탑동광장"
  }
];


function EventCardContent({ name, highlight, period, fee, location }) {
  return (
    <View style={styles.innerContainer}>
      <Text style={styles.title}>{name}</Text>

      <View style={styles.addressRow}>
        <MaterialIcons name="location-on" size={8} color="#4F46E5" style={{ marginRight: 4 }} />
        <Text style={styles.address}>{location}</Text>
      </View>

      <View style={styles.infoRow}>
        {/* <Text style={styles.infoLabel}>주요 행사 :</Text> */}
        <Text style={styles.infoValueMulti}>{highlight}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>행사 기간 :</Text>
        <Text style={styles.infoValue}>{period}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>참가비 :</Text>
        <Text style={styles.infoValue}>{fee}</Text>
      </View>
      
    </View>
  );
}


export default function ResultEventBubble({ data }) {
  const eventList = data || dummyEventList;

  return (
    <ChatBotCardList
      data={eventList}
      renderItem={({ item }) => (
        <ChatBotCard>
          <EventCardContent {...item} />
        </ChatBotCard>
      )}
    />
  );
}

const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: vScale(100),            // 100~140 사이 조정
    paddingVertical: vScale(6),
  },
  // 1. 타이틀(축제명)
  title: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(18),
    lineHeight: scale(24),
    color: '#373737',
    minWidth: scale(180),
    marginLeft: scale(8),
    marginTop: vScale(3),
    marginBottom: vScale(2),
    textAlignVertical: 'center',
    flexWrap: 'wrap',
    flexShrink: 1,
    // height: scale(25), // 제거!
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: scale(8),
    marginBottom: vScale(2),
    // minHeight: scale(19), // 제거!
  },
  infoLabel: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(13),
    lineHeight: scale(18),
    color: '#333333',
    minWidth: scale(70),
    textAlignVertical: 'center',
    // height: scale(19), // 제거!
  },
  infoValueMulti: { // 한줄 설명명
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(18),
    color: '#616161',
    marginLeft: scale(2),
    flexShrink: 1,
    flexWrap: 'wrap',
    // width: scale(123),     // 제거하면 자동 줄바꿈 (너무 좁아질 땐 123 유지)
    // minHeight: scale(19), // 제거!
    textAlignVertical: 'center',
    marginBottom: scale(6),
  },
  infoValue: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(13),
    lineHeight: scale(18),
    color: '#616161',
    marginLeft: scale(2),
    textAlignVertical: 'center',
    flexShrink: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vScale(7),
    marginLeft: scale(10),
    width: scale(212),
    marginBottom: vScale(6),
    // height: scale(12), // 제거!
  },
  address: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(14),
    color: '#868686',
    marginLeft: scale(2),
    minWidth: scale(100),
    flexWrap: 'wrap',
    textAlignVertical: 'center',
    // height: scale(12), // 제거!
  },
});