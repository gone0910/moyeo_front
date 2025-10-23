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
  // [CHANGED] innerContainer를 cardRoot와 bodyArea로 대체
  return (
    <View style={styles.cardRoot}>
      {/* [ADDED] Sight/Food/Event Bubble과 동일한 상단 제목 바 스타일 적용 */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{name}</Text> {/* [CHANGED] title -> headerTitle */}
      </View>

      {/* [ADDED] 본문 영역 스타일 적용 */}
      <View style={styles.bodyArea}>
        
        {/* 주소 */}
        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={scale(12)} color="#4F46E5" style={{ marginRight: scale(4) }} />
          <Text style={styles.addressText}>{address}</Text> {/* [CHANGED] address -> addressText */}
        </View>

        {/* 숙박비 */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>숙박비 :</Text>
          <Text style={styles.infoValue}>{priceRange}</Text>
        </View>
        
        {/* 연락처 */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>연락처 :</Text>
          <Text style={styles.infoValue}>{phone || '-'}</Text>
        </View>

        {/* [PRESERVED] 체크인/체크아웃 컨테이너 - 기존 레이아웃을 보존 */}
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
    </View>
  );
}

export default function ResultHotelBubble({ data }) {
  const hotelList = data || dummyHotelList;

  return (
    // [ADDED] Sight/Food/Event Bubble과 동일한 외부 프레임 적용
    <View style={styles.resultFrame}>
      <ChatBotCardList
        data={hotelList}
        renderItem={({ item }) => (
          <ChatBotCard>
            <HotelCardContent {...item} />
          </ChatBotCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // [ADDED] Sight/Food/Event Bubble의 외부 프레임 스타일
  resultFrame: {
    width: scale(359),
    minHeight: vScale(208),
    backgroundColor: '#F1F1F5',
    alignSelf: 'flex-start',
    borderRadius: scale(8),
    paddingVertical: vScale(18),
  },

  // [ADDED/CHANGED] Sight/Food/Event Bubble의 카드 루트 스타일 (233x172 내부 레이아웃)
  cardRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // [ADDED] Sight/Food/Event Bubble의 헤더 바 스타일 (제목 영역)
  headerBar: {
    height: vScale(40),
    backgroundColor: '#BCBAEB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(10),
  },
  headerTitle: { // [CHANGED] title -> headerTitle로 이름 변경 및 스타일 조정
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16),
    lineHeight: scale(25),
    color: '#373737',
    textAlign: 'center',
    flexShrink: 1,
  },

  // [ADDED] Sight/Food/Event Bubble의 본문 영역 스타일
  bodyArea: {
    flex: 1,
    paddingHorizontal: scale(10),
    paddingTop: vScale(8),
    paddingBottom: vScale(10),
    rowGap: vScale(4), // 요소 간 간격
  },

  // [CHANGED] 주소 행 스타일 (Sight/Food/Event Bubble과 통일)
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: scale(4),
    marginBottom: vScale(6), // Sight/Food/Event Bubble과 통일
    marginLeft: scale(0),    // 기존 마진 제거
    width: 'auto',           // 기존 고정 너비 제거
  },
  // [CHANGED] 주소 텍스트 스타일 (Sight/Food/Event Bubble과 통일)
  addressText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(10),
    lineHeight: scale(12),
    color: '#868686',
    flex: 1,
    flexWrap: 'wrap',
  },
  
  // [CHANGED] 정보 행 스타일 (Sight/Food/Event Bubble과 통일)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    columnGap: scale(4),
    rowGap: vScale(2),
    marginBottom: vScale(2),
    marginLeft: scale(0), // 기존 마진 제거
  },
  // [CHANGED] 라벨 스타일 (Sight/Food/Event Bubble과 통일)
  infoLabel: {
    width: scale(57), // 고정폭
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(15), // Sight/Food/Event Bubble과 통일
    color: '#333333',
  },
  // [CHANGED] 값 스타일 (Sight/Food/Event Bubble과 통일)
  infoValue: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(15), // Sight/Food/Event Bubble과 통일
    color: '#616161',
    flex: 1,
    flexWrap: 'wrap',
  },

  // --- 체크인/체크아웃 영역 (스타일 보존) ---
  checkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vScale(10), // 마진 조정
    marginLeft: scale(15),
    marginRight: scale(15),
    height: vScale(42), // 높이 유지
  },
  checkColumn: {
    alignItems: 'center',
    flex: 1,
    // [REMOVED] marginBottom: vScale(20) 제거 (bodyArea의 flex와 충돌 방지)
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
    // [REMOVED] marginBottom: vScale(16) 제거 (bodyArea의 flex와 충돌 방지)
  },
});