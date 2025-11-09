// components/chatBot/ResultSightBubble.jsx  관광지 출력
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

// 더미 데이터(실제 API 연결 시 data 사용)
const dummySightList = [
  {
    name: "한라산 국립 공원",
    description: "한국의 가장 높은 산, 한라산이 있는 곳",
    hours: "매일 00:00 ~ 24:00",
    fee: "무료",
    location: "제주특별자치도 서귀포시 중앙로48번길 14"
  },
  {
    name: "성산일출봉",
    description: "일출 명소로 유명한 제주 대표 관광지입니다.",
    hours: "06:00 ~ 20:00",
    fee: "성인 2,000원",
    location: "제주특별자치도 서귀포시 성산읍 일출로 284-12"
  }
];

// 카드 내부 콘텐츠 (피그마 레이아웃 반영)
function SightCardContent({ name, description, hours, fee, location }) {
  return (
    <View style={styles.cardRoot /* 233x172 컨테이너 내부 레이아웃 */}>
      {/* 상단 헤더바 */}
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

      {/* 본문 영역 */}
      <View style={styles.bodyArea}>
        {/* 주소 */}
        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={scale(12)} color="#4F46E5" style={{ marginRight: scale(4) }} />
          <Text style={styles.addressText} >
            {location}
          </Text>
        </View>

        {/* 설명 */}
        <Text style={styles.descText} >
          {description}
        </Text>

        {/* 운영시간 */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>운영시간 :</Text>
          <Text style={styles.infoValue} >{hours}</Text>
        </View>

        {/* 입장료 */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>입장료 :</Text>
          <Text style={styles.infoValue} >{fee}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ResultSightBubble({ data }) {
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
            <SightCardContent {...item} />
          </ChatBotCard>
        )}
      />
    </View>
  );
}

// Figma 기준 스타일 반영
const styles = StyleSheet.create({
  resultFrame: {
    maxWidth: MAX_WIDTH,  
    minHeight: vScale(208),
    backgroundColor: '#F1F1F5',
    alignSelf: 'flex-start', 
    borderRadius: scale(8),
    paddingVertical: vScale(18),
  },

  // 카드 내부 루트 (233x172 내부 레이아웃)
  cardRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // 헤더 바 (height 47, #BCBAEB)
  headerBar: {
    height: vScale(40),
    backgroundColor: '#BCBAEB',
  },
  // ScrollView 내부의 컨텐츠 정렬을 위한 스타일
  headerScrollContent: {
    flexGrow: 1, // 텍스트가 짧아도 공간을 채우도록
    justifyContent: 'center', // 텍스트를 수평 중앙 정렬
    alignItems: 'center',
    height: vScale(40),
  },
  headerTitle: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16),
    color: '#373737',
    paddingHorizontal: scale(10),
  },

  // 본문 영역 (남은 높이 채움)
  bodyArea: {
    flex: 1,
    paddingHorizontal: scale(10),
    paddingTop: vScale(8),
    paddingBottom: vScale(10),
    rowGap: vScale(4),
  },

  // 주소(아이콘+텍스트 10/12)
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vScale(6),
    marginTop: vScale(10),
    columnGap: scale(4),
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

  // 설명(12/25)
  descText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(15), // 설명문 상하 간격
    color: '#616161',

  },

  // 운영시간/입장료 라벨-값 행
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    columnGap: scale(4),
    rowGap: vScale(2),
    marginBottom: vScale(2),
  },
  infoLabel: {
    width: scale(57), // 피그마 고정폭
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