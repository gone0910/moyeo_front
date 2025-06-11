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
  return (
    <View style={styles.innerContainer}>
      <Text style={styles.title}>{name}</Text>
      <View style={styles.addressRow}>
        <MaterialIcons name="location-on" size={12} color="#4F46E5" style={{ marginRight: 4 }} />
        <Text style={styles.address}>{location}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>대표메뉴 :</Text>
        <Text style={styles.infoValue}>{menu}</Text>
      </View>
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
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>가격대 :</Text>
        <Text style={styles.infoValue}>{priceRange}</Text>
      </View>
    </View>
  );
}


export default function ResultFoodBubble({ data }) {
  const foodList = data || dummyFoodList;

  return (
    <ChatBotCardList
      data={foodList}
      renderItem={({ item }) => (
        <ChatBotCard>
          <FoodCardContent {...item} />
        </ChatBotCard>
      )}
    />
  );
}

const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: vScale(90),           // 90~120 사이 필요에 따라 조정
    paddingVertical: vScale(8),
  },
  title: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(18),
    lineHeight: scale(24),
    color: '#373737',
    minWidth: scale(90),
    marginLeft: scale(9),
    marginTop: vScale(1),
    marginBottom: vScale(2),
    // textAlignVertical: 'flex-start',
    flexWrap: 'wrap',
    flexShrink: 1,
    // height: scale(25), // 제거!
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: scale(9),
    marginBottom: vScale(1),
    marginTop: vScale(10),
  },
  infoLabel: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(18),
    color: '#333333',
    width: scale(70),
    textAlignVertical: 'center',
    // height: scale(19), // 제거!
  },
  infoValue: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(18),
    color: '#616161',
    marginLeft: scale(1),
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vScale(10),
    marginLeft: scale(10),
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
    minwidth: scale(100),
    textAlignVertical: 'center',
    flexWrap: 'wrap',
    // height: scale(12), // 제거!
  },
});