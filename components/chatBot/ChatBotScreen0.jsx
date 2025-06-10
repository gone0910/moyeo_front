// components/chatBot/ChatBotScreen.jsx
// 도/시 한 말풍선(합체), 지나간 말풍선/버튼 disable(흑백), '이전하기' 플로우까지 한방에 동작

import React, { useRef, useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import ChatBotIcon from '../icons/ChatBotIcon';
import { useNavigation } from '@react-navigation/native';
import { REGION_MAP } from '../common/regionMap';
// import ChatBotIcon from '../../assets/icons/ChatBotIcon'; // 아이콘 사용
import * as Location from 'expo-location'; // 현재 위치기반
import ResultSightBubble from './ResultSightBubble';
import ResultFoodBubble from './ResultFoodBubble';
import ResultHotelBubble from './ResultHotelBubble';
import ResultEventBubble from './ResultEventBubble';
import ResultWeatherBubble from './ResultWeatherBubble';



const { width } = Dimensions.get('window');
// 광역시 목록
const METROPOLITAN_CITIES = [
  '부산', '대구', '인천', '광주', '대전', '울산', '세종'
];
// 도만 필터링 (광역시 제외)
const provinces = Object.keys(REGION_MAP).filter(
  name => !METROPOLITAN_CITIES.includes(name)
);

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

const CATEGORY_LIST = [
  { label: '관광지', value: 'sight' },
  { label: '맛집/카페', value: 'food' },
  { label: '숙소', value: 'hotel' },
  { label: '축제/이벤트', value: 'event' },
  { label: '날씨', value: 'weather' },
];

export default function ChatBotScreen() {
  const [messages, setMessages] = useState(initialMessages);
  const [regionStep, setRegionStep] = useState(''); // '', 'province', 'city', 'done'
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const navigation = useNavigation();
  const scrollRef = useRef();
    // 스크롤 및 챗봇 포커싱
    useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);


  // 인터렉션 핸들러 선언
  // "처음으로" - 1차 말풍선으로 복귀
  const handleToFirst = () => {
    setMessages([
      ...messages.map(m => ({ ...m, isActive: false })),
      { ...initialMessages[0], isActive: true },
    ]);
    setRegionStep('');
    setSelectedProvince(null);
    setSelectedCity(null);
  };
  // "카테고리 변경" - 4차 카테고리 말풍선으로 복귀
  const handleToCategory = () => {
    // 이미 카테고리 말풍선이 active면 무시
    const alreadyCategory = messages.some(
      m => m.type === 'bot' && m.custom === 'category' && m.isActive
    );
    if (alreadyCategory) return;
    setMessages([
      ...messages.map(m => ({ ...m, isActive: false })),
      {
        type: 'bot',
        text: '정보 제공을 원하시는 카테고리를 선택해 주세요.',
        isActive: true,
        custom: 'category',
      },
    ]);
    setRegionStep('done');
  };

  // "리스트 재조회" - 5차(결과) 말풍선일 때만 동작
  const handleListReload = () => {
    const lastBot = messages.slice().reverse().find(m => m.type === 'bot' && m.custom === 'result');
    if (!lastBot) return;
    // 👉 여기에 실제 리스트 재조회 로직 (API 재요청 등) 넣으세요
    setMessages([
      ...messages,
      {
        ...lastBot,
        text: `${lastBot.catLabel} 정보를 새로 불러왔어요!`,
        isActive: true,
      },
    ]);
  };

  // 버튼 클릭 처리
  const handleButton = async (value, label) => {
  const updated = messages.map(m => ({ ...m, isActive: false }));

  // '이전으로' 클릭 시 (언제든 1차 안내 복귀)
  if (value === 'prev') {
    updated.push({ type: 'bot', ...initialMessages[0], isActive: true });
    setSelectedProvince(null);
    setSelectedCity(null);
    setRegionStep('');
  }

  // === [여기에 아래 코드 붙여넣기!] ===
  else if (value === 'currentLocation') {
    // ① 내 대답 말풍선 추가
    updated.push({ type: 'user', text: label });
    setMessages([...updated]);

    // ② 위치권한 팝업 요청 (권한 거부/허용 모두 대응)
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      // ③ 권한 거부 안내 봇 말풍선
      updated.push({
        type: 'bot',
        text: '위치 정보 접근이 거부되었습니다. 위치기반 서비스 이용이 제한됩니다.',
        isActive: true,
      });
      setMessages([...updated]);
      return;
    }
    // ④ 권한 허용: 실제 위치값 얻기(터미널에 출력)
    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    console.log('현재 위치:', latitude, longitude); // <- 위도 경도 로그그

    // ⑤ 카테고리 선택 말풍선 추가
    updated.push({
      type: 'bot',
      text: '정보 제공을 원하시는 카테고리를 선택해 주세요.',
      isActive: true,
      custom: 'category',
    });
    setMessages([...updated]);
    return;
  }

    // 1차 안내 → 도/시 합체 말풍선
    else if (value === 'destination') {
      setSelectedProvince(null);
      setSelectedCity(null);
      setRegionStep('province');
      updated.push({
        type: 'bot',
        text: '목적지를 선택해주세요.',
        isActive: true,
        custom: 'region',
        step: 'province',
      });
    }
    // 도 선택 → 시 리스트 노출 (말풍선 재사용)
    else if (regionStep === 'province' && provinces.includes(value)) {
      setSelectedProvince(value);
      setRegionStep('city');
      updated.push({ type: 'user', text: value });
      updated.push({
        type: 'bot',
        text: '목적지를 선택해주세요.',
        isActive: true,
        custom: 'region',
        step: 'city',
        province: value,
      });
    }
    // 시 선택 or 선택없음
    else if (regionStep === 'city' && selectedProvince && (REGION_MAP[selectedProvince].some(city => city.name === value) || value === '선택안함')) {
      setSelectedCity(value === '선택안함' ? null : value);
      setRegionStep('done');
      updated.push({ type: 'user', text: label });
      updated.push({
        type: 'bot',
        text: '정보 제공을 원하시는 카테고리를 선택해 주세요.',
        isActive: true,
        custom: 'category',
      });
    }
    // 카테고리 선택
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

  // 도/시 합체 말풍선 (disable/흑백/이전처리)
  const renderRegionBubble = (key, step, province) => {
    const isActive = messages[key]?.isActive;
    let cityList = province ? REGION_MAP[province] : [];
    return (
      <View key={key} style={{ marginBottom: 0, opacity: isActive ? 1 : 0.5 }}>
        <View style={styles.chatBotIconRow}>
          <ChatBotIcon width={28} height={28} />
        </View>
        <View style={[styles.botBubble, !isActive && styles.disabledBubble]}>
          <Text style={styles.botBubbleTitle}>목적지를 선택해주세요.</Text>
          {/* 도 선택 단계 */}
          {step === 'province' && (
            <>
              <TouchableOpacity
                style={[styles.prevButtonFull, !isActive && styles.disabledButton]}
                onPress={() => handleButton('prev', '이전으로')}
                disabled={!isActive}
              >
                <Text style={[styles.prevButtonText, !isActive && styles.disabledButtonText]}>이전으로</Text>
              </TouchableOpacity>
              <View style={styles.provinceButtonWrap}>
                {provinces.map((prov, idx) => (
                  <TouchableOpacity
                    key={prov}
                    style={[styles.provinceButton, !isActive && styles.disabledButton, (idx + 1) % 3 === 0 && { marginRight: 0 }]}
                    onPress={() => handleButton(prov, prov)}
                    disabled={!isActive}
                  >
                    <Text style={[styles.provinceButtonText, !isActive && styles.disabledButtonText]}>{prov}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          {/* 시 선택 단계 */}
          {step === 'city' && (
            <>
              <View style={styles.cityTopBtnRow}>
                <TouchableOpacity
                  style={[styles.cityTopButton, !isActive && styles.disabledButton]}
                  onPress={() => handleButton('prev', '이전하기')}
                  disabled={!isActive}
                >
                  <Text style={[styles.prevButtonText, !isActive && styles.disabledButtonText]}>이전으로</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cityTopButton, !isActive && styles.disabledButton]}
                  onPress={() => handleButton('선택안함', '선택없음')}
                  disabled={!isActive}
                >
                  <Text style={[styles.prevButtonText, !isActive && styles.disabledButtonText]}>선택없음</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cityButtonWrap}>
                {cityList.map((city, idx) => (
                  <TouchableOpacity
                    key={city.name}
                    style={[styles.cityButton, !isActive && styles.disabledButton, (idx + 1) % 3 === 0 && { marginRight: 0 }]}
                    onPress={() => handleButton(city.name, city.name)}
                    disabled={!isActive}
                  >
                    <Text style={[styles.cityButtonText, !isActive && styles.disabledButtonText]}>{city.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

    // 1. 인터렉션 버튼 및 wrapper 컴포넌트트
  const BotMessageBlock = ({ children, showButtons = false }) => (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.chatBotIconRow}>
        <ChatBotIcon width={28} height={28} />
        {/* 또는 <ChatBotIcon size={28} /> */}
      </View>
      {children}
      {showButtons && (
        <View style={styles.interactionBtnRow}>
          <TouchableOpacity style={styles.interactionBtn} onPress={handleToFirst}>
            <Text style={styles.interactionBtnText}>처음으로</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionBtn} onPress={handleToCategory}>
            <Text style={styles.interactionBtnText}>카테고리 변경</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionBtn} onPress={handleListReload}>
            <Text style={styles.interactionBtnText}>리스트 재조회</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );


  // 카테고리 말풍선 
  const renderCategoryBubble = (key) => (
    <BotMessageBlock showButtons={true} key={key}>
      <View style={[styles.categoryBubble, !messages[key]?.isActive && styles.disabledBubble,
                                              { opacity: messages[key]?.isActive ? 1 : 0.5 }]}>
        <Text style={styles.categoryTitle}>정보 제공을 원하시는 카테고리를 선택해 주세요.</Text>
        <View style={styles.categoryBtnWrap}>
          {CATEGORY_LIST.map((cat, idx) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.categoryButton, !messages[key]?.isActive && styles.disabledButton]}
              onPress={() => handleButton(cat.value, cat.label)}
              disabled={!messages[key]?.isActive}
            >
              <Text style={[styles.categoryButtonText, !messages[key]?.isActive && styles.disabledButtonText]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </BotMessageBlock>
  );

  // 3. 결과 말풍선 (5차)
  const renderResultBubble = (key, catLabel) => {
    let CardListComp = null;
    if (catLabel === '관광지') CardListComp = <ResultSightBubble key={key} />;
    else if (catLabel === '맛집/카페') CardListComp = <ResultFoodBubble key={key} />;
    else if (catLabel === '숙소') CardListComp = <ResultHotelBubble key={key} />;
    else if (catLabel === '축제/이벤트') CardListComp = <ResultEventBubble key={key} />;
    else if (catLabel === '날씨') CardListComp = <ResultWeatherBubble key={key} />;


    return (
      <BotMessageBlock showButtons={true} key={key}>
        {/* 5차 안내 말풍선(타이틀, 카테고리 안내) */}
        <View style={[styles.resultBubble, !messages[key]?.isActive && styles.disabledBubble]}>
          <Text style={styles.resultText}>
            {selectedProvince}
            {selectedCity ? ` ${selectedCity}` : ''}의{' '}
            <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>{catLabel}</Text> 정보입니다.
          </Text>
        </View>
        {/* 카드리스트(Bubble) */}
        {CardListComp}
        {/* BotMessageBlock 하단의 인터랙션 버튼이 자동으로 붙음 */}
      </BotMessageBlock>
    );
  };


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
      <ScrollView style={styles.chatArea} ref={scrollRef} contentContainerStyle={{ paddingBottom: 120 }}
      >
        {messages.map((msg, i) => {
          // 도/시 합체 말풍선 (단계에 따라 렌더)
          if (msg.type === 'bot' && msg.custom === 'region') {
            return renderRegionBubble(i, msg.step, msg.province);
          }
          // 카테고리/결과 안내 등
          if (msg.type === 'bot' && msg.custom === 'category') {
            return renderCategoryBubble(i);
          }
          if (msg.type === 'bot' && msg.custom === 'result') {
            return renderResultBubble(i, msg.catLabel);
          }
          // 1차 안내/버튼 (기본 챗봇 말풍선)
          if (msg.type === 'bot') {
            return (
              <View key={i} style={{ marginBottom: 0, opacity: msg.isActive ? 1 : 0.5 }}>
                <View style={styles.chatBotIconRow}>
                  <ChatBotIcon width={28} height={28} />
                </View>
                <View style={[styles.botBubble, !msg.isActive && styles.disabledBubble]}>
                  <Text style={{ fontSize: 14, lineHeight: 22 }}>
                    {msg.text.split(/(목적지 관련 정보제공|현재 위치 기반 정보제공)/g).map((part, idx) =>
                      part === '목적지 관련 정보제공' || part === '현재 위치 기반 정보제공'
                        ? <Text key={idx} style={{ color: '#928CFF', fontWeight: 'bold' }}>{part}</Text>
                        : <Text key={idx}>{part}</Text>
                    )}
                  </Text>
                  {msg.buttons && (
                    <View style={{ marginTop: 10 }}>
                      {msg.buttons.map((btn, j) => (
                        <TouchableOpacity
                          key={j}
                          style={[styles.mainButton, !msg.isActive && styles.disabledButton]}
                          onPress={() => handleButton(btn.value, btn.label)}
                          disabled={!msg.isActive}
                        >
                          <Text style={[styles.mainButtonText, !msg.isActive && styles.disabledButtonText]}>{btn.label}</Text>
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
 // stylesheet 생략
});
