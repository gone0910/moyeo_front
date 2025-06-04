// components/chat/ChatRoomScreen.jsx
// ✅ 채팅방 화면 - 백엔드 명세서 기반 리팩토링 (더미 데이터 기준)
import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import {  View,  Text,  TextInput,  FlatList,  TouchableOpacity,  StyleSheet,  SafeAreaView,  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
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


LogBox.ignoreLogs([
  'Warning: Text strings must be rendered within a <Text> component',
]);

const ChatRoomScreen = ({ route, navigation }) => {
  const params = route.params?.params || route.params || {}; // 중첩구조 예상해서
  const { roomId, nickname, origin } = params;  // 중첩구조 예상해서 디버깅용 파라미터
  const { user } = useContext(UserContext); // 하단탭 이동시 disconnect (하단탭 삭제시 userFOcusEffect문 삭제제)
    useFocusEffect(
    useCallback(() => {
      return () => {
        if (user?.token) {
          disconnectStompClient(user.token);
        }
      };
    }, [user?.token])
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
      const token = await AsyncStorage.getItem('jwt');
      const detail = await getUserMatchingDetail(route.params.nickname, token);
      setProfileData(detail);
      setProfileModalVisible(true);
    } catch (error) {
      Alert.alert('상세정보 조회 실패', '다시 시도해주세요.');
    }
  };
  

  const flatListRef = useRef();
  // mock 분기 추가 필요요
  // 수정 후: 메시지 받자마자 실시간으로 읽음 처리 호출!
  const handleReceiveMessage = (msg) => {
    if (!msg.sender || !msg.message || !msg.timestamp) {
      console.warn('❗ 누락된 필드가 있는 메시지 수신됨:', msg);
      return;
    }

    setMessages((prev) => [...prev, msg]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // [실시간 읽음 처리] 추가!
    markAsRead(roomId, user.token)
      .then(() => {
        console.log('[실시간 읽음 처리] markAsRead 호출 완료');
      })
      .catch(err => {
        console.error('[실시간 읽음 처리] markAsRead 에러', err);
      });
  };

    useEffect(() => {
      getChatHistory(roomId, user.token).then(res => {
        console.log('🧾 응답 메시지', res);
        console.log('✔️ 첫 메시지 읽은 인원 수:', res[0]?.unReadUserCount);
      });
      const init = async () => {
        console.log('📌 [ChatRoom INIT] 채팅방 초기화 시작');
        console.log('👤 사용자 정보:', user);

        // 1. Mock 모드 확인
        const isMock = await AsyncStorage.getItem('mock');
        if (isMock === 'true') {
          console.log('🧪 [Mock모드] WebSocket 연결 생략');
          return;
        }

        // 2. 유저 토큰 확인
        if (!user || !user.token) {
          console.warn('🚫 [중단] JWT 토큰 없음 → STOMP 연결 불가');
          return;
        }

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
        connectStompClient(roomId, handleReceiveMessage, user.token, async () => {
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
          await markAsRead(roomId, user.token);      // ✅ 먼저 읽음 처리!
          console.log('📜 [이전 메시지] 로딩 시작...');
          const history = await getChatHistory(roomId, user.token);  // ✅ 이후 메시지 조회
          console.log('[getChatHistory 응답]', JSON.stringify(history, null, 2));

          setMessages(history);
          console.log('📜 [이전 메시지] 로딩 완료');
        } catch (err) {
          console.error('❌ [이전 메시지/읽음 처리 실패]:', err);
        }
      };

      init();

      return () => {
        console.log('📴 [STOMP 연결 종료]');
        disconnectStompClient(user.token);
      };
    }, [user]);

  
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

    //  채팅방 나가기 경고 팝업
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
              console.log('채팅방 나가기 요청 →', {
                roomId,
                token: user.token,
              });
              await exitChatRoom(roomId, user.token); // 백엔드에 나가기 요청
              disconnectStompClient(user.token);                  // WebSocket 연결 종료
              navigation.goBack();                      // 화면 뒤로가기
              
              
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
              {item.timestamp
                ? new Date(item.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};




  return (
    <SafeAreaView style={styles.container}>

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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >


      {/* ✅ 채팅 메시지 리스트 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
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
            <MaterialIcons name="navigation" size={22} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>


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
                  <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setProfileModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                  <View style={styles.modalHeader}>
                    <Image source={{ uri: profileData.image || profileData.imageUrl }} style={styles.modalProfileImageUpdated} />
                    <View style={{ marginLeft: 16 }}>
                      <Text style={styles.modalUserName}>{profileData.name || profileData.nickname}</Text>
                      <Text style={styles.modalDate}>{profileData.date || `${profileData.startDate} ~ ${profileData.endDate}`}</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>성별</Text>
                    <Text style={styles.infoTag1}>{profileData.gender && GENDER_ENUM_TO_KOR?.[profileData.gender] || '선택없음'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>여행 성향</Text>
                    <View style={styles.tagGroup}>
                      {(profileData.travelStyle || profileData.travelStyles)?.map((style, idx) => (
                        <Text key={idx} style={styles.infoTag2}>#{STYLE_ENUM_TO_KOR?.[style] || '선택없음'}</Text>
                      ))}
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>목적지</Text>
                    <Text style={styles.infoTag3}>
                      {profileData.destination ||
                        `${getKorProvince(profileData.province)} / ${
                          (profileData.cities || [])
                            .map(code => getKorCity(code))
                            .join(', ')
                        }`
                      }
                    </Text>
                  </View>
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

    </SafeAreaView>

    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    marginLeft: 8,
    maxWidth: 120,
    overflow: 'hidden',
  },

  sideButton: {
  zIndex: 1,
  },

  logoutIcon: {
  },
  headerLine: {
  height: 1,
  backgroundColor: '#999999',
  marginHorizontal: 16, // 좌우 여백
},
  messageWrapper: {
    flexDirection: 'column',
  },
  messageWithTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  reverseRow: {
    flexDirection: 'row-reverse', // 🆕 내 메시지면 시간이 왼쪽에 오도록 반전
  },
  sideMetaWrapper: {
    flexDirection: 'column',
    marginLeft: 6,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '100%',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  myBubble: {
    backgroundColor: '#D9D7FF',
  },
  otherBubble: {
    backgroundColor: '#E2E2E2',
  },
  timeText: {
    fontSize: 10,
    color: '#999999',
    fontFamily: 'Roboto',
  },
  readText: {
    fontSize: 8,
    fontFamily: 'Roboto',
    fontWeight: '400',
    color: '#373737',
    marginBottom: 2,
  },
  dateLabelWrapper: {
    alignSelf: 'center',
    backgroundColor: '#EFEAE5',
    borderRadius: 30,
    height: 20,
    paddingHorizontal: 12, // ✅ 좌우 여백
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  dateLabelText: {
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: '400',
    color: '#616161',
    textAlign: 'center',
  },
  messageList: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  messageRow: {
    marginVertical: 6,
  },
  leftAlign: {
    alignSelf: 'flex-start',
  },
  rightAlign: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  otherBubble: {
    backgroundColor: '#E2E2E2',
  },
  myBubble: {
    backgroundColor: '#D9D7FF',
  },
  messageText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: '#333333',
    
  },
  inputBar: {
    minHeight: 60,                 // 최소 높이만 지정 (고정 X)
    backgroundColor: '#D9D9D9',
    flexDirection: 'row',
    alignItems: 'center',        // 입력창 중앙 정렬
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    height: 45,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Roboto',
    color: '#000000',
    textAlignVertical: 'top',
  },
  sendButton: {
    marginLeft: 10,
    width: 33,
    height: 33,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // MODAL 상세정보 관련 styleshhet
    // 모달 배경
modalBoxUpdated: {
    width: 340, // 모바일 기준 넉넉하게 (원하는 경우 '90%' 등으로 수정 가능)
    backgroundColor: '#FFF', // 모달 배경 (필요시 '#F8F6FF' 등 연보라 가능)
    borderRadius: 18,
    padding: 24,
    alignItems: 'flex-start', // 왼쪽정렬 → 'center'로 바꾸면 중앙정렬
    // 그림자 효과 추가(선택)
    shadowColor: '#888',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
  },
  modalProfileImageUpdated: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECECEC',
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  matchImage: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  matchName: { fontSize: 18, color: '#1E1E1E' },
  matchDate: { fontSize: 16, color: '#7E7E7E', marginTop: 8 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tag: { backgroundColor: '#EFEAE5', paddingVertical: 3, paddingHorizontal: 6, borderRadius: 4, marginRight: 6 },
  tagText: { fontSize: 12, color: '#7E7E7E' },

  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalUserName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 2,
  },
  modalDate: {
    fontSize: 15,
    color: '#888',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 16,
    color: '#1E1E1E',
    fontWeight: '500',
    width: 70, // 라벨 넓이 고정
    marginTop: 6,
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: '#1E1E1E',
    fontWeight: '500',
    width: 60, // 고정 너비로 정렬 기준 맞추기
    marginTop: 8, // 텍스트 상단 맞춤
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    marginLeft: 12,
  },
  infoTag1: {
    backgroundColor: '#ADB3DD',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    fontSize: 14,
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    marginBottom: 4,
    marginLeft: 8,
  },
  infoTag2: {
    backgroundColor: '#B3A4F7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    fontSize: 14,
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    marginBottom: 4,
    marginLeft: 8,
  },
  infoTag3: {
    backgroundColor: '#F4F4FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    fontSize: 14,
    color: '#7E7E7E',
    minWidth: 60,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#D6C9DF',
    marginBottom: 4,
    marginLeft: 8,
  },
  infoTag4: {
    backgroundColor: '#B3A4F7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    fontSize: 14,
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
    marginBottom: 4,
    marginLeft: 8,
  },
});

export default ChatRoomScreen;
