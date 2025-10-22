// components/chatBot/ResultFoodBubble.jsx 맛집 카페
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

// props.data로 값 받음, 없으면 더미 예시
const dummyFoodList = [
  {
    name: "오는정김밥",
    menu: "오는정김밥, 멸치국수",
    hours: "매일 09:00 ~ 19:00",
    priceRange: "7,000원 ~ 10,000원",
    location: "제주특별자치도 서귀포시 색달로 10"
  },
  {
    name: "삼대국수회관",
    menu: "고기국수, 멸치국수",
    hours: "09:00 ~ 19:00",
    priceRange: "8,000원",
    location: "제주시 연동 261-11"
  }
];

function FoodCardContent({ name, menu, hours, priceRange, location }) {
  // [CHANGED] innerContainer -> cardRoot로 스타일 이름 변경 및 flex:1 설정 유지
  return (
    <View style={styles.cardRoot}>
      {/* [ADDED] SightBubble처럼 상단 제목 바 스타일 적용 */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{name}</Text>
      </View>

      {/* [ADDED] 본문 영역 스타일 적용 */}
      <View style={styles.bodyArea}>
        
        {/* 주소 */}
        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={scale(12)} color="#4F46E5" style={{ marginRight: scale(4) }} />
          <Text style={styles.addressText}>{location}</Text> {/* [CHANGED] address -> addressText */}
        </View>

        {/* 대표메뉴 */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>대표메뉴 :</Text>
          <Text style={styles.infoValue}>{menu}</Text>
        </View>
        
        {/* 영업시간 */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>영업시간 :</Text>
          <Text style={styles.infoValue}>
            {
              typeof hours === 'string'
                ? hours.split(/ *[\/,] */).join('\n') // , 포함 줄바꿈.
                : Array.isArray(hours) // 줄바꿈시에 앞에 공백 1칸 방지
                  ? hours.join('\n')
                  : hours
            }
          </Text>
        </View>
        
        {/* 가격대 */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>가격대 :</Text>
          <Text style={styles.infoValue}>{priceRange}</Text>
        </View>
      </View>
    </View>
  );
}


export default function ResultFoodBubble({ data }) {
  const foodList = data || dummyFoodList;

  return (
    // [ADDED] SightBubble과 동일한 외부 프레임 적용
    <View style={styles.resultFrame}>
      <ChatBotCardList
        data={foodList}
        renderItem={({ item }) => (
          <ChatBotCard>
            <FoodCardContent {...item} />
          </ChatBotCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // [ADDED] SightBubble의 외부 프레임 스타일
  resultFrame: {
    width: scale(359),
    minHeight: vScale(208),
    backgroundColor: '#F1F1F5',
    alignSelf: 'flex-start',
    borderRadius: scale(8),
    paddingVertical: vScale(18),
  },

  // [ADDED/CHANGED] SightBubble의 카드 루트 스타일 (233x172 내부 레이아웃)
  cardRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
    // [REMOVED] 기존 innerContainer의 불필요한 스타일 제거 (minHeight, justify, padding)
  },

  // [ADDED] SightBubble의 헤더 바 스타일 (제목 영역)
  headerBar: {
    height: vScale(50),
    backgroundColor: '#BCBAEB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(10), // 제목이 너무 길 때를 대비
  },
  headerTitle: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16),
    lineHeight: scale(25),
    color: '#373737',
    textAlign: 'center',
    flexShrink: 1, // 텍스트 줄바꿈 허용
  },

  // [ADDED] SightBubble의 본문 영역 스타일
  bodyArea: {
    flex: 1,
    paddingHorizontal: scale(10),
    paddingTop: vScale(8),
    paddingBottom: vScale(10),
    rowGap: vScale(4), // 요소 간 간격
  },

  // [CHANGED] 주소 행 스타일 (SightBubble과 통일)
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: scale(4),
    marginBottom: vScale(6),
  },
  // [CHANGED] 주소 텍스트 스타일 (SightBubble과 통일)
  addressText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(10),
    lineHeight: scale(12),
    color: '#868686',
    flex: 1,
    flexWrap: 'wrap',
  },
  
  // [CHANGED] 정보 행 스타일 (SightBubble과 통일)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    columnGap: scale(4),
    rowGap: vScale(2),
    marginBottom: vScale(2),
    // [REMOVED] 기존의 불필요한 마진/패딩 제거
  },
  // [CHANGED] 라벨 스타일 (SightBubble과 통일)
  infoLabel: {
    width: scale(57), // SightBubble의 고정폭
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12), // SightBubble과 동일한 글꼴 크기
    lineHeight: scale(15),
    color: '#333333',
  },
  // [CHANGED] 값 스타일 (SightBubble과 통일)
  infoValue: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12), // SightBubble과 동일한 글꼴 크기
    lineHeight: scale(15),
    color: '#616161',
    flex: 1,
    flexWrap: 'wrap',
  },
});