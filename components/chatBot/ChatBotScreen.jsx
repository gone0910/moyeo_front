// components/chatBot/ChatBotScreen.jsx
// 도/시 한 말풍선(합체), 지나간 말풍선/버튼 disable(흑백), '이전하기' 플로우까지 한방에 동작

import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { REGION_MAP } from '../common/regionMap';

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

  // 버튼 클릭 처리
  const handleButton = (value, label) => {
    const updated = messages.map(m => ({ ...m, isActive: false }));
    // updated.push({ type: 'user', text: label });

    // '이전으로' 클릭 시 (언제든 1차 안내 복귀)
    if (value === 'prev') {
      updated.push({ type: 'bot', ...initialMessages[0], isActive: true });
      setSelectedProvince(null);
      setSelectedCity(null);
      setRegionStep('');
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
          <MaterialCommunityIcons name="robot-outline" size={28} color="#928CFF" />
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

  // 카테고리/결과 안내 등
  const renderCategoryBubble = (key) => (
    <View key={key} style={{ marginBottom: 0, opacity: messages[key]?.isActive ? 1 : 0.5 }}>
      <View style={styles.chatBotIconRow}>
        <MaterialCommunityIcons name="robot-outline" size={28} color="#928CFF" />
      </View>
      <View style={[styles.categoryBubble, !messages[key]?.isActive && styles.disabledBubble]}>
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
    </View>
  );

  const renderResultBubble = (key, catLabel) => (
    <View key={key} style={{ marginBottom: 0, opacity: messages[key]?.isActive ? 1 : 0.5 }}>
      <View style={styles.chatBotIconRow}>
        <MaterialCommunityIcons name="robot-outline" size={28} color="#928CFF" />
      </View>
      <View style={[styles.resultBubble, !messages[key]?.isActive && styles.disabledBubble]}>
        <Text style={styles.resultText}>
          {selectedProvince}
          {selectedCity ? ` ${selectedCity}` : ''}의{' '}
          <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>{catLabel}</Text> 정보입니다.
        </Text>
      </View>
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
      <ScrollView style={styles.chatArea} contentContainerStyle={{ paddingBottom: 32 }}>
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
                  <MaterialCommunityIcons name="robot-outline" size={28} color="#928CFF" />
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
