// components/chat/ChatListScreen.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ChatRoomCard from './common/ChatRoomCard'; // [대체] 경로 확인
import { fetchChatRooms, exitChatRoom } from '../../api/chat'; // [UPDATED] 실제 경로 확인
import { LogBox } from 'react-native';

// 해당 파일에서 경고만 숨기기
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const normalize = (size, based = 'width') => {
  const scale =
    based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
};

const colors = {
  bg: '#FAFAFA',
  text: '#111111',
  brand: '#4F46E5',
  divider: '#FAFAFA',
  gray600: '#4B5563',
  gray400: '#9CA3AF',
  gray200: '#E5E7EB',
};

const DESIGN_MOCK = [
  {
    roomId: 'mock-1',
    otherUserNickname: 'q평e평우리아빠김남평',
    otherUserImageUrl: 'https://via.placeholder.com/96x96.png?text=MJ',
    unReadCount: 3,
    lastMessage: '제주도 가신다구요', // [작업필요] 서버 제공 시 사용
    lastMessageTime: '2025-10-14T09:12:00', // [수정] 필드명 변경 및 LocalDateTime 형식으로 맞춤
  },
  {
    roomId: 'mock-2',
    otherUserNickname: '홍길동그라미',
    otherUserImageUrl: 'https://via.placeholder.com/96x96.png?text=JE',
    unReadCount: 12,
    lastMessage: '캄보디아 가신다구요',
    lastMessageTime: '2025-10-13T15:30:00', // [수정] 필드명 변경 및 LocalDateTime 형식으로 맞춤
  },
];

// =========================
// [대체] 신버전 헤더 + 편집 의도 승계
// [REFACTORED] 컴포넌트 외부로 분리
// =========================
const Header = ({ navigation, searchOpen, setSearchOpen, isEditing, setIsEditing }) => (
  <View style={styles.headerWrap}>
    <View style={styles.headerLeft}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
        <Ionicons name="chevron-back" size={normalize(24)} color={colors.text} />
      </TouchableOpacity>
      {!searchOpen && <Text style={styles.headerTitle}>채팅</Text>}
    </View>

    <View style={styles.headerRight}>
      {!searchOpen && (
        <TouchableOpacity
          onPress={() => setSearchOpen(true)}
          style={styles.iconBtn}
          accessibilityLabel="검색 열기"
        >
          <Ionicons name="search" size={normalize(22)} color={colors.text} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => setIsEditing((v) => !v)}
        style={styles.iconBtn}
        accessibilityLabel="편집 모드"
      >
        <Ionicons
          name={isEditing ? 'settings' : 'settings-outline'}
          size={normalize(22)}
          color={isEditing ? colors.brand : colors.text}
        />
      </TouchableOpacity>
    </View>
  </View>
);

// =========================
// [원본 유지] 검색바(로컬 필터)
// [REFACTORED] 컴포넌트 외부로 분리
// =========================
const SearchBar = ({ keyword, setKeyword, handleLocalFilter, closeSearch }) => (
  <View style={styles.searchWrap}>
    <View style={styles.searchBox}>
      <Ionicons name="search" size={normalize(18)} color={colors.gray600} />
      <TextInput
        style={styles.searchInput}
        placeholder="닉네임 검색"
        placeholderTextColor={colors.gray400}
        value={keyword}
        // [수정 1] 여기서는 키워드 상태만 업데이트합니다.
        onChangeText={(t) => setKeyword(t)}
        returnKeyType="search"
        // [수정 2] '검색' 버튼을 눌렀을 때 필터링을 실행하고 키보드를 닫습니다.
        onSubmitEditing={() => {
          handleLocalFilter(keyword);
          Keyboard.dismiss();
        }}
      />
      <TouchableOpacity onPress={closeSearch} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>취소</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// =========================
// [대체] 구버전 네이밍으로 맞춤 — ListEmptyComponent
// [REFACTORED] 컴포넌트 외부로 분리
// =========================
const ListEmptyComponent = ({ navigation }) => (
  <View style={styles.emptyWrapper}>
    <Text style={styles.emptyTitle}>아직 채팅을 시작한 사람이 없어요</Text>
    {/* [UPDATED] 버튼 누르면 매칭 화면 이동 */}
    <TouchableOpacity
      style={styles.matchingBtn}
      onPress={() =>
        navigation.navigate(
          'Home', // [작업필요] 실제 루트 네비게이터
          { screen: 'Matching' } // [작업필요] 실제 매칭 스크린
        )
      }
      activeOpacity={0.7}
    >
      <Text style={styles.matchingBtnText}>같이 떠날 동행자를 찾으러 가볼까요?</Text>
    </TouchableOpacity>
  </View>
);

// =========================
// [대체] 카드에 room 객체 통째로 전달 (필드명 그대로)
// [REFACTORED] renderItem 로직 외부로 분리
// =========================
const renderItem = ({ item, isEditing, requestExitRoom }) => {
  if (!item) return null;
  return (
    <ChatRoomCard
      room={item}
      isEditing={isEditing}
      onDeletePress={() => requestExitRoom(item.roomId)}
    />
  );
};

// [REFACTORED] ItemSeparatorComponent 외부로 분리
const Separator = () => <View style={styles.separator} />;

export default function ChatListScreen() {
  const navigation = useNavigation();
  const [chatRooms, setChatRooms] = useState([]);
  const fullListRef = useRef([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // [UPDATED] 개발 중 mock 강제 스위치
  const useDesignMock = false;

  const loadChatRooms = async () => {
    try {
      if (useDesignMock) {
        setChatRooms(DESIGN_MOCK);
        fullListRef.current = DESIGN_MOCK;
        return;
      }

      const isMock = await AsyncStorage.getItem('mock');
      if (isMock === 'true') {
        console.log('[mock 모드] DESIGN_MOCK 사용');
        setChatRooms(DESIGN_MOCK);
        fullListRef.current = DESIGN_MOCK;
        return;
      }

      const token = await AsyncStorage.getItem('jwt');
      if (!token) {
        console.warn('[ChatList] JWT 없음 → 빈 목록');
        setChatRooms([]);
        fullListRef.current = [];
        return;
      }

      // [UPDATED] 구버전 API 호출 이식 (배열 응답 가정)
      const resp = await fetchChatRooms(token);

      if (!Array.isArray(resp)) throw new Error('서버 응답이 배열이 아닙니다.');
      // [대체] 리네이밍 없이 그대로 사용
      setChatRooms(resp);
      fullListRef.current = resp;
    } catch (err) {
      console.error('ERROR  ❌ 채팅방 리스트 조회 예외:', err?.message || err);
      setChatRooms([]);
      fullListRef.current = [];
    }
  };

  useEffect(() => {
    loadChatRooms(); // 최초 1회
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadChatRooms(); // 화면 재진입 시 갱신
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatRooms();
    setRefreshing(false);
  };

  // [UPDATED] 로컬 필터 — otherUserNickname 기준
  const handleLocalFilter = (t) => {
    const base = fullListRef.current || [];
    if (!t?.trim()) {
      setChatRooms(base);
      return;
    }
    const q = t.trim().toLowerCase();
    const filtered = base.filter((r) => (r.otherUserNickname || '').toLowerCase().includes(q));
    setChatRooms(filtered);
  };

  const closeSearch = () => {
    setKeyword('');
    setSearchOpen(false);
    setChatRooms(fullListRef.current);
    Keyboard.dismiss();
  };

  // =========================
  // [UPDATED] 방 나가기(삭제)
  // =========================
  const requestExitRoom = (roomId) => {
    Alert.alert('채팅방 나가기', '해당 채팅방에서 나가시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('jwt');
            if (!token) throw new Error('JWT 토큰이 없습니다.');
            await exitChatRoom(roomId, token);
            setChatRooms((prev) => (prev || []).filter((r) => r.roomId !== roomId));
            fullListRef.current = (fullListRef.current || []).filter(
              (r) => r.roomId !== roomId
            );
          } catch (err) {
            console.error('ERROR  ❌ 채팅방 나가기 실패:', err?.message || err);
            Alert.alert('오류', '채팅방에서 나가기에 실패했습니다.');
          }
        },
      },
    ]);
  };

  // isEditing, requestExitRoom이 변경될 때만 renderItem 함수를 재생성
  const memoizedRenderItem = React.useCallback(
    ({ item }) => renderItem({ item, isEditing, requestExitRoom }),
    [isEditing] // requestExitRoom은 함수이므로 의존성에서 제외 가능 (useCallback으로 감싸지 않았다면 포함)
  );

  // ListEmptyComponent에 navigation prop 전달
  const memoizedListEmptyComponent = React.useCallback(
    () => <ListEmptyComponent navigation={navigation} />,
    [navigation]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* [REFACTORED] Props로 상태와 핸들러 전달 */}
      <Header
        navigation={navigation}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
      {searchOpen && (
        <SearchBar
          keyword={keyword}
          setKeyword={setKeyword}
          handleLocalFilter={handleLocalFilter}
          closeSearch={closeSearch}
        />
      )}

      <FlatList
        data={(chatRooms || []).filter(Boolean)}
        keyExtractor={(item, idx) => String(item?.roomId ?? idx)}
        renderItem={memoizedRenderItem}
        ItemSeparatorComponent={Separator} 
        ListEmptyComponent={memoizedListEmptyComponent} 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: normalize(40, 'height'), paddingTop: normalize(15, 'height') }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={true} // 아이폰에서도 제스쳐를 통한 갱신 영역 확장
      />
    </SafeAreaView>
  );
}

// =========================
// 스타일
// =========================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(16),
    paddingTop: normalize(8, 'height'),
    paddingBottom: normalize(8, 'height'),
    backgroundColor: colors.bg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: normalize(8) },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: normalize(8) },
  iconBtn: { padding: normalize(6), borderRadius: 20 },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: '600',
    color: colors.text,
    marginLeft: normalize(2),
  },

  searchWrap: { paddingHorizontal: normalize(16), paddingBottom: normalize(8, 'height') },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8, 'height'),
    backgroundColor: '#FAFAFA',
  },
  searchInput: { flex: 1, fontSize: normalize(16), color: colors.text },
  cancelBtn: { paddingHorizontal: normalize(6), paddingVertical: normalize(2, 'height') },
  cancelText: { fontSize: normalize(14), color: colors.gray600 },

  separator: { height: 1, backgroundColor: colors.divider, marginLeft: normalize(72) },

  // 빈 목록 CTA
  emptyWrapper: {
    alignSelf: 'center',
    width: normalize(338),
    marginTop: normalize(200, 'height'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  emptyTitle: {
    width: normalize(338),
    minHeight: normalize(54, 'height'),
    fontSize: normalize(21),
    lineHeight: normalize(44, 'height'),
    color: colors.text,
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: normalize(16),
    overflow: 'hidden',
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontWeight: '400',
  },
  matchingBtn: {
    marginTop: normalize(10, 'height'),
    backgroundColor: '#FAFAFA',
    borderRadius: normalize(14),
    paddingVertical: normalize(8, 'height'),
    paddingHorizontal: normalize(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchingBtnText: {
    color: colors.brand,
    fontSize: normalize(16),
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});
