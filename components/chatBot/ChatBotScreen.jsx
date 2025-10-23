// components/chatBot/ChatBotScreen.jsx
// 도/시 한 말풍선(합체), 지나간 말풍선/버튼 disable(흑백), '이전하기' 플로우까지 한방에 동작

import React, { useRef, useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryByDestination, queryByGPS, recreateByDestination, recreateByGPS } from '../../api/chatBot';
import LottieLoader from '../common/LottieLoader';
import { SafeAreaView } from "react-native-safe-area-context"; // ✅ 추가됨


const { width } = Dimensions.get('window');
const scale = (size) => width * (size / 390);

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
    text: '여행 챗봇은 목적지 선택 또는\n현재 위치 기반 으로 다양한 여행 정보를 제공해 드려요.',
    buttons: [
      { label: '목적지 관련 정보제공', value: 'destination' },
      { label: '현재 위치 기반 정보제공', value: 'currentLocation' }
    ],
    isActive: true,
  }
];
const CATEGORY_LIST = [
  { label: '관광지', value: 'SPOT' },      
  { label: '맛집/카페', value: 'FOOD' },   
  { label: '숙소', value: 'HOTEL' },       
  { label: '축제/이벤트', value: 'FESTIVAL' }, 
  { label: '날씨', value: 'WEATHER' },    
];

export default function ChatBotScreen() {
  const [messages, setMessages] = useState(initialMessages);
  const [regionStep, setRegionStep] = useState(''); // '', 'province', 'city', 'done'
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [locationCoords, setLocationCoords] = useState(null); // ✅ 현재 위치 좌표 저장
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
      { type: 'user', text: '처음으로' },
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
      { type: 'user', text: '카테고리 변경' },
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
  const handleListReload = async () => {
    const lastBot = messages.slice().reverse().find(m => m.type === 'bot' && m.custom === 'result');
    if (!lastBot) return;

    const { catLabel, catValue, resultData } = lastBot;

    const excludedNames = resultData?.map(item => item.name).filter(Boolean) || [];

    // 토큰 확보
    const token = await AsyncStorage.getItem('jwt');

        // 메시지 갱신
    const updated = messages.map(m => ({ ...m, isActive: false }));

    updated.push({
      type: 'user',
      text: '리스트 재조회',
    });

    // 로딩 말풍선 추가!
    updated.push({
      type: 'bot',
      text: '재조회 중입니다...',
      isActive: false,
      custom: 'loading',
    });
    
    setMessages([...updated]);

    let newResult = [];
    try {
      if (selectedCity) {
        const res = await recreateByDestination({
          city: selectedCity,
          category: catValue,
          excludedNames,
        },
        token
      );
        console.log('[재조회 응답 확인] 목적지 기반:', res);
        newResult = res;
      } else if (locationCoords) {
        const res = await recreateByGPS({
          latitude: locationCoords.latitude,
          longitude: locationCoords.longitude,
          category: catValue,
          excludedNames,
        },
        token,
      );
        console.log('[재조회 응답 확인] GPS 기반:', res);
        newResult = res;
      } else {
        console.warn('⛔ 위치 정보 또는 도시 정보 없음. 재조회 불가.');
      }
    } catch (error) {
      console.error('[재조회 API 호출 실패]', error);
    }

    // 로딩 말풍선을 지우고, 결과 안내만 갱신
    const cleared = updated.filter(m => m.custom !== 'loading');
    cleared.push({
      ...lastBot,
      isActive: true,
      resultData: newResult,  // 결과만 최신화 (text는 건드리지 않음)
    });

    setMessages([...cleared]);
  };

  // 버튼 클릭 처리
  const handleButton = async (value, label) => {
  const updated = messages.map(m => ({ ...m, isActive: false }));

  // '이전으로' 클릭 시 (언제든 1차 안내 복귀)
  if (value === 'prev') {
    updated.push({ type: 'user', text: label });

  if (regionStep === 'city') {
    // ✅ 시 단계에서는 도 선택 말풍선으로 복귀
    setRegionStep('province');
    setSelectedCity(null);
    const updatedMsg = messages.map(m => ({ ...m, isActive: false }));
    updatedMsg.push({
      type: 'bot',
      text: '목적지를 선택해주세요.',
      isActive: true,
      custom: 'region',
      step: 'province',
    });
    setMessages(updatedMsg);
    return;

  } else {
    // ✅ 그 외에는 1차 안내로 복귀
    const updatedMsg = messages.map(m => ({ ...m, isActive: false }));
    updatedMsg.push({ type: 'bot', ...initialMessages[0], isActive: true });
    setSelectedProvince(null);
    setSelectedCity(null);
    setRegionStep('');
    setMessages(updatedMsg);
    return;
  }
}
  // === [여기에 아래 코드 붙여넣기!] ===
  else if (value === 'currentLocation') {
    // 내 대답 말풍선 추가
    updated.push({ type: 'user', text: label });

    // 로딩 말풍선 추가
    updated.push({
      type: 'bot',
      text: '위치를 수집 중입니다...',
      isActive: false,
      custom: 'loading',
    });

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
    console.log('현재 위치:', latitude, longitude); // <- 위도 경도 로그출력
    setLocationCoords({ latitude, longitude });    // 이후 카테고리 선택/재조회에서 사용 가능

    const cleared = updated.filter(m => m.custom !== 'loading');

    // ⑤ 카테고리 선택 말풍선 추가
    cleared.push({
      type: 'bot',
      text: '정보 제공을 원하시는 카테고리를 선택해 주세요.',
      isActive: true,
      custom: 'category',
    });
    setMessages([...cleared]);
    return;
  }

    // 1차 안내 → 도/시 합체 말풍선
    else if (value === 'destination') {
      console.log('목적지 관련 정보제공 버튼 클릭됨');
      setSelectedProvince(null);
      setSelectedCity(null);
      setRegionStep('province');
      updated.push({ type: 'user', text: label }); // 대답말풍선
      updated.push({
        type: 'bot',
        text: '도 정보를 입력하세요.',
        isActive: true,
        custom: 'region',
        step: 'province',
      });
      setMessages(updated); // ✅ 추가!
      return; // ✅ 아래 코드와 겹치지 않도록 return!
    }
    // 도 선택 → 시 리스트 노출 (말풍선 재사용)
    else if (regionStep === 'province' && provinces.includes(value)) {
      setSelectedProvince(value);
      setRegionStep('city');
      updated.push({ type: 'user', text: value });
      updated.push({
        type: 'bot',
        text: '시 정보를 입력하세요.',
        isActive: true,
        custom: 'region',
        step: 'city',
        province: value,
      });
      setMessages(updated); 
      return;
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
      setMessages(updated); // ✅
      return;
    }
    // 카테고리 선택
    else if (CATEGORY_LIST.some(cat => cat.value === value)) {
      const catObj = CATEGORY_LIST.find(cat => cat.value === value);
      updated.push({ type: 'user', text: catObj.label });

      // 1 로딩 메시지 추가
      updated.push({
        type: 'bot',
        text: '정보를 불러오고 있어요...',
        isActive: false,
        custom: 'loading',
      });
      setMessages(updated); // 중간 반영

      // JWT 토큰 가져오기 (예시: AsyncStorage 또는 Context)
      const token = await AsyncStorage.getItem('jwt');

      // 위치 or 목적지 기준 요청 "queryByDestination"
      let resultData = [];

        // 호출 직전 주요 변수 상태 로그 추가
  console.log('[디버깅] selectedProvince:', selectedProvince);
  console.log('[디버깅] selectedCity:', selectedCity);
  console.log('[디버깅] locationCoords:', locationCoords);
  console.log('[디버깅] category value:', value);
  console.log('[디버깅] token 존재 여부:', !!token);
      try {
        if (selectedCity) {
          // 선택된 province와 city 객체를 REGION_MAP에서 찾아야 함
          const cityObj = REGION_MAP[selectedProvince]?.find(city => city.name === selectedCity);
          const cityCode = cityObj?.code; // 예: 'GANGNAM_GU'

            const requestBody = {
    city: cityCode,      // 명세서 key와 일치!
    category: value,
  };

  // 여기에 명확한 로그!
  console.log('[API 전송 바디] 실제 body:', JSON.stringify(requestBody, null, 2));
  console.log('[API 전송 헤더] Authorization:', token ? `Bearer ${token}` : '없음');

          const res = await queryByDestination({
            city: cityCode, // 영문 ENUM을 API에 보냄
            category: value,
          },
          token,
        );
         console.log('[응답 도착] queryByDestination 결과:', res);
          console.log('전송 city code:', cityCode, '선택한 도:', selectedProvince, '선택한 시:', selectedCity);
          resultData = res;
        } else if (locationCoords) {
          console.log('[API 요청 준비]', {
          latitude: locationCoords.latitude,
          longitude: locationCoords.longitude,
          category: value,
          token
        });
          const res = await queryByGPS({
            latitude: locationCoords.latitude,
            longitude: locationCoords.longitude,
            category: value,
          },
          token
        );
          console.log('[API 응답 확인] 현재 위치 기반 응답:', res);
          resultData = res;
        } else {
          console.warn('⛔ 위치 또는 목적지가 설정되지 않았습니다.');
        }
      } catch (error) {
        console.error('[❌ API 호출 오류]', error?.response?.data || error.message || error);
          if (error.response) console.error('error.response:', error.response);
  if (error.request) console.error('error.request:', error.request);
  if (error.config) console.error('error.config:', error.config);
  return { success: false, error: error?.response?.data?.message || error.message };
      }

// 상태 업데이트 전 로그 (디버깅용)
// console.log('setMessages 호출 전 messages:', messages);

const cleared = updated.filter(m => m.custom !== 'loading');

// 불변성 보장 위해 새 배열 생성
const newMessages = [...cleared].map(m => ({ ...m, isActive: false }));

newMessages.push({
  type: 'bot',
  text: '정보 결과 안내',
  isActive: true,
  custom: 'result',
  catLabel: catObj.label,
  catValue: value,
  resultData,
  province: selectedProvince,
  city: selectedCity,
});

// 상태 업데이트 전 새 배열 로그 (디버깅용)
// console.log('setMessages 할 새 배열:', JSON.stringify(newMessages, null, 2));

setMessages(newMessages);
}
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
          <Text style={styles.botBubbleTitle}>
            {step === 'province'
              ? '도 정보를 입력해주세요.'
              : step === 'city'
                ? '시 정보를 입력해주세요.'
                : '목적지를 선택해주세요.'}
          </Text>
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
                  style={[styles.prevButtonFull, !isActive && styles.disabledButton]}
                  onPress={() => handleButton('prev', '이전하기')}
                  disabled={!isActive}
                >
                  <Text style={[styles.prevButtonText, !isActive && styles.disabledButtonText]}>이전으로</Text>
                </TouchableOpacity>
                {/* <TouchableOpacity
                  style={[styles.cityTopButton, !isActive && styles.disabledButton]}
                  onPress={() => handleButton('선택안함', '선택없음')}
                  disabled={!isActive}
                >
                  <Text style={[styles.prevButtonText, !isActive && styles.disabledButtonText]}>선택없음</Text>
                </TouchableOpacity> */}
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
  const BotMessageBlock = ({ children, showButtons = false, isActive = true,
    enableToFirst = true, enableToCategory = true, enableListReload = true,
   }) => (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.chatBotIconRow}>
        <ChatBotIcon width={28} height={28} />
        {/* 또는 <ChatBotIcon size={28} /> */}
      </View>
      {children}
      {showButtons && (
        // [ADDED] 세그먼트 전체 컨테이너 (Figma: 269 x 28, 가운데 정렬)
        <View style={styles.segmentRow}>
          {/* 처음으로 (Left) */}
          <TouchableOpacity
            style={[
              styles.segBtnBase,
              styles.segLeft,
              (!isActive || !enableToFirst) && styles.segDisabled, // [ADDED] 비활성 Border 처리
            ]}
            onPress={isActive && enableToFirst ? handleToFirst : undefined}
            disabled={!isActive || !enableToFirst}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segText,
                (!isActive || !enableToFirst) && styles.segTextDisabled, // [ADDED] 비활성 텍스트 처리
              ]}
            >
              처음으로
            </Text>
          </TouchableOpacity>

          {/* 카테고리 변경 (Middle) */}
          <TouchableOpacity
            style={[
              styles.segBtnBase,
              styles.segMiddle,
              (!isActive || !enableToCategory) && styles.segDisabled,
            ]}
            onPress={isActive && enableToCategory ? handleToCategory : undefined}
            disabled={!isActive || !enableToCategory}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segText,
                (!isActive || !enableToCategory) && styles.segTextDisabled,
              ]}
            >
              카테고리 변경
            </Text>
          </TouchableOpacity>

          {/* 리스트 재조회 (Right) */}
          <TouchableOpacity
            style={[
              styles.segBtnBase,
              styles.segRight,
              (!isActive || !enableListReload) && styles.segDisabled,
            ]}
            onPress={isActive && enableListReload ? handleListReload : undefined}
            disabled={!isActive || !enableListReload}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segText,
                (!isActive || !enableListReload) && styles.segTextDisabled,
              ]}
            >
              리스트 재조회
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );


  // 카테고리 말풍선 
  const renderCategoryBubble = (key) => (
    <BotMessageBlock showButtons={true} isActive={messages[key]?.isActive}
    enableToFirst={true} enableToCategory={false} enableListReload={false} key={key}>

      <View style={[styles.categoryBubble, !messages[key]?.isActive && styles.disabledBubble,
                                              { opacity: messages[key]?.isActive ? 1 : 0.5 }]}>
        <Text style={styles.categoryTitle}>
            정보 제공을 원하시는 
            <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}> 카테고리</Text>
            를 선택해 주세요.
        </Text>
        <View style={styles.categoryBtnWrap}>
          {CATEGORY_LIST.map((cat, idx) => {
            const isFullWidth = cat.value === 'WEATHER'; // 날씨만 1열 전체 너비 사용

            const btnStyle = isFullWidth ? styles.categoryButtonFull : styles.categoryButton;
            const textStyle = isFullWidth ? styles.categoryButtonTextFull : styles.categoryButtonText;

            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  btnStyle, 
                  !messages[key]?.isActive && styles.disabledButton
                ]}
                onPress={() => handleButton(cat.value, cat.label)}
                disabled={!messages[key]?.isActive}
              >
                <Text 
                  style={[
                    textStyle, 
                    !messages[key]?.isActive && styles.disabledButtonText
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </BotMessageBlock>
  );

  // 3. 결과 말풍선 (5차)
  const renderResultBubble = (key, catLabel, msg) => {
    const data = msg.resultData;

    let CardListComp = null;
    if (catLabel === '관광지') CardListComp = <ResultSightBubble data={data} />;
    else if (catLabel === '맛집/카페') CardListComp = <ResultFoodBubble data={data} />;
    else if (catLabel === '숙소') CardListComp = <ResultHotelBubble data={data} />;
    else if (catLabel === '축제/이벤트') CardListComp = <ResultEventBubble data={data} />;
    else if (catLabel === '날씨') CardListComp = <ResultWeatherBubble data={data} />;

    return (
      <BotMessageBlock showButtons={true} isActive={msg.isActive}
       enableToFirst={true} enableToCategory={true} e enableListReload={msg.catValue !== 'WEATHER'} // 날씨도 비활성화 분기 추가.
        key={key}>
        
          {/* 5차 안내 말풍선(타이틀, 카테고리 안내) */}
        <View style={[styles.resultBubble, !msg.isActive && styles.disabledBubble]}>
          <Text style={styles.resultText}>
            {msg.province || msg.city
              ? `${msg.province ? msg.province : ''}${msg.city ? ' ' + msg.city : ''}의 `
              : '내 주변의 '}
            <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>{msg.catLabel}</Text> 추천 정보입니다.
          </Text>
        </View>
        {/* 카드리스트(Bubble) */}
        {CardListComp}
      {/* BotMessageBlock 하단의 인터랙션 버튼이 자동으로 붙음 */}
      </BotMessageBlock>
    );
  };


  return (
    <SafeAreaView style={styles.container}> {/* ✅ SafeAreaView 적용 */}
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('BottomTab')} 
          style={styles.sideButton} 
          accessibilityLabel="뒤로가기"
        >
          {/* Ionicons 아이콘 사용 (EditProfileScreen과 통일) */}
          <Ionicons name="chevron-back" size={scale(24)} color="#111111" />
        </TouchableOpacity>
        {/* [CHANGED] centerWrapper 없이, 버튼과 붙도록 왼쪽에서 시작 */}
        <Text style={styles.headerTitle}>챗봇</Text>
        {/* 우측 빈 공간 처리 (공간 확보 목적) */}
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
            return renderResultBubble(i, msg.catLabel, msg);
          }
          // 1차 안내/버튼 (기본 챗봇 말풍선)
          if (msg.type === 'bot') {
            const isLoading = msg.custom === 'loading'; // 로딩 메시지 여부
            return (
              <View key={i} style={{ marginBottom: 0, opacity: msg.isActive ? 1 : 0.5 }}>
                <View style={styles.chatBotIconRow}>
                  <ChatBotIcon width={28} height={28} />
                </View>
                <View style={[styles.botBubble, !msg.isActive && styles.disabledBubble,isLoading && styles.loadingBubble]}>
                  {isLoading && (
                    <View style={{ marginBottom: 8 }}>
                      <LottieLoader />
                    </View>
                  )} {/* ✅ Lottie 삽입 */}
                  <Text style={{ fontSize: 14, lineHeight: 22 }}>
                    {msg.text.split(/(목적지 선택|현재 위치 기반)/g).map((part, idx) =>
                      part === '목적지 선택' || part === '현재 위치 기반'
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
    </SafeAreaView> // ✅ SafeAreaView 적용
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // [CHANGED] 배경색을 흰색으로 통일 (헤더와 내용 일관성 위해)
    backgroundColor: '#FFFFFF',
  },
header: {
    height: scale(56),              
    flexDirection: 'row',
    alignItems: 'center',
    // [CHANGED] 좌측 정렬 유지 (아이콘과 제목이 붙음)
    justifyContent: 'flex-start',
    paddingTop: 0,          
    paddingHorizontal: scale(20), // 좌우 패딩 20px
    backgroundColor: '#FFFFFF', 
    position: 'relative',
    // [REMOVED] centerWrapper 스타일 제거
  },
  // [REMOVED] centerWrapper 스타일 제거

  headerTitle: {
    fontSize: scale(20),            
    fontFamily: 'Roboto',
    fontWeight: '500',
    color: '#111111',
    letterSpacing: -0.3,
    // [CHANGED] 뒤로가기 버튼과의 좌측 마진 8px만 적용
    marginLeft: scale(8), 
    // [REMOVED] position: 'absolute', left: 0, right: 0, textAlign: 'center'
    //          -> 아이콘 옆에 붙어 보이게 함
  },
  sideButton: {
    width: scale(24),
    height: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    // [CHANGED] 우측의 빈 sideButton이 화면 가장 오른쪽으로 가지 않도록 zIndex 및 width 유지
    zIndex: 1,
  },
  // [CHANGED] 헤더 라인은 제거하거나, EditProfile의 #E5E5EC로 변경 가능
  headerLine: {
    height: scale(1),               
    backgroundColor: '#FFFFFF', // EditProfile 스타일 통일
    marginHorizontal: 0, // [CHANGED] 헤더 너비 전체를 따라가도록 마진 제거
  },
  chatArea: {
    flex: 1,
    padding: scale(14),             
  },
  chatBotIconRow: {
    width: scale(28),               
    height: scale(28),              
    marginLeft: scale(8),           
    marginTop: scale(15),           
    marginBottom: scale(-5),        
    zIndex: 10,
  },

  botBubble: {
    width: scale(271),              
    minWidth: scale(200),           
    maxWidth: scale(340),           
    minHeight: scale(160),          
    borderTopRightRadius: scale(20),
    borderBottomRightRadius: scale(20),
    borderBottomLeftRadius: scale(20),
    borderWidth: scale(3),          
    borderColor: '#928CFF',
    backgroundColor: '#fff',
    marginLeft: scale(16),          
    marginTop: scale(12),           
    padding: scale(18),             
    alignSelf: 'flex-start',
  },
  categoryBubble: {
    width: scale(269),
    minWidth: scale(180),
    maxWidth: scale(320),
    minHeight: scale(160),
    borderTopRightRadius: scale(20),
    borderBottomRightRadius: scale(20),
    borderBottomLeftRadius: scale(20),
    borderWidth: scale(3),
    borderColor: '#928CFF',
    backgroundColor: '#fff',
    marginLeft: scale(19),
    marginTop: scale(12),
    padding: scale(18),
    alignSelf: 'flex-start',
  },
  botBubbleTitle: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(25),
    color: '#000',
    textAlign: 'left',
    width: scale(273),
    marginBottom: scale(8),
  },
  provinceButtonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  provinceButton: {
    width: scale(70),  // 도값 버튼 가로 길이이
    height: scale(28),
    borderRadius: scale(5),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(9),
    marginBottom: scale(10),
    borderWidth: scale(1),         // 테두리 두께
    borderColor: '#9893EB',
  },
  provinceButtonText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    color: '#9893EB',
    textAlign: 'center',
  },
  prevButtonFull: {
    width: '100%',
    height: scale(28),
    borderRadius: scale(5),
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  prevButtonText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    color: '#fff',
    textAlign: 'center',
  },
  mainButton: {
    width: '100%',
    height: scale(28),
    borderRadius: scale(6),
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  mainButtonText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    color: '#fff',
    textAlign: 'center',
  },
  userBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(14),
    borderBottomRightRadius: scale(14),
    borderBottomLeftRadius: scale(14),
    paddingVertical: scale(10),
    paddingHorizontal: scale(18),
    marginVertical: scale(6),
    alignSelf: 'flex-end',
    maxWidth: '80%',
    marginTop: scale(20),
    borderWidth: scale(3),         // 테두리 두께
    borderColor: '#7E7E7E',
  },
  userText: {
    color: '#7E7E7E',
    fontSize: scale(14),
    textAlign: 'center',
  },
  cityTopBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(8),
  },
  cityTopButton: {
    width: scale(123),
    height: scale(28),
    borderRadius: scale(5),
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
    width: scale(70),
    height: scale(28),
    borderRadius: scale(5),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(9),
    marginBottom: scale(10),
    borderWidth: scale(1),         // 테두리 두께
    borderColor: '#9893EB',
  },
  cityButtonText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    color: '#948FE0',
    textAlign: 'center',
  },
  categoryTitle: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(25),
    color: '#000',
    textAlign: 'left',
    marginBottom: scale(12),
    width: scale(221),
    alignSelf: 'center',
  },
  categoryBtnWrap: {
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'space-between', // [CHANGED] 버튼들을 양쪽 끝으로 밀착시켜 간격을 균등하게
    marginTop: scale(12),
    // [ADDED] 버튼 사이의 수직 간격
    rowGap: scale(10), 
    // [ADDED] 컨테이너 폭을 버튼 영역(226px)에 맞춰 좁힘 (기존 221px보다 넓음)
    width: scale(226), 
    alignSelf: 'center', // categoryBubble 내에서 중앙 정렬
  },
  categoryButton: {
    width: scale(108.5), 
    height: scale(28),
    borderRadius: scale(6),
    backgroundColor: '#F9F9FF', // [CHANGED] Figma: 배경 흰색에 가까운 F9F9FF
    borderWidth: scale(1),       // [CHANGED] Figma: 테두리 1px
    borderColor: '#4F46E5',     // [CHANGED] Figma: 테두리 보라색
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(1),         // 테두리 두께
    borderColor: '#4F46E5',
  },
  categoryButtonFull: {
    width: '100%', // 226px 전체 사용
    height: scale(28),
    borderRadius: scale(6),
    backgroundColor: '#F9F9FF', // [CHANGED] Figma: 날씨 버튼은 배경 보라색
    borderWidth: scale(1),
    borderColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButtonTextFull: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(25), 
    color: '#4F46E5', // <--- 이 부분을 검정색(#111111)으로 변경
    textAlign: 'center',
},
  categoryButtonText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(25), // Figma: 25px
    color: '#4F46E5',      // [CHANGED] 기본 텍스트 색상
    textAlign: 'center',
  },
  resultBubble: {
    // minWidth: scale(50),             // 너무 짧지 않게 최소만 제한
    // maxWidth: scale(),            // 최대는 부모(채팅 영역) 기준
    // minHeight: scale(40),  
    borderTopRightRadius: scale(20),
    borderBottomRightRadius: scale(20),
    borderBottomLeftRadius: scale(20),
    backgroundColor: '',
    marginLeft: scale(19),
    marginTop: scale(24),
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: scale(18),
    paddingVertical: scale(10),
    borderWidth: 0,
    alignSelf: 'flex-start',
    flexShrink: 1,            // 👈 반드시 추가!
    borderWidth: scale(3),         // 테두리 두께
    borderColor: '#CAC7FF',
  },
  resultText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    color: '#000',
    textAlign: 'left',
  },
  interactionBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: scale(10),
    gap: 1,
    marginLeft: scale(16),
  },
  interactionBtn: {
    width: scale(84),
    height: scale(28),
    borderRadius: scale(20),
    backgroundColor: '#A19CFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scale(4),
  },
  interactionBtnText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(25),
    color: '#fff',
    textAlign: 'center',
  },
  loadingBubble: {
    paddingHorizontal: scale(10),   // 패딩 줄이기
    paddingVertical: scale(6),
    minWidth: 0,
    maxWidth: '60%',                // 필요시 더 줄여도 됨
    minHeight: 0,
    width: undefined,               // 혹시 width 고정값 있으면 무시
    alignSelf: 'flex-start',
  },
  segmentRow: {
  // Figma: 269 x 28, 가운데 정렬
  width: scale(269),
  height: scale(28),
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  // Bot bubble 아래 여백(기존과 톤 맞춤, 필요 시 조정)
  marginTop: scale(10),
  marginLeft: scale(16),
},
segBtnBase: {
  height: scale(28),
  backgroundColor: '#F9F9FF',     // Figma: 배경
  justifyContent: 'center',
  alignItems: 'center',
},
segLeft: {
  width: scale(87),                // Figma: 87
  borderColor: '#4F46E5',
  borderWidth: 1,
  borderRightWidth: 1,            // 좌측 버튼 테두리
  borderRadius: scale(7),
  borderTopRightRadius: scale(2), // Figma: radius 7 2 2 7
  borderBottomRightRadius: scale(2),
  marginRight: 0,                 // 버튼 사이 간격 없음(세그먼트 연결)
},
segMiddle: {
  width: scale(88),                // Figma: 88
  borderColor: '#4F46E5',
  borderTopWidth: 1,              // Figma: border-width 1 0
  borderBottomWidth: 1,
  borderLeftWidth: 0,
  borderRightWidth: 0,
  borderRadius: scale(2),         // Figma: 2px
},
segRight: {
  width: scale(87),                // Figma: 87
  borderColor: '#4F46E5',
  borderWidth: 1,
  borderLeftWidth: 1,
  borderRadius: scale(7),
  borderTopLeftRadius: scale(2),  // Figma: radius 2 7 7 2
  borderBottomLeftRadius: scale(2),
  marginLeft: 0,
},
segText: {
  fontFamily: 'Roboto',
  fontWeight: '400',
  fontSize: scale(12),
  lineHeight: scale(25),
  color: '#4F46E5',               // Figma: 텍스트 보라
  textAlign: 'center',
},
segDisabled: {
  borderColor: '#BDBDBD',         // 기존 비활성 톤과 맞춤
},
segTextDisabled: {
  color: '#B0B0B0',
},
});