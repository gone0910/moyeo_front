// components/chat/ChatRoomScreen.jsx
// ✅ 채팅방 화면 - 백엔드 명세서 기반 리팩토링 (더미 데이터 기준)
import React, { useContext, useState, useRef, useEffect } from 'react';
import {  View,  Text,  TextInput,  FlatList,  TouchableOpacity,  StyleSheet,  SafeAreaView,  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserContext } from '../../contexts/UserContext';
import { exitChatRoom,getChatHistory, markAsRead } from '../../api/chat'; // chat.js api 연결
import { connectStompClient, disconnectStompClient, sendMessage } from '../../api/chatSocket'; // chatSocket.js WebSocket 연결
import AsyncStorage from '@react-native-async-storage/async-storage';



const ChatRoomScreen = ({ route, navigation }) => {
  const params = route.params?.params || route.params || {}; // 중첩구조 예상해서
  const { roomId, nickname, profileUrl, origin } = params;  // 중첩구조 예상해서 디버깅용 파라미터
  const { user } = useContext(UserContext);
  const myId = user?.id;
  const myName = user?.nickname;
  const myProfile = user?.profileImageUrl;

  const [isConnected, setIsConnected] = useState(false);
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(45); // 기본 높이값 설정
  const [messages, setMessages] = useState([
    {
      sender: 2, 
      // profileUrl,
      message: '이 문장은 아주 길어서 한 줄에 다 들어가지 않기 때문에 자동으로 줄이 바뀌고, 말풍선의 세로 높이도 늘어나게 됩니다. 줄바꿈이 잘 되는지 확인좀 하겠수다.',
      timestamp: '2025-05-11 14:20',
      inReadUserCount: 1,
    },
    {
      sender: 2,
      // profileUrl,
      message: '저는 우도까지 갈 생각인데 같이 가실래요?',
      timestamp: '2025-05-11 14:21',
      inReadUserCount: 1,
    },
    {
      sender: myId,
      // profileUrl: myProfile,
      message: '넹 좋아요',
      timestamp: '2025-05-11 14:22',
      inReadUserCount: 0,
    },
  ]);

  const flatListRef = useRef();
  // mock 분기 추가
  const handleReceiveMessage = (msg) => {
    if (!msg.senderName || !msg.message || !msg.timestamp) {
      console.warn('❗ 누락된 필드가 있는 메시지 수신됨:', msg);
      return;
    }

    setMessages((prev) => [...prev, msg]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

    useEffect(() => {
      const init = async () => {
        if (!roomName || !user?.token) return;  // 로딩 방어
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
        connectStompClient(roomId, handleReceiveMessage, user.token, () => {
          console.log('✅ [STOMP 연결 성공]');
          setIsConnected(true);
        });

        // 5. 이전 메시지 불러오기
        try {
          console.log('📜 [이전 메시지] 로딩 시작...');
          const history = await getChatHistory(roomName, user.token);
          setMessages(history);
          console.log('📜 [이전 메시지] 로딩 완료');

          // ✅ 메시지가 있을 경우에만 읽음 처리
          if (history.length > 0) {
            console.log('✅ [읽음 처리 요청] 이전 메시지 읽음 처리 시도');
            await markAsRead(roomName, user.token);
          }
        } catch (err) {
          console.error('❌ [초기화 실패]', err);
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
      message: input,          // 
      timestamp: new Date().toISOString(),  // ✅ 현재 시간 추가 (ISO 문자열)
    };
    if (!isConnected) {
      Alert.alert('연결 중입니다', '잠시 후 다시 시도해주세요.');
      return;
    }
    sendMessage(roomId, newMessage);
    setMessages((prev) => [...prev, { ...newMessage, inReadUserCount: 1 }]); // ✅ 로컬 렌더링
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
            <Text style={styles.messageText}>{item.message}</Text>
          </View>

          {/* ✅ 시간/읽음 - 말풍선 외부 측면 정렬 */}
          <View style={styles.sideMetaWrapper}>
            {isMe && isLastMyMessage && item.inReadUserCount === 0 && (
              <Text style={styles.readText}>읽음</Text>
            )}
            <Text style={styles.timeText}>
              {new Date(item.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
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
            navigation.getParent()?.navigate('Chat', { screen: 'ChatListScreen' });
          } else {
            navigation.goBack();
          }
        }}
        style={styles.sideButton}
      >
        <MaterialIcons name="chevron-left" size={28} color="#4F46E5" />
      </TouchableOpacity>

      {/* ✅ 프로필 이미지 + 닉네임 그룹 */}
      <View style={styles.centerWrapper}>
        <Image source={{ uri: profileUrl }} style={styles.profileImage} />
        <Text style={styles.headerTitle}>{nickname}</Text>
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
      />

      {/* ✅ 하단 입력창 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={[styles.textInput, { height: Math.max(45, inputHeight) }]} // ✅ 입력창 높이 자동 조절
            value={input}
            onChangeText={setInput}
            multiline={true}
            placeholder="메세지 입력"
            placeholderTextColor="#616161"
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
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  centerWrapper: {
    position: 'absolute',
    top: 35,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%', // ✅ 닉네임이 너무 길면 잘리게
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
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 16,
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
});

export default ChatRoomScreen;
