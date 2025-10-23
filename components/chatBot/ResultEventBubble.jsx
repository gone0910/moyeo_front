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
  // [CHANGED] innerContainer를 cardRoot와 bodyArea로 대체
  return (
    <View style={styles.cardRoot}>
      {/* [ADDED] Sight/Food Bubble과 동일한 상단 제목 바 스타일 적용 */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{name}</Text> {/* [CHANGED] title -> headerTitle */}
      </View>

      {/* [ADDED] 본문 영역 스타일 적용 */}
      <View style={styles.bodyArea}>
        
        {/* 주소 */}
        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={scale(12)} color="#4F46E5" style={{ marginRight: scale(4) }} />
          <Text style={styles.addressText}>{location}</Text> {/* [CHANGED] address -> addressText */}
        </View>

        {/* 주요 행사(하이라이트) - 라벨 없음 */}
        <View style={styles.highlightRow}>
          {/* [REMOVED] infoLabel: Sight/Food Bubble은 이 위치에 별도 라벨이 있으나, Event는 라벨 없이 단독 텍스트 사용 */}
          <Text style={styles.highlightText}>{highlight}</Text> {/* [CHANGED] infoValueMulti -> highlightText */}
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

  return (
    // [ADDED] Sight/Food Bubble과 동일한 외부 프레임 적용
    <View style={styles.resultFrame}>
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
  // [ADDED] Sight/Food Bubble의 외부 프레임 스타일
  resultFrame: {
    width: scale(359),
    minHeight: vScale(208),
    backgroundColor: '#F1F1F5',
    alignSelf: 'flex-start',
    borderRadius: scale(8),
    paddingVertical: vScale(18),
  },

  // [ADDED/CHANGED] Sight/Food Bubble의 카드 루트 스타일 (233x172 내부 레이아웃)
  cardRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // [ADDED] Sight/Food Bubble의 헤더 바 스타일 (제목 영역)
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

  // [ADDED] Sight/Food Bubble의 본문 영역 스타일
  bodyArea: {
    flex: 1,
    paddingHorizontal: scale(10),
    paddingTop: vScale(8),
    paddingBottom: vScale(10),
    rowGap: vScale(4), // 요소 간 간격
  },

  // [CHANGED] 주소 행 스타일 (Sight/Food Bubble과 통일)
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: scale(4),
    marginBottom: vScale(6),
  },
  // [CHANGED] 주소 텍스트 스타일 (Sight/Food Bubble과 통일)
  addressText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(10),
    lineHeight: scale(12),
    color: '#868686',
    flex: 1,
    flexWrap: 'wrap',
  },
  
  // [ADDED] 하이라이트/설명 행 (SightBubble의 descText와 유사)
  highlightRow: {
    marginBottom: vScale(6),
  },
  highlightText: { // [CHANGED] infoValueMulti -> highlightText로 이름 변경 및 스타일 조정
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12), // 설명문과 유사한 크기
    lineHeight: scale(15), 
    color: '#616161',
    flexWrap: 'wrap',
  },
  
  // [CHANGED] 정보 행 스타일 (Sight/Food Bubble과 통일)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    columnGap: scale(4),
    rowGap: vScale(2),
    marginBottom: vScale(2),
  },
  // [CHANGED] 라벨 스타일 (Sight/Food Bubble과 통일)
  infoLabel: {
    width: scale(57), // Sight/Food Bubble의 고정폭
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(15),
    color: '#333333',
  },
  // [CHANGED] 값 스타일 (Sight/Food Bubble과 통일)
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