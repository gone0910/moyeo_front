// components/chatbot/ResultEventBubble.jsx 축제/이벤트
import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ChatBotCardList from './common/ChatBotCardList';
import ChatBotCard from './common/ChatBotCard';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 375;
const BASE_HEIGHT = 844;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const vScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

// 너비 계산에 필요한 상수 정의
const CARD_WIDTH = scale(233);
const LIST_PADDING_HORIZONTAL = scale(11);
const MAX_WIDTH = scale(359);

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
    <View style={styles.cardRoot}>
      {/* 👇 2. onTouchStart 이벤트를 View에 추가합니다. */}
      <View 
        style={styles.headerBar}
        onTouchStart={(e) => {
          // 이 영역에서 터치가 시작되면 부모(FlatList)로
          // 이벤트가 전파되는 것을 막습니다.
          e.stopPropagation();
        }}
      >
        {/* 👇 3. Text를 ScrollView로 감쌉니다. */}
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.headerScrollContent, { paddingHorizontal: 10 }]} 
          nestedScrollEnabled={true} 
        >
          <Text style={styles.headerTitle}>{name}</Text>
        </ScrollView>
      </View>

      {/* 본문 영역 */}
      <View style={styles.bodyArea}>
        
        {/* 주소 */}
        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={scale(12)} color="#4F46E5" style={{ marginRight: scale(4) }} />
          <Text style={styles.addressText}>{location}</Text>
        </View>

        {/* 주요 행사(하이라이트) - 라벨 없음 */}
        <View style={styles.highlightRow}>
          <Text style={styles.highlightText}>{highlight}</Text>
        </View>
        
        {/* 행사 기간 */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>행사 기간 :</Text>
          <Text style={styles.infoValue}>
            {
              typeof period === 'string'
                ? period.split(/ *[\/,] */).join('\n')
                : Array.isArray(period)
                  ? period.join('\n')
                  : period
            }
          </Text>
        </View>
        
        {/* 참가비 */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>참가비 :</Text>
          <Text style={styles.infoValue}>{fee}</Text>
        </View>
        
      </View>
    </View>
  );
}


export default function ResultEventBubble({ data }) {
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
            <EventCardContent {...item} />
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

  // 👇 4. headerBar 스타일 수정 (Sight/Hotel과 동일)
  headerBar: {
    height: vScale(40),
    backgroundColor: '#BCBAEB',
    // justifyContent, alignItems, paddingHorizontal 제거
  },

  // 👇 5. headerScrollContent 스타일 추가 (Sight/Hotel과 동일)
  headerScrollContent: {
    flexGrow: 1,              // (수평) 텍스트가 짧을 때 중앙 정렬을 위해 영역을 채움
    justifyContent: 'center', // (수평) 텍스트를 수평 중앙 정렬
    alignItems: 'center',     // (수직) 텍스트를 수직 중앙 정렬
    height: vScale(40),         // 부모(headerBar)의 높이와 동일하게 지정
  },

  // 👇 6. headerTitle 스타일 수정 (Sight/Hotel과 동일)
  headerTitle: { 
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16),
    color: '#373737',
    paddingHorizontal: scale(10), // ⬅️ padding 추가
    // lineHeight, textAlign, flexShrink 제거
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
    marginTop: vScale(10),
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
  
  highlightRow: {
    marginBottom: vScale(6),
  },
  highlightText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(15), 
    color: '#616161',
    flexWrap: 'wrap',
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    columnGap: scale(4),
    rowGap: vScale(2),
    marginBottom: vScale(2),
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
});