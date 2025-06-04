// components/chatBot/ChatBotScreen.jsx  챗봇 전체 화면 (5차 정보 안내 + SafeAreaView 적용, Figma/반응형)
// 역할: 1~4차(카테고리 선택) + 5차([도/시]의 [카테고리] 정보 안내) + 하단탭 SafeAreaView 반영 통합

import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { REGION_MAP } from '../common/regionMap';


// 광역시 목록
const METROPOLITAN_CITIES = [
  '부산', '대구', '인천', '광주', '대전', '울산', '세종'
];
// 도만 필터링 (광역시 제외)
const provinces = Object.keys(REGION_MAP).filter(
  name => !METROPOLITAN_CITIES.includes(name)
);
const { width } = Dimensions.get('window');


// 1차 질문(챗봇 안내)
const initialMessages = [
  {
    type: 'bot',
    text: '챗봇 기능은 여행과 관련된 다양한 정보를 제공해 드려요.\n목적지 관련 정보제공 또는 현재 위치 기반 정보제공 중 선택해주세요.',
    buttons: [
      { label: '목적지 관련 정보제공', value: 'destination' },
      { label: '현재 위치 기반 정보제공', value: 'currentLocation' }
    ],
    isActive: true,
  }
];

// 카테고리 리스트
const CATEGORY_LIST = [
  { label: '관광지', value: 'sight' },
  { label: '맛집/카페', value: 'food' },
  { label: '숙소', value: 'hotel' },
  { label: '축제/이벤트', value: 'event' },
  { label: '날씨', value: 'weather' },
];

export default function ChatBotScreen() {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const navigation = useNavigation();

  // 버튼 클릭시 메시지/버튼 갱신 예시
  const handleButton = (value, label) => {
    // 모든 이전 말풍선 비활성화
    const updated = messages.map(m => ({ ...m, isActive: false }));
    // 내가 누른 버튼을 내 답변 말풍선으로 추가
    updated.push({ type: 'user', text: label });

    // 2차: 목적지 관련 정보제공 클릭시 도 리스트 버튼(2차 말풍선) 추가
    if (value === 'destination') {
      setSelectedProvince(null);
      setSelectedCity(null);
      updated.push({
        type: 'bot',
        text: '목적지를 선택해주세요.',
        isActive: true,
        custom: 'province',
      });
    }
    // 3차: 도 버튼 클릭시 → 시 리스트 출력
    else if (provinces.includes(value)) {
      setSelectedProvince(value);
      setSelectedCity(null);
      updated.push({
        type: 'bot',
        text: '목적지를 선택해주세요.',
        isActive: true,
        custom: 'city',
      });
    }
    // 4차: 시/군/구 버튼 클릭 또는 "선택안함" 클릭 시 → 카테고리 선택
    else if (selectedProvince && (
      REGION_MAP[selectedProvince].some(city => city.name === value) || value === '선택안함')
    ) {
      setSelectedCity(value === '선택안함' ? null : value);
      updated.push({
        type: 'bot',
        text: '정보 제공을 원하시는 카테고리를 선택해 주세요.',
        isActive: true,
        custom: 'category',
      });
    }
    // 5차: 카테고리 선택 시 → [도/시]의 [카테고리] 정보 안내
    else if (CATEGORY_LIST.some(cat => cat.value === value)) {
      const catObj = CATEGORY_LIST.find(cat => cat.value === value);
      updated.push({
        type: 'bot',
        text: '정보 결과 안내',
        isActive: false,
        custom: 'result',
        catLabel: catObj.label,
      });
    }
    setMessages(updated);
  };

  // 3차 말풍선: 시 리스트, "이전으로/선택안함" 버튼
  const renderCityBubble = (key) => {
    const cityList = selectedProvince ? REGION_MAP[selectedProvince] : [];
    return (
      <View style={styles.botBubble} key={key}>
        {/* 안내문구 (맨 위) */}
        <Text style={styles.botBubbleTitle}>목적지를 선택해주세요.</Text>
        {/* 상단 버튼 2개: 이전으로/선택안함 */}
        <View style={styles.cityTopBtnRow}>
          <TouchableOpacity
            style={styles.cityTopButton}
            onPress={() => handleButton('destination', '도 다시 선택')}
          >
            <Text style={styles.prevButtonText}>이전으로</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cityTopButton}
            onPress={() => handleButton('선택안함', '선택안함')}
          >
            <Text style={styles.prevButtonText}>선택안함</Text>
          </TouchableOpacity>
        </View>
        {/* 시 리스트: wrap flex, 한 줄 3개 */}
        <View style={styles.cityButtonWrap}>
          {cityList.map((city, idx) => (
            <TouchableOpacity
              key={city.name}
              style={[
                styles.cityButton,
                (idx + 1) % 3 === 0 && { marginRight: 0 },
              ]}
              onPress={() => handleButton(city.name, city.name)}
            >
              <Text style={styles.cityButtonText}>{city.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 4차 카테고리 선택 말풍선 (좁은 프레임)
  const renderCategoryBubble = (key) => (
    <View style={styles.categoryBubble} key={key}>
      {/* 안내문구 */}
      <Text style={styles.categoryTitle}>정보 제공을 원하시는 카테고리를 선택해 주세요.</Text>
      {/* 카테고리 버튼 리스트 (5개 세로) */}
      <View style={styles.categoryBtnWrap}>
        {CATEGORY_LIST.map((cat, idx) => (
          <TouchableOpacity
            key={cat.value}
            style={styles.categoryButton}
            onPress={() => handleButton(cat.value, cat.label)}
          >
            <Text style={styles.categoryButtonText}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // 5차 정보 안내(결과) 말풍선 (좁은 프레임)
  const renderResultBubble = (key, catLabel) => (
    <View style={styles.resultBubble} key={key}>
      <Text style={styles.resultText}>
        {selectedProvince}
        {selectedCity ? ` ${selectedCity}` : ''}의{' '}
        <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>{catLabel}</Text> 정보입니다.
      </Text>
      {/* 실제 정보/카드/재조회/카테고리 재선택/처음으로 버튼 등은 추후 확장 */}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('BottomTab')} style={styles.sideButton}>
          <MaterialIcons name="chevron-left" size={28} color="#4F46E5" />
        </TouchableOpacity>
        <View style={styles.centerWrapper}>
          <Text style={styles.headerTitle}>챗봇</Text>
        </View>
        <View style={styles.sideButton} />
      </View>
      <View style={styles.headerLine} />

      {/* 대화영역 */}
      <ScrollView style={styles.chatArea}
       contentContainerStyle={{ paddingBottom: 32 }}>
        {messages.map((msg, i) => {
          // 5차 정보 안내(결과)
          if (msg.type === 'bot' && msg.custom === 'result') {
            return renderResultBubble(i, msg.catLabel);
          }
          // 4차 카테고리 선택
          if (msg.type === 'bot' && msg.custom === 'category') {
            return renderCategoryBubble(i);
          }
          // 3차 말풍선(시 선택)
          if (msg.type === 'bot' && msg.custom === 'city') {
            return renderCityBubble(i);
          }
          // 2차 말풍선(도 선택)
          if (msg.type === 'bot' && msg.custom === 'province') {
            return (
              <View style={styles.botBubble} key={i}>
                {/* 안내문구 (맨 위) */}
                <Text style={styles.botBubbleTitle}>목적지를 선택해주세요.</Text>
                {/* 이전으로 버튼 (안내문구 아래) */}
                <TouchableOpacity style={styles.prevButtonFull} onPress={() => setMessages(initialMessages)}>
                  <Text style={styles.prevButtonText}>이전으로</Text>
                </TouchableOpacity>
                {/* 도 리스트: wrap flex, 한 줄 3개 */}
                <View style={styles.provinceButtonWrap}>
                  {provinces.map((prov, idx) => (
                    <TouchableOpacity
                      key={prov}
                      style={[
                        styles.provinceButton,
                        (idx + 1) % 3 === 0 && { marginRight: 0 },
                      ]}
                      onPress={() => handleButton(prov, prov)}
                    >
                      <Text style={styles.provinceButtonText}>{prov}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          }
          // 기본 챗봇 말풍선(버튼 포함)
          if (msg.type === 'bot') {
            return (
                <View key={i} style={{ marginBottom: 0 }}>
                {/* 챗봇 아이콘 (말풍선 바깥 좌상단) */}
                <View style={styles.chatBotIconRow}>
                    <MaterialCommunityIcons name="robot-outline" size={28} color="#928CFF" />
                </View>
                {/* 챗봇 말풍선 */}
                <View style={styles.botBubble}>
                    <Text style={{ fontSize: 14, lineHeight: 22 }}>
                    {/* 강조 색상 */}
                    {msg.text.split(/(목적지 관련 정보제공|현재 위치 기반 정보제공)/g).map((part, idx) =>
                        part === '목적지 관련 정보제공' || part === '현재 위치 기반 정보제공' ? (
                        <Text key={idx} style={{ color: '#928CFF', fontWeight: 'bold' }}>{part}</Text>
                        ) : (
                        <Text key={idx}>{part}</Text>
                        )
                    )}
                    </Text>
                    {/* 버튼 출력 */}
                    {msg.buttons && msg.isActive && (
                    <View style={{ marginTop: 10 }}>
                        {msg.buttons.map((btn, j) => (
                        <TouchableOpacity
                            key={j}
                            style={styles.mainButton}
                            onPress={() => handleButton(btn.value, btn.label)}
                        >
                            <Text style={styles.mainButtonText}>{btn.label}</Text>
                        </TouchableOpacity>
                        ))}
                    </View>
                    )}
                </View>
                </View>
            );
            }

          // 내 답변(회색 말풍선)
          if (msg.type === 'user') {
            return (
              <View style={styles.userBubble} key={i}>
                <Text style={styles.userText}>{msg.text}</Text>
              </View>
            );
          }
        })}
      </ScrollView>
    </View>
  );
}

// Figma 기반 반응형 스타일시트 (카테고리/도/시/정보 안내 말풍선 + 전체 공통 스타일)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7FC',
  },
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Roboto',
    fontWeight: '400',
    color: '#000000',
    maxWidth: 120,
    textAlign: 'center',
  },
  sideButton: {
    width: 32,
    zIndex: 1,
  },
  headerLine: {
    height: 1,
    backgroundColor: '#999999',
    marginHorizontal: 16,
  },
  chatArea: {
    flex: 1,
    padding: 14,
  },
  chatBotIconRow: {
  width: 28,
  height: 28,
  marginLeft: 8,      // Figma 예시처럼 왼쪽 여백
  marginBottom: -12,  // 말풍선 상단에 겹치게
  zIndex: 10,
  },

  botBubble: {
    width: width * (321 / 390),
    minWidth: 200,
    maxWidth: 340,
    minHeight: 160,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderWidth: 3,
    borderColor: '#928CFF',
    backgroundColor: '#fff',
    marginLeft: width * (16/390),
    marginTop: 12,
    padding: 18,
    alignSelf: 'flex-start',
  },
  // 4차 카테고리 선택 프레임(더 좁음)
  categoryBubble: {
    width: width * (269 / 390),
    minWidth: 180,
    maxWidth: 320,
    minHeight: 160,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderWidth: 3,
    borderColor: '#928CFF',
    backgroundColor: '#fff',
    marginLeft: width * (19 / 390),
    marginTop: 12,
    padding: 18,
    alignSelf: 'flex-start',
  },
  botBubbleTitle: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 25,
    color: '#000',
    textAlign: 'left',
    width: width * (273/390),
    marginBottom: 8,
  },
  provinceButtonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  provinceButton: {
    width: width * (85/390),
    height: 28,
    borderRadius: 5,
    backgroundColor: '#9893EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * (9/390),
    marginBottom: 10,
  },
  provinceButtonText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  prevButtonFull: {
    width: '100%',
    height: 28,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  prevButtonText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  mainButton: {
    width: '100%',
    height: 28,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainButtonText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  userBubble: {
    backgroundColor: '#7E7E7E',
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderBottomLeftRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginVertical: 6,
    alignSelf: 'flex-end',
    maxWidth: '80%',
    marginTop: 20,
  },
  userText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  // 3차 시 선택 전용 스타일
  cityTopBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cityTopButton: {
    width: width * (133/390),
    height: 28,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityButtonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  cityButton: {
    width: width * (85/390),
    height: 28,
    borderRadius: 5,
    backgroundColor: '#948FE0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * (9/390),
    marginBottom: 10,
  },
  cityButtonText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  // 4차 카테고리 선택 전용 스타일
  categoryTitle: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 25,
    color: '#000',
    textAlign: 'left',
    marginBottom: 12,
    width: width * (221/390),
    alignSelf: 'center',
  },
  categoryBtnWrap: {
    marginTop: 12,
  },
  categoryButton: {
    width: width * (221/390),
    height: 28,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  categoryButtonText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  // 5차 정보 안내 말풍선 (좁은 프레임)
  resultBubble: {
    width: width * (269 / 390),
    minWidth: 180,
    maxWidth: 320,
    minHeight: 90,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#928CFF',
    backgroundColor: '#fff',
    marginLeft: width * (19 / 390),
    marginTop: 12,
    padding: 18,
    alignSelf: 'flex-start',
  },
  resultText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
  },
});
