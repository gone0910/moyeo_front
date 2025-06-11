// components/community/common/CommentSection.jsx 댓글 영역역
// 커뮤니티 게시글 -상세보기- 댓글 
import React, { useState, useEffect, useRef,forwardRef, useImperativeHandle, } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Dimensions, KeyboardAvoidingView, Platform, FlatList,
ScrollView, Modal, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCommentList, createComment, editComment, deleteComment } from '../../../api/community'; 
import { MaterialIcons } from '@expo/vector-icons';


// 반응형 함수
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const vScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

// ✅ mock 데이터 (더미 댓글)
const mockCommentList = [
  {
    id: 101,
    nickname: '도리',
    content: '돌아버린거냐 저건 카레가 아니잖아',
    profileUrl: 'https://placehold.co/36x36',
    createdDate: '15분 전',
    isMine: false,
  },
  {
    id: 102,
    nickname: '카레홀릭',
    content: '맛있어요~',
    profileUrl: 'https://placehold.co/36x36',
    createdDate: '8분 전',
    isMine: true,
  },
];

export default function CommentSection({ postId, myNickname = '', comments: propComments, setComments: setPropComments }, ref) {
  const [input, setInput] = useState('');
  const [editId, setEditId] = useState(null); // 기존 입력란 수정
  const [editContent, setEditContent] = useState(''); // 댓글 직접 수정
  const [token, setToken] = useState('');
  const [inputHeight, setInputHeight] = useState(vScale(31)); // 댓글 입력창 기본 높이
  //  댓글 최대/최소 높이 (5줄 기준, 반응형)
  const minHeight = vScale(31);
  const maxHeight = vScale(31) * 5;
  const [openMenuId, setOpenMenuId] = useState(null);
  const inputRef = useRef(null);
  const flatListRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const editInputRefs = useRef({});
  const [commentsState, setCommentsState] = useState([]);

  const comments = propComments ?? commentsState;
  const setComments = setPropComments ?? setCommentsState;

    useEffect(() => {
    if (token && postId && myNickname) {
      getCommentList(postId, token)
        .then(commentData => {
          setComments(
            commentData.map(item => ({
              id: item.commentId,
              nickname: item.nickname,
              content: item.comment,
              profileUrl: item.userProfile,
              createdDate: getRelativeTime(item.updatedAt),
              isMine: item.nickname === myNickname,
            }))
          );
          console.log('[초기 진입] 댓글 리스트 갱신', commentData);
        })
        .catch(error => {
          console.error('[초기 진입] 댓글 리스트 불러오기 실패:', error);
        });
    }
  }, [token, postId, myNickname]);


  // 새로고침 핸들러
  const handleRefresh = async () => {
  setRefreshing(true);
  try {
    await fetchComments();
  } finally {
    setRefreshing(false);
  }
};


   // 1. 토큰 로드
  useEffect(() => {
    AsyncStorage.getItem('jwt').then(value => {
      if (value) setToken(value);
    });
  }, []);
  
  // 2. 댓글 리스트 조회
  const fetchComments = async () => {
    try {
      const data = await getCommentList(postId, token);
      setComments(
        data.map((item) => ({
          nickname: item.nickname,
          content: item.comment,
          profileUrl: item.userProfile,
          createdDate: getRelativeTime(item.updatedAt),
          id: item.commentId,
          isMine: item.nickname === myNickname,
        }))
      );
    } catch (e) {
      alert('댓글 불러오기 실패');
    }
  };
    // 새로고침 정보 게시글 상세로 보내기
    useImperativeHandle(ref, () => ({
      refreshComments: fetchComments,
    }));

    // 받아온 타임스탬프에 +9시간 더하기 (utc에서 변환)
    function toKoreanDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    // UTC → KST (+9시간)
    return new Date(date.getTime() + 9 * 60 * 60 * 1000);
  }

    function getRelativeTime(isoString) {
  if (!isoString) return '';
  const now = new Date();
  // ✅ KST로 보정한 값으로 차이 계산
  const past = toKoreanDate(isoString);
  const diff = (now.getTime() - past.getTime()) / 1000;

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}달 전`;
  return `${Math.floor(diff / 31536000)}년 전`;
}

  // 화면 진입/댓글 CRUD 후 목록 새로고침
  useEffect(() => {
    if (propComments) return; // props로 comments가 오면 내부 fetchComments 호출 안함
    if (!token || !postId) return;
    fetchComments();
  }, [token, postId, propComments]);

  // 3. 댓글 등록/수정
  const handleSubmit = async () => {
    if (!input.trim()) return;
    try {
      if (editId) {
        await editComment(editId, input, token);
        setEditId(null);
      } else {
        await createComment(postId, input, token);
      }
      setInput('');
      await fetchComments();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
        inputRef.current?.focus();
      }, 220);
    } catch (e) {
      alert('댓글 등록/수정 실패');
    }
  };

  // 4. 삭제 버튼 (mock/실제 분기 + 주석/로그)
  const handleDelete = async (id) => {
    Alert.alert(
      "댓글 삭제",
      "댓글을 삭제하시겠습니까?",
      [
        { text: "아니오", style: "cancel" },
        {
          text: "네",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteComment(id, token);
              await fetchComments();
            } catch (e) {
              alert('댓글 삭제 실패');
            }
          }
        }
      ]
    );
  };

  // 5. 수정 버튼
  const handleEdit = (id, content) => {
    setEditId(id);
    setEditContent(content);
    setTimeout(() => {
      const idx = comments.findIndex(c => c.id === id);
      if (idx >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.6  // 0.5: 중앙, 0.6~0.7: 하단 부근
        });
      }
      editInputRefs.current[id]?.focus && editInputRefs.current[id].focus();
    }, 400);
  };

  //(3) 댓글 수정  저장 함수 추가
  const handleInlineEditSubmit = async (id) => {
    if (!editContent.trim()) return;
    try {
      await editComment(id, editContent, token);
      setEditId(null);
      setEditContent('');
      await fetchComments();
    } catch (e) {
      alert('댓글 수정 실패');
    }
  };

  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const moreBtnRefs = useRef({}); // 각 댓글별 ref 저장(댓글 모달 높이 )

  // 댓글 랜더 (1개)
  const renderItem = ({ item }) => (
  <View style={styles.commentRow}>
    {/* 첫 줄: 프로필 + 닉네임 + (오른쪽) 시간 + 더보기 */}
    <View style={styles.topRow}>
      <Image source={{ uri: item.profileUrl }} style={styles.profileImg} />
      <Text style={styles.nickname}>{item.nickname}</Text>
      <View style={styles.flexSpacer} />
      <View style={styles.timeAndMenuCol}>
        <Text style={styles.time}>{item.createdDate}</Text>
        {item.isMine && (
          <>
            <TouchableOpacity
              ref={ref => { moreBtnRefs.current[item.id] = ref; }} // 댓글 모달창 위치 계산산
              style={styles.moreBtn}
              onPress={() => {
                moreBtnRefs.current[item.id].measure((fx, fy, width, height, px, py) => {
                  setMenuPosition({ top: py + height - scale(25), right: scale(16) }); // px, py는 스크린 기준!
                  setOpenMenuId(openMenuId === item.id ? null : item.id);
                });
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="more-horiz" size={scale(22)} color="#7E7E7E" />
            </TouchableOpacity>
 {/* ---------- (수정) 댓글 더보기 메뉴 Modal로 변경 시작 ---------- */}
            <Modal
              visible={openMenuId === item.id}
              transparent
              animationType="fade"
              onRequestClose={() => setOpenMenuId(null)}
            >
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setOpenMenuId(null)}
              >
                <View style={[
                  styles.modalMenuBox,
                  {
                    position: 'absolute',
                    top: menuPosition.top,
                    right: menuPosition.right,
                  }
                ]}>
                  <TouchableOpacity
                    style={styles.menuEdit}
                    onPress={() => { setOpenMenuId(null); handleEdit(item.id, item.content); }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.menuText, { color: '#4F46E5' }]}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuDelete}
                    onPress={() => { setOpenMenuId(null); handleDelete(item.id); }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.menuText, { color: '#F97575' }]}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
            {/* ---------- (수정) 댓글 더보기 메뉴 Modal로 변경 끝 ---------- */}
          </>
        )}
      </View>
    </View>
    {/* 두 번째 줄: 댓글 본문 */}
    <View style={styles.commentContentWrap}>
        {editId === item.id ? (
      <View style={{ flex: 1 }}>
        <TextInput
          ref={ref => { editInputRefs.current[item.id] = ref; }}
          value={editContent}
          onChangeText={setEditContent}
          style={[styles.commentContent, { backgroundColor: '#ffffff', minHeight: 34 }]}
          multiline
          autoFocus
          maxLength={200}
        />
        {/* 버튼 우측정렬 */}
        <View style={{ flexDirection: 'row', marginTop: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ marginRight: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#FFF' }}
            onPress={() => handleInlineEditSubmit(item.id)}
          >
            <Text style={{ color: '#4F46E5', fontWeight: 'bold', fontSize: 13 }}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginRight: scale(6) ,paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#FAFAFA' }}
            onPress={() => {
              setEditId(null);
              setEditContent('');
            }}
          >
            <Text style={{ color: '#333', fontSize: 13 }}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : (
      <Text style={styles.commentContent}>{item.content}</Text>
    )}
  </View>
  </View>
);

  return (
    // 전체를 flex:1 View로 감싼다
    <View style={{ flex: 1 }}>
      {/* 댓글 리스트 */}
      <FlatList
        ref={flatListRef}
        data={comments}
        renderItem={renderItem}
        keyExtractor={(item, idx) => (item.id ?? idx).toString()}
        getItemLayout={(data, index) => ({
          length: vScale(100),
          offset: vScale(100) * index,
          index,
        })}
        contentContainerStyle={{
          paddingBottom: vScale(100),
          paddingTop: vScale(8),
        }}
        ListEmptyComponent={
          <View style={{ paddingBottom: vScale(120) }}>
            <Text style={styles.emptyText}>아직 작성된 댓글이 없어요</Text>
          </View>
        }
        keyboardShouldPersistTaps="always"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4F46E5"
            colors={['#4F46E5']}
          />
        }
      />

      {/* 하단 입력창만 KeyboardAvoidingView로 분리 */}
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // 값 조정 가능
    >
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          placeholder="댓글을 작성해 주세요."
          value={input}
          onChangeText={setInput}
          maxLength={200}
          editable={editId === null}
          style={[
            styles.input,
            { 
              height: Math.max(minHeight, Math.min(inputHeight, maxHeight)),
              fontSize: scale(14),
              backgroundColor: editId === null ? '#FFF' : '#fff',
              color: editId === null ? '#000' : '#B0B0B0',
            }
          ]}
          placeholderTextColor="#7E7E7E"
          multiline
          onContentSizeChange={e => setInputHeight(e.nativeEvent.contentSize.height)}
          textAlignVertical="center"
          returnKeyType="default"
          onFocus={() => {
            if (comments.length > 0 && flatListRef.current?.scrollToIndex) {
              setTimeout(() => {
                flatListRef.current.scrollToIndex({
                  index: comments.length - 1,
                  animated: true,
                  viewPosition: 0.6
                });
              }, 200);
            }
          }}
        />
          <TouchableOpacity
          style={[
            styles.submitBtn,
            { 
              backgroundColor: input.trim() && editId === null ? '#FFFFFF' : '#FAFAFA',
              opacity: editId === null ? 1 : 0.5,
            }
          ]}
          onPress={handleSubmit}
          disabled={!input.trim() || editId !== null}
        >
          <Text style={styles.submitText}>등록</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: vScale(18),
    marginBottom: vScale(20),
    paddingHorizontal: scale(16),
    flex: 1,
    backgroundColor: '#FAFAFA'
  },
  commentRow: {
    minHeight: vScale(90),
    borderRadius: scale(14),
    backgroundColor: '#FFFFFF',
    marginTop: vScale(12),
    marginHorizontal: scale(14),
    flexDirection: 'column', // 이제 column!
    paddingVertical: vScale(7),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vScale(4),
  },
  profileImg: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(14),
    backgroundColor: '#bbb',
    marginLeft: scale(8),
    
  },
  commentTextArea: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  commentContentWrap: {
    flex: 1,
    minWidth: 0,
  },
  nickname: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    color: '#333333',
    marginLeft: scale(8),
  },
  flexSpacer: {
    flex: 1,
  },
  timeAndMenuCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginRight: scale(10), // 오른쪽 맞춤 간격, 필요시 조절
    marginTop: scale(10),
  },
  time: {
    width: scale(50),
    height: vScale(23),
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: vScale(25),
    color: '#7E7E7E',
    textAlign: 'right',
  },
  commentContent: {
    fontSize: scale(14),
    color: '#000000',
    backgroundColor: '#FAFAFA',
    borderRadius: scale(6),
    padding: scale(6),
    paddingLeft: scale(14),
    marginBottom: vScale(4),
    width: '100%',  
  },
  moreBtn: {
    width: scale(22),
    height: scale(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(2),
    marginRight: vScale(4),
  },
  btnCol: {
  flexDirection: 'row',
  alignItems: 'center',
  marginLeft: scale(8),
  // ...기존 스타일 유지
  },
  editBtn: {
    color: '#7E7E7E', //#4F46E5
    fontWeight: '500',
    fontSize: scale(14),
    // 삭제와의 간격은 삭제 버튼에서 처리
  },
  delBtn: {
    color: '#7E7E7E', //#E53E3E
    fontWeight: '500',
    fontSize: scale(14),
    marginLeft: scale(8),   // 수정과 삭제 여백
    marginRight: scale(20),
  },
  commentContentWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: vScale(4),
  },
  commentContent: {
    fontSize: scale(14),
    color: '#000000',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(6),
    padding: scale(6),
    marginLeft: scale(4),
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: scale(16),
    minHeight: vScale(40), // 고정X
    maxHeight: vScale(31) * 5 + vScale(8),
    marginTop: vScale(8),
    marginHorizontal: scale(13),
    paddingHorizontal: scale(8),
    borderWidth: 1,
    borderColor: '#f0f0f0', //#B3B3B3
  },
  input: {
    flex: 1,
    fontSize: scale(14),
    color: '#000',
    paddingHorizontal: scale(8),
    paddingVertical: Platform.OS === 'ios' ? vScale(8) : 0,  // ← IOS 는 이 부분 조절.
    textAlignVertical: 'center', // ← aos는 이부분 조절.
    // height는  코드에서 직접 관리
  },
  submitBtn: {
    width: scale(50),
    height: vScale(29),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
  },
  submitText: {
    fontSize: scale(14),
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7E7E7E',
    fontSize: scale(14),
    marginTop: vScale(20),
    marginBottom: vScale(20),
  },
  moreBtn: {
  width: scale(22),
  height: scale(22),
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: vScale(2),
  marginBottom: vScale(2),
},
modalBackdrop: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.02)',
},
modalMenuBox: {
  position: 'absolute',
  // 아래 두 줄: 시간/더보기 버튼 기준 위치, 직접 조정하세요!
  top: scale(82), // 필요에 따라 조정 (FlatList 기준, 댓글 박스 아래 + N px)
  right: scale(16), // 화면 오른쪽에서부터 얼마나 떨어질지 (기존 디자인 맞게)
  width: scale(72),
  backgroundColor: '#FFF',
  borderRadius: scale(10),
  shadowColor: '#000',
  shadowOffset: { width: 2, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 6,
  elevation: 7,
  zIndex: 999,
  overflow: 'visible',
},
menuEdit: {
  width: scale(72),
  height: scale(26),
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FFF',
  borderBottomWidth: 0.3,
  borderBottomColor: '#C7C7C7',
  borderTopLeftRadius: scale(8),
  borderTopRightRadius: scale(8), 
},
menuEditText: {
  width: scale(26),
  height: scale(12),
  fontFamily: 'Roboto',
  fontWeight: '400',
  fontSize: scale(10),
  lineHeight: scale(25),
  textAlign: 'center',
  textAlignVertical: 'center',
  color: '#FFFFFF',
  backgroundColor: '#4F46E5',
  borderRadius: scale(4),
  overflow: 'hidden',
  paddingHorizontal: scale(2),
  paddingVertical: scale(2),
},
menuDelete: {
  width: scale(72),
  height: scale(26),
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FFF',
  borderBottomLeftRadius: scale(8),
  borderBottomRightRadius: scale(8),
  borderTopWidth: 0.3,
  borderTopColor: '#C7C7C7',
},
menuDeleteText: {
  width: scale(26),
  height: scale(12),
  fontFamily: 'Roboto',
  fontWeight: '400',
  fontSize: scale(10),
  lineHeight: scale(25),
  textAlign: 'center',
  textAlignVertical: 'center',
  color: '#FFFFFF',
  backgroundColor: '#F97575',
  borderRadius: scale(4),
  overflow: 'hidden',
  paddingHorizontal: scale(2),
  paddingVertical: scale(2),
},
rightColumn: {
  width: scale(50),
  alignItems: 'flex-end',
  justifyContent: 'flex-start',
  position: 'relative', // inlineMenu absolute 배치 기준
},
menuText: {
  width: scale(26),
  height: scale(16),
  fontFamily: 'Roboto',
  fontWeight: '400',
  fontSize: scale(10),
  lineHeight: scale(16),
  textAlign: 'center',
  textAlignVertical: 'center',
  backgroundColor: '#FFF',
},
});

