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

// [ADDED] 카드 내부 콘텐츠 (피그마 레이아웃 반영)
function SightCardContent({ name, description, hours, fee, location }) {
  return (
    <View style={styles.cardRoot /* 233x172 컨테이너 내부 레이아웃 */}>
      {/* 상단 헤더바 */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle} >{name}</Text>
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
  const viewData = data || dummySightList;

  return (
    // [ADDED] 바깥 프레임(359x208, #F1F1F5)
    <View style={styles.resultFrame}>
      <ChatBotCardList
        data={viewData}
        renderItem={({ item }) => (
          <ChatBotCard /* noShadow 기본 (피그마는 보더 중심) */>
            <SightCardContent {...item} />
          </ChatBotCard>
        )}
      />
    </View>
  );
}

// Figma 기준 스타일 반영
const styles = StyleSheet.create({
  // [ADDED] 바깥 프레임 359x208 #F1F1F5 (Frame 1707485838)
  resultFrame: {
    width: scale(359),
    // [CHANGED] auto 높이로 — 카드가 커져도 잘리지 않게
    minHeight: vScale(208),
    backgroundColor: '#F1F1F5',
    alignSelf: 'flex-start',
    borderRadius: scale(8),
    paddingVertical: vScale(18),
  },

  // [ADDED] 카드 내부 루트 (233x172 내부 레이아웃)
  cardRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // [ADDED] 헤더 바 (height 47, #BCBAEB)
  headerBar: {
    height: vScale(40),
    backgroundColor: '#BCBAEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16),
    lineHeight: scale(25),
    color: '#373737',
    textAlign: 'center',
    paddingHorizontal: scale(10),
  },

  // [ADDED] 본문 영역 (남은 높이 채움)
  bodyArea: {
    flex: 1,
    paddingHorizontal: scale(10),
    paddingTop: vScale(8),         // [CHANGED] 위 여백 살짝 증가
    paddingBottom: vScale(10),     // [ADDED] 아래 여백 추가
    rowGap: vScale(4),             // [ADDED] 요소 간 간격
  },

  // 주소(아이콘+텍스트 10/12)
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',      // [CHANGED] 여러 줄일 때 위쪽 정렬
    marginBottom: vScale(6),
    columnGap: scale(4),           // [ADDED]
  },
  addressText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(10),
    lineHeight: scale(12),
    color: '#868686',
    flex: 1,
    flexWrap: 'wrap',              // [ADDED] 줄바꿈 허용
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
    alignItems: 'flex-start',      // [CHANGED] 값이 2줄 이상일 때 위 정렬
    flexWrap: 'wrap',              // [ADDED] 라벨/값 줄바꿈 허용
    columnGap: scale(4),           // [ADDED]
    rowGap: vScale(2),             // [ADDED]
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
