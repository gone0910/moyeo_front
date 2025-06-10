// components/chatBot/ResultHotelBubble.jsx  숙소
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
const dummyHotelList = [
  {
    name: "롯데호텔 제주",
    address: "제주특별자치도 서귀포시 색달로 10",
    priceRange: "300,000원 ~ 600,000원",
    phone: "064-731-1000",
    checkIn: "15:00",
    checkOut: "15:00"
  },
  {
    name: "해비치호텔",
    address: "제주특별자치도 서귀포시 남원읍 신례2리 43",
    priceRange: "250,000원 ~ 500,000원",
    phone: "064-780-8000",
    checkIn: "14:00",
    checkOut: "12:00"
  }
];


function HotelCardContent({ name, address, priceRange, phone, checkIn, checkOut }) {
  return (
    <View style={styles.innerContainer}>
      <Text style={styles.title}>{name}</Text>

      <View style={styles.addressRow}>
        <MaterialIcons name="location-on" size={8} color="#4F46E5" style={{ marginRight: 4 }} />
        <Text style={styles.address}>{address}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>숙박비 :</Text>
        <Text style={styles.infoValue}>{priceRange}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>연락처 :</Text>
        <Text style={styles.infoValue}>{phone || '-'}</Text>
      </View>
      <View style={styles.checkContainer}>
        <View style={styles.checkColumn}>
          <Text style={styles.checkInLabel}>Check In</Text>
          <Text style={styles.checkTime}>{checkIn}</Text>
        </View>
        <View style={styles.checkDivider}>
          <View style={styles.verticalLine} />
        </View>
        <View style={styles.checkColumn}>
          <Text style={styles.checkOutLabel}>Check Out</Text>
          <Text style={styles.checkTime}>{checkOut}</Text>
        </View>
      </View>
      
    </View>
  );
}

export default function ResultHotelBubble({ data }) {
  const hotelList = data || dummyHotelList;

  return (
    <ChatBotCardList
      data={hotelList}
      renderItem={({ item }) => (
        <ChatBotCard>
          <HotelCardContent {...item} />
        </ChatBotCard>
      )}
    />
  );
}

const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: vScale(110),         // 줄어들어도 카드 세로 최소 보장
    paddingVertical: vScale(8),
  },
  title: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16),
    lineHeight: scale(24),
    color: '#373737',
    minWidth: scale(100),
    marginLeft: scale(9),
    marginTop: vScale(1),
    marginBottom: vScale(8),
    flexWrap: 'wrap',
    flexShrink: 1,
    // height: scale(25), // 제거!
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',      // 여러 줄 대응
    marginLeft: scale(9),
    marginBottom: vScale(2),
  },
  infoLabel: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(18),
    color: '#333333',
    width: scale(57),
    // height: scale(19), // 제거!
    textAlignVertical: 'center',
  },
  infoValue: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(18),
    color: '#616161',
    marginLeft: scale(2),
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: scale(7),
    marginTop: vScale(2),
    marginBottom: vScale(10),
    width: scale(212),
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
    // height: scale(12), // 제거!
    flexWrap: 'wrap',
    textAlignVertical: 'center',
  },
  checkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vScale(14),
    marginLeft: scale(33),
    marginRight: scale(33),
    height: vScale(42),
  },
  checkColumn: {
    alignItems: 'center',
    flex: 1,
    marginBottom: vScale(20),
  },
  checkInLabel: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(12),
    color: '#4F46E5',
    marginBottom: vScale(2),
  },
  checkOutLabel: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(12),
    color: '#F97575',
    marginBottom: vScale(2),
  },
  checkTime: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16),
    lineHeight: scale(18),
    color: '#373737',
    marginTop: vScale(2),
  },
  checkDivider: {
    width: scale(41),
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalLine: {
    width: 1,
    height: vScale(36),
    backgroundColor: '#999999',
    alignSelf: 'center',
    marginBottom: vScale(16),
  },
});