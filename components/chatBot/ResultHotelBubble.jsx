// components/chatBot/ResultHotelBubble.jsx  숙소
import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ChatBotCardList from './common/ChatBotCardList';
import ChatBotCard from './common/ChatBotCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const vScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

// 너비 계산에 필요한 상수 정의
const CARD_WIDTH = scale(233);
const LIST_PADDING_HORIZONTAL = scale(11);
const MAX_WIDTH = scale(359);

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
    <View style={styles.cardRoot}>
      {/* 👇 [수정] onTouchStart 이벤트 추가 */}
      <View 
        style={styles.headerBar}
        onTouchStart={(e) => {
          // 이 영역에서 터치가 시작되면 부모(FlatList)로
          // 이벤트가 전파되는 것을 막습니다.
          e.stopPropagation();
        }}
      >
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.headerScrollContent, { paddingHorizontal: 10 }]} 
          nestedScrollEnabled={true}
        >
          <Text style={styles.headerTitle}>{name}</Text>
        </ScrollView>
      </View>

      <View style={styles.bodyArea}>
        
        {/* 주소 */}
        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={scale(12)} color="#4F46E5" style={{ marginRight: scale(4) }} />
          <Text style={styles.addressText}>{address}</Text>
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

        {/* 체크인/체크아웃 컨테이너 */}
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
  const eventList = data || dummyEventList;
  
  // 아이템 개수 파악
  const itemCount = eventList.length;

  //  아이템 개수에 따라 동적 너비 계산
  let dynamicWidth;

  if (itemCount === 1) {
    // 1개일 때 = (좌우 여백 * 2) + (카드 너비 * 1)
    // (scale(11) * 2) + scale(233) = scale(255)
    dynamicWidth = (LIST_PADDING_HORIZONTAL * 2) + CARD_WIDTH;
  } else {
    // 0개이거나 2개 이상일 때는 기존 최대 너비로 설정
    dynamicWidth = MAX_WIDTH;
  }

  // 아이템이 0개면 버블을 렌더링하지 않음
  if (itemCount === 0) {
    return null;
  }

  return (
    // 👇 5. style에 [기존 스타일, {동적 너비}]를 적용합니다.
    <View style={[styles.resultFrame, { width: dynamicWidth }]}>
      <ChatBotCardList
        data={eventList}
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
  resultFrame: {
    maxWidth: MAX_WIDTH,  
    minHeight: vScale(208),
    backgroundColor: '#F1F1F5',
    alignSelf: 'flex-start', 
    borderRadius: scale(8),
    paddingVertical: vScale(18),
  },


  cardRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // headerBar 스타일 (SightBubble과 동일)
  headerBar: {
    height: vScale(40),
    backgroundColor: '#BCBAEB',
  },
  
  // headerScrollContent 스타일 (SightBubble과 동일)
  headerScrollContent: {
    flexGrow: 1,              // (수평) 텍스트가 짧을 때 중앙 정렬을 위해 영역을 채움
    justifyContent: 'center', // (수평) 텍스트를 수평 중앙 정렬
    alignItems: 'center',     // (수직) 텍스트를 수직 중앙 정렬
    height: vScale(40),         // 부모(headerBar)의 높이와 동일하게 지정
  },
  
  // headerTitle 스타일 (SightBubble과 동일)
  headerTitle: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16),
    color: '#373737',
    paddingHorizontal: scale(10),
  },

  bodyArea: {
    flex: 1,
    paddingHorizontal: scale(10),
    paddingTop: vScale(8),
    paddingBottom: vScale(10),
    rowGap: vScale(4), // 요소 간 간격
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: scale(4),
    marginBottom: vScale(6),
    marginLeft: scale(0),
    marginTop: vScale(10),
    width: 'auto',
  },
  addressText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(10),
    lineHeight: scale(12),
    color: '#868686',
    flex: 1,
    flexWrap: 'wrap',
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    columnGap: scale(4),
    rowGap: vScale(2),
    marginBottom: vScale(2),
    marginLeft: scale(0),
  },
  infoLabel: {
    width: scale(57), // 고정폭
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(15),
    color: '#333333',
  },
  infoValue: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(15),
    color: '#616161',
    flex: 1,
    flexWrap: 'wrap',
  },

  // --- 체크인/체크아웃 영역 (스타일 보존) ---
  checkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vScale(10),
    marginLeft: scale(15),
    marginRight: scale(15),
    height: vScale(42),
  },
  checkColumn: {
    alignItems: 'center',
    flex: 1,
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
  },
});