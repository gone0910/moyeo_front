// components/chat/ChatRoomScreen.jsx
// ✅ 채팅방 화면 - 백엔드 명세서 기반 리팩토링 (더미 데이터 기준)
import React, { useContext, useState, useRef, useEffect, useCallback } from 'react'; // ⬅️ useRef, useCallback 추가
import {  View,  Text,  TextInput,  FlatList,  TouchableOpacity,  StyleSheet,  Image,
  KeyboardAvoidingView, Platform ,Modal, Alert, Dimensions, RefreshControl
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from '@expo/vector-icons';
import { UserContext } from '../../contexts/UserContext';
import { exitChatRoom,getChatHistory, markAsRead } from '../../api/chat'; // chat.js api 연결
import { connectStompClient, disconnectStompClient, sendMessage } from '../../api/chatSocket'; // chatSocket.js WebSocket 연결
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // 하단탭 이동시 disconnect유지
import { LogBox } from 'react-native';

import { getUserMatchingDetail } from '../../api/matching'; // 실제 경로에 맞게 모달 api
import { ENUM_TO_PROVINCE_KOR, ENUM_TO_CITY_KOR } from '../common/regionMap';
import { GENDER_ENUM_TO_KOR, STYLE_ENUM_TO_KOR } from '../matching/utils/matchingUtils'; // modal을 위한 ENUM 역변환
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons'
import { getKorProvince, getKorCity } from '../common//regionMap';




LogBox.ignoreLogs([  // text 괄호 경고 메세지 무시
  'Warning: Text strings must be rendered within a <Text> component',
]);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const vScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

// 백엔드에서 받아온 지역 NONE 처리 변환 함수
function formatDestination(province, cities = []) {
  // province: 'SEOUL' 등 ENUM, cities: ['NONE'] 또는 []
  if (!province || province === 'NONE') {
    return '선택없음';
  }
  // cities가 없거나 'NONE'만 있으면 → 도만
  if (!cities || cities.length === 0 || (cities.length === 1 && (cities[0] === 'NONE' || !cities[0]))) {
    return ENUM_TO_PROVINCE_KOR[province] || province;
  }
  // 도+시 모두 있을 때
  const cityNames = cities
    .filter((c) => c !== 'NONE' && !!c)
    .map((code) => ENUM_TO_CITY_KOR[code] || code);
  return `${ENUM_TO_PROVINCE_KOR[province] || province} / ${cityNames.join(', ')}`;
}

const ChatRoomScreen = ({ route, navigation }) => {
  const params = route.params?.params || route.params || {}; // 중첩구조 예상해서
  const { roomId, nickname, origin } = params;  // 중첩구조 예상해서 디버깅용 파라미터
  const { user } = useContext(UserContext); // ⬅️ 토큰 외의 정보(id, nickname)를 위해 유지
  const [refreshing, setRefreshing] = useState(false);
  const authTokenRef = useRef(null); // ⬅️ 동기 클린업에서 사용할 토큰 저장소

  // 새로고침 추가 (AsyncStorage 사용)
  const handleRefresh = async () => {
  setRefreshing(true);
  try {
    console.log('📜 [새로고침] 메시지 다시 로딩...');
    const token = await AsyncStorage.getItem('jwt'); // ⬅️ [수정] AsyncStorage에서 가져오기
    if (!token) throw new Error('토큰이 없습니다.');

    const history = await getChatHistory(roomId, token); // ⬅️ [수정]
    setMessages(history);
    console.log('📜 [새로고침] 완료');
  } catch (err) {
    console.error('❌ [새로고침 실패]:', err);
    Alert.alert('오류', '메시지를 불러오지 못했습니다.');
  } finally {
    setRefreshing(false);
  }
};


    useFocusEffect(
    useCallback(() => {
      return () => {
        // ⬇️ [수정] 동기 함수이므로 ref에서 토큰을 읽음
        if (authTokenRef.current) {
          disconnectStompClient(authTokenRef.current);
        }
      };
    }, []) // ⬅️ 의존성 없음
  );

  // 모달 관련 상태
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const myId = user?.id;
  const myName = user?.nickname;
  const myProfile = user?.profileImageUrl;

  const [isConnected, setIsConnected] = useState(false);
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(45); // 기본 높이값 설정
  const [messages, setMessages] = useState([
    {
      sender: 2, 
      message: '이 문장은 아주 길어서 한 줄에 다 들어가지 않기 때문에 자동으로 줄이 바뀌고, 말풍선의 세로 높이도 늘어나게 됩니다. 줄바꿈이 잘 되는지 확인좀 하겠수다.',
      timestamp: '2025-05-11 14:20',
      unReadUserCount: 1,
    },
    {
      sender: 2,
      message: '저는 우도까지 갈 생각인데 같이 가실래요?',
      timestamp: '2025-05-11 14:21',
      unReadUserCount: 1,
    },
    {
      sender: myId,
      message: '넹 좋아요',
      timestamp: '2025-05-11 14:22',
      unReadUserCount: 0,
    },
  ]);

    // 닉네임 버튼 클릭 시: 상대방 정보 fetch & 모달 open
  const handleProfilePress = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt'); //
      const detail = await getUserMatchingDetail(route.params.nickname, token); //
      setProfileData(detail);
      setProfileModalVisible(true);
    } catch (error) {
      Alert.alert('상세정보 조회 실패', '다시 시도해주세요.');
    }
  };
  

  const flatListRef = useRef();
  // mock 분기 추가 필요요
  // 수정 후: 메시지 받자마자 실시간으로 읽음 처리 호출! (useCallback으로 메모이제이션)
  const handleReceiveMessage = useCallback(async (msg) => {
    if (!msg.sender || !msg.message || !msg.timestamp) {
      console.warn('❗ 누락된 필드가 있는 메시지 수신됨:', msg);
      return;
    }

    setMessages((prev) => [...prev, msg]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // [실시간 읽음 처리] (주석 해제 및 AsyncStorage 사용)
    try {
      const token = await AsyncStorage.getItem('jwt'); // ⬅️ [수정]
      if (token) {
        await markAsRead(roomId, token);
        console.log('[실시간 읽음 처리] markAsRead 호출 완료');
      }
    } catch (err) {
      console.error('[실시간 읽음 처리] markAsRead 에러', err);
    }
  }, [roomId]); // ⬅️ roomId에 의존

    useEffect(() => {
      // (기존의 중복된 getChatHistory 호출 제거 또는 수정)
      // 예: 디버깅용 로그로만 남기기
      (async () => {
        const token = await AsyncStorage.getItem('jwt');
        if (token) {
          getChatHistory(roomId, token).then(res => {
            console.log('🧾 응답 메시지 (초기 로그)', res ? res.length : 0);
          });
        }
      })();
      
      const init = async () => {
        console.log('📌 [ChatRoom INIT] 채팅방 초기화 시작');
        // console.log('👤 사용자 정보:', user); // ⬅️ 토큰은 더 이상 여기서 참조 안 함

        // 1. Mock 모드 확인
        const isMock = await AsyncStorage.getItem('mock');
        if (isMock === 'true') {
          console.log('🧪 [Mock모드] WebSocket 연결 생략');
          return;
        }

        // 2. 유저 토큰 확인 (AsyncStorage 사용)
        const token = await AsyncStorage.getItem('jwt'); // ⬅️ [수정]
        if (!token) { 
          console.warn('🚫 [중단] JWT 토큰 없음 (AsyncStorage) → STOMP 연결 불가');
          return;
        }
        authTokenRef.current = token; // ⬅️ [추가] 클린업 함수를 위해 ref에 저장

        // 3. route 파라미터 확인
        const params = route.params?.params || route.params || {};
        const { roomId, nickname } = params;
        console.log('🛰️ [STOMP 연결 시도] roomId,:', roomId,);
        console.log('🧭 [route 구조 확인]', {
          raw: route.params,
          nested: route.params?.params,
        });

        if (!roomId) {
          console.warn('❌ [중단] roomId이 없어 STOMP 연결 불가');
          return;
        }

        // 4. STOMP 연결
        connectStompClient(roomId, handleReceiveMessage, token, async () => {
          console.log('✅ [STOMP 연결 성공]');
          setIsConnected(true); // 전송 허용 상태 설정

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false }); // 처음 진입은 부드럽게 말고 즉시 이동
          }, 100);
        },

                // ✅ 읽음 알림 수신 콜백
        (notice) => {
          console.log('📥 [읽음 알림 수신]', notice.nickname);

          // 내가 보낸 메시지 중 마지막 읽히지 않은 항목 갱신
          setMessages((prev) => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].sender === user.nickname && updated[i].unReadUserCount > 0) {
                updated[i] = { ...updated[i], unReadUserCount: 0 };
                break;
              }
            }
            return updated;
          });
        }
      );
        // 5. 읽음 처리 후 이전 메시지 불러오기 (여기만 남겨두기)
        try {
          console.log('✅ [읽음 처리 요청]');
          await markAsRead(roomId, token); // ⬅️ [수정]
          console.log('📜 [이전 메시지] 로딩 시작...');
          const history = await getChatHistory(roomId, token); // ⬅️ [수정]
          console.log('[getChatHistory 응답]', JSON.stringify(history, null, 2));

          setMessages(history);
          console.log('📜 [이전 메시지] 로딩 완료');
        } catch (err) {
          console.error('❌ [이전 메시지/읽음 처리 실패]:', err);
        }
      };

      init();

      // ✅ beforeRemove 이벤트 리스너 등록 (Ref 사용)
      const removeListener = navigation.addListener('beforeRemove', () => {
        console.log('[beforeRemove] disconnect 실행!');
        // ⬇️ [수정] 동기 함수이므로 ref에서 토큰을 읽음
        if (authTokenRef.current) {
          disconnectStompClient(authTokenRef.current);
        }
      });

      return () => {
        console.log('📴 [STOMP 연결 종료]');
        // ⬇️ [수정] 동기 함수이므로 ref에서 토큰을 읽음
        if (authTokenRef.current) {
          disconnectStompClient(authTokenRef.current);
        }
        removeListener();
      };
    }, [roomId, navigation, handleReceiveMessage]); // ⬅️ [수정] 의존성 배열 업데이트

  
  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = {
      sender: user.nickname,   // ✅ 명세서에 정의된 필드
      message: input,          // ✅ 명세서에 정의된 필드
      timestamp: new Date().toISOString(),  // ✅ 현재 시간 추가 (ISO 문자열)
    };
    if (!isConnected) {
      Alert.alert('연결 중입니다', '잠시 후 다시 시도해주세요.');
      return;
    }
    if (!isConnected || !roomId) {
      Alert.alert('연결 중입니다', '잠시 후 다시 시도해주세요.');
      return;
    }
    sendMessage(roomId, newMessage);
    // setMessages((prev) => [...prev, { ...newMessage, unReadUserCount: 1 }]); // ✅ 로컬 렌더링
    setInput('');
    setInputHeight(45);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

    //  채팅방 나가기 경고 팝업 (AsyncStorage 사용)
  const confirmExitRoom = () => {
    Alert.alert(
      '채팅방 나가기',
      '대화 내용이 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwt'); // ⬅️ [수정]
              if (!token) throw new Error('토큰이 없습니다.');

              console.log('채팅방 나가기 요청 →', {
                roomId,
                token: token, // ⬅️ [수정]
              });
              await exitChatRoom(roomId, token); // ⬅️ [수정]
              disconnectStompClient(token);      // ⬅️ [수정]
              navigation.goBack();                      
              
              
            } catch (err) {
              console.error('❌ 나가기 실패:', err);
              Alert.alert('오류', '채팅방을 나가지 못했습니다.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item, index }) => {
    const isMe = item.sender === user.nickname; //  내가 보낸 메시지인지 확인
    const isLastMyMessage =isMe && 
      index === messages.map((m) => m.sender).lastIndexOf(user.nickname);

       // ✅ 🔍 여기 로그 추가
    // if (__DEV__ && item.sender === user.nickname) {
    // console.log('🧾 [메시지 시간 로그]', {
    //   sender: item.sender,
    //   rawTimestamp: item.timestamp,
    //   parsed: new Date(item.timestamp).toString(),
    //   localeTime: new Date(item.timestamp).toLocaleTimeString('ko-KR'),
    // });}

    // 출력되는 미국시간 ,한국시간을 보정.
    const formatToKoreanTime = (timestamp) => {
    const date = new Date(timestamp);
    const utcTime = date.getTime();
    const koreaTime = new Date(utcTime + 9 * 60 * 60 * 1000); // KST 보정
    return koreaTime.toTimeString().slice(0, 5); // "HH:MM"
  };

    const showDateLabel =
      index === 0 ||
      new Date(item.timestamp).toDateString() !==
        new Date(messages[index - 1].timestamp).toDateString();

    return (
    <View>
      {/* ✅ 날짜 라벨 */}
      {showDateLabel && (
        <View style={styles.dateLabelWrapper}> {/* 🔄 Figma 스타일 적용 */}
          <Text style={styles.dateLabelText}>
            {new Date(item.timestamp).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>
        </View>
      )}

      <View style={[styles.messageRow, isMe ? styles.rightAlign : styles.leftAlign]}>
        {/* ✅ 메시지 + 시간 (가로 정렬) */}
        <View style={[styles.messageWithTimeWrapper, isMe ? styles.reverseRow : null]}>
          {/* ✅ 말풍선 */}
          <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
            <Text style={styles.messageText}>
              {typeof item.message === 'string' ? item.message : JSON.stringify(item.message)}
            </Text>
          </View>

          {/* ✅ 시간/읽음 - 말풍선 외부 측면 정렬 */}
          <View style={styles.sideMetaWrapper}>
            {isMe && isLastMyMessage && item.unReadUserCount === 0 && (
              <Text style={styles.readText}>읽음</Text>
            )}
            <Text style={styles.timeText}>
              {item.timestamp ? formatToKoreanTime(item.timestamp) : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};




  return (
    <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={-10} // 키보드와 하단 공백값.
      >
    {/* safeAreaview와 keyboardAvoid 서로 중복되어 상하단 공백생김. */}
    <View style={styles.container}> 

      {/* ✅ 상단 헤더 */}
      <View style={styles.header}>
      <TouchableOpacity
        onPress={() => {
          if (params.origin === 'Matching') {
            navigation.navigate('BottomTab', {
              screen: 'Chat',
              params: { screen: 'ChatListScreen' },
            });
          } else {
            navigation.goBack();
          }
        }}
        style={styles.sideButton}
      >
        <MaterialIcons name="chevron-left" size={28} color="#4F46E5" />
      </TouchableOpacity>

      {/* 닉네임 그룹 (이미지 포함했다 제외)*/}
      <View style={styles.centerWrapper}>
        <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7}>
          <Text style={[styles.headerTitle]}>
            {route.params.nickname}
          </Text>
        </TouchableOpacity>
      </View>

        <TouchableOpacity onPress={confirmExitRoom} style={styles.sideButton}>
          <MaterialIcons name="logout" size={24} color="#F97575" />
        </TouchableOpacity>
      </View>
      {/* 구분선 */}
      <View style={styles.headerLine} /> 


      {/* ✅ 채팅 메시지 리스트 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4F46E5" // iOS에서 스피너 색상
            colors={['#4F46E5']} // Android에서 스피너 색상
          />
        }
      />

      {/* ✅ 하단 입력창 */}
        <View style={styles.inputBar}>
          <TextInput
            style={[styles.textInput, { height: Math.max(45, Math.min(inputHeight, 180)), // 180px 이상 안 커지게 제한 (예시)
              // textAlign: 'center',
              // textAlignVertical: 'center'

             }]} // ✅ 입력창 높이 자동 조절
            value={input}
            onChangeText={setInput}
            multiline={true}
            placeholder="메세지 입력"
            placeholderTextColor="#616161"
            maxLength={1000}  // 최대 1000자 입력 제한
            returnKeyType="default"
            onContentSizeChange={(e) =>
              setInputHeight(e.nativeEvent.contentSize.height)
            }
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <MaterialIcons
              name="navigation"
              size={22}
              color="#4F46E5"
              style={{ transform: [{ rotate: '40deg' }]}} // 아이콘 회전
            />
          </TouchableOpacity>
        </View>
      


      <Modal
        visible={isProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.modalCenter}>
            <View style={styles.modalBoxUpdated}>
              {profileData && (
                <>
                  {/* 모달 닫기 버튼 */}
                  <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setProfileModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>

                  {/* 프로필 이미지 + 닉네임, 기간 */}
                  <View style={styles.modalHeader}>
                    <Image
                      source={{ uri: profileData.image || profileData.imageUrl }}
                      style={styles.modalProfileImageUpdated}
                    />
                    <View>
                      <Text style={styles.modalUserName}>
                        {profileData.name || profileData.nickname}
                      </Text>
                      <Text style={styles.modalDate}>
                        {profileData.date
                          ? profileData.date.replace(/-/g, '/')
                          : `${profileData.startDate?.replace(/-/g, '/')} ~ ${profileData.endDate?.replace(/-/g, '/')}`}
                      </Text>
                    </View>
                  </View>

                  {/* 성별 */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>성별</Text>
                    <Text style={styles.infoTag1}>
                      {GENDER_ENUM_TO_KOR[profileData.gender] || '선택없음'}
                    </Text>
                  </View>
                  {/* 여행 성향 */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>여행 성향</Text>
                    <View style={styles.tagGroup}>
                      {(profileData.travelStyle || profileData.travelStyles)?.map((style, idx) =>
                        style === 'NONE'
                          ? <Text key={idx} style={styles.infoTag2}>{STYLE_ENUM_TO_KOR[style] || '선택없음'}</Text>
                          : <Text key={idx} style={styles.infoTag2}>#{STYLE_ENUM_TO_KOR[style] || style}</Text>
                      )}
                    </View>
                  </View>
                  {/* 목적지 */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>목적지</Text>
                    <Text style={styles.infoTag3}>
                      {profileData.destination
                        ? profileData.destination
                        : formatDestination(profileData.province, profileData.cities)}
                    </Text>
                  </View>
                  {/* MBTI */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>MBTI</Text>
                    <Text style={styles.infoTag4}>{profileData.mbti}</Text>
                  </View>
                  {/* "동행 채팅하기" 버튼은 여기서 제외 */}
                </>
              )}
            </View>
          </View>
        </BlurView>
      </Modal>

    </View>
  </KeyboardAvoidingView>

    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  // ----- 상단 헤더 -----
  header: {
    width: '100%',
    height: vScale(105),
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: vScale(55),
    paddingHorizontal: 0,
    justifyContent: 'space-between',
    position: 'relative',
  },
  sideButton: {
    width: scale(60),
    height: vScale(50),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: scale(18),
    fontFamily: 'Roboto',
    fontWeight: '400',
    color: '#000000',
    marginLeft: scale(4),
    maxWidth: scale(140),
    overflow: 'hidden',
  },
  headerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#999999',
  },
  // ----- 채팅 메시지 리스트 -----
  messageList: {
    paddingHorizontal: scale(16),
    flexGrow: 1,
  },
  messageRow: {
    marginVertical: vScale(6),
  },
  leftAlign: {
    alignSelf: 'flex-start',
  },
  rightAlign: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageWithTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  reverseRow: {
    flexDirection: 'row-reverse',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: scale(20),
    paddingVertical: vScale(8),
    paddingHorizontal: scale(14),
  },
  myBubble: {
    backgroundColor: '#D9D7FF',
  },
  otherBubble: {
    backgroundColor: '#E2E2E2',
  },
  messageText: {
    fontFamily: 'Roboto',
    fontSize: scale(16),
    color: '#333333',
  },
  sideMetaWrapper: {
    flexDirection: 'column',
    marginLeft: scale(6),
    marginRight: scale(6),
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  timeText: {
    fontSize: scale(10),
    color: '#999999',
    fontFamily: 'Roboto',
  },
  readText: {
    fontSize: scale(8),
    fontFamily: 'Roboto',
    fontWeight: '400',
    color: '#373737',
    marginBottom: vScale(2),
  },
  dateLabelWrapper: {
    alignSelf: 'center',
    backgroundColor: '#EFEAE5',
    borderRadius: scale(30),
    height: vScale(20),
    paddingHorizontal: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: vScale(8),
  },
  dateLabelText: {
    fontSize: scale(10),
    fontFamily: 'Roboto',
    fontWeight: '400',
    color: '#616161',
    textAlign: 'center',
  },
  // ----- 입력창 -----
  inputBar: {
    minHeight: vScale(85), // 입력 회색영
    backgroundColor: '#D9D9D9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    paddingBottom: vScale(10),
  
  },
  textInput: {
    flex: 1,
    height: vScale(45),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(25),
    paddingHorizontal: scale(16),
    fontSize: scale(16),
    fontFamily: 'Roboto',
    color: '#000000',
    textAlignVertical: 'center', // Android 세로중앙
    paddingVertical: Platform.OS === 'ios' ? vScale(14) : 0, // iOS 세로중앙
  },
  sendButton: {
    marginLeft: scale(10),
    width: scale(33),
    height: scale(33),
    borderRadius: scale(40),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft : scale(3),
    paddingBottom : scale(3),
  },
  // ---- 모달/상세정보 ----
  modalBoxUpdated: {
    width: '90%',
    maxWidth: scale(400),
    backgroundColor: '#FFF',
    borderRadius: scale(18), // 변경: scale(20) -> scale(18)
    paddingVertical: vScale(12), // 변경: scale(26) -> vScale(12)
    paddingHorizontal: scale(16), // 변경: scale(26) -> scale(16)
    alignItems: 'center',
    // 그림자 속성 제거됨
    position: 'relative',
  },
  modalProfileImageUpdated: {
    width: scale(68), // 변경: scale(86) -> scale(68)
    height: scale(68), // 변경: scale(86) -> scale(68)
    borderRadius: scale(21), // 변경: scale(14) -> scale(21)
    backgroundColor: '#ECECEC',
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    position: 'absolute',
    top: scale(14),
    right: scale(14),
    zIndex: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vScale(18),
    width: '100%',
    justifyContent: 'center',
  },
  modalUserName: {
    fontSize: scale(20), // 변경: scale(22) -> scale(20)
    fontWeight: '400', // 변경: bold -> 400
    color: '#111111', // 변경: #4F46E5 -> #111111
    marginLeft: scale(20),
  },
  modalDate: {
    fontSize: scale(18), // 변경: scale(15) -> scale(18)
    color: '#7E7E7E', // 변경: #888 -> #7E7E7E
    marginTop: vScale(0), // 변경: vScale(6) -> vScale(0)
    marginLeft: scale(20),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: scale(35),
    marginLeft: scale(24),
    marginTop: scale(8), // 위 요소와의 간격
  },
  infoLabel: {
    width: scale(77), // ex. 성별: 40, 여행성향: 77
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(18),
    color: '#1E1E1E',
    textAlignVertical: 'center',
    backgroundColor: '#FFFFFF',
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    flex: 1,
    // marginLeft: scale(8), // ← 반드시 삭제 또는 주석!
  },
  infoTag1: {
    MaxWidth: scale(69),
    height: scale(29), // 변경: scale(30) -> scale(29)
    marginLeft: scale(10),
    borderRadius: scale(8),
    backgroundColor: '#ADB3DD',
    color: '#fff',
    fontSize: scale(14), // 변경: scale(16) -> scale(14)
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: scale(29), // 변경: scale(30) -> scale(29)
    paddingHorizontal: scale(8),
  },
  infoTag2: {
    minWidth: scale(63),
    height: scale(29), // 변경: scale(30) -> scale(29)
    marginLeft: scale(10),
    borderRadius: scale(8),
    backgroundColor: '#B3A4F7',
    color: '#fff',
    fontSize: scale(14), // 변경: scale(16) -> scale(14)
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: scale(29), // 변경: scale(30) -> scale(29)
    paddingHorizontal: scale(8),
    marginBottom: scale(5),
  },
  infoTag3: {
    MaxWidth: scale(98),
    height: scale(29), 
    marginLeft: scale(10),
    borderRadius: scale(8),
    backgroundColor: '#B3A4F7',
    color: '#fff',
    fontSize: scale(14), 
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: scale(29), 
    paddingHorizontal: scale(11),
  },
  infoTag4: {
    width: scale(83),
    height: scale(29), 
    marginLeft: scale(10),
    borderRadius: scale(8),
    backgroundColor: '#FAF4FF',
    color: '#7E7E7E',
    fontSize: scale(14), 
    borderWidth: 1,
    borderColor: '#D6C9DF',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: scale(29), 
  },
});

export default ChatRoomScreen;
