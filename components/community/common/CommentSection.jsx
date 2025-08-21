// components/community/common/CommentSection.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Dimensions,
  KeyboardAvoidingView, Platform, FlatList, Modal, Alert, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCommentList, createComment, editComment, deleteComment } from '../../../api/community';
import { MaterialIcons } from '@expo/vector-icons';
import { InteractionManager } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const vScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

// headerComponent 추가 (네 주석/코드 유지)
const CommentSection = forwardRef((
  { postId, myNickname = '', comments: propComments, setComments: setPropComments, headerComponent = null },
  ref
) => {
  const [input, setInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [token, setToken] = useState('');
  const [inputHeight, setInputHeight] = useState(vScale(31));
  const minHeight = vScale(31);
  const maxHeight = vScale(31) * 5;
  const [openMenuId, setOpenMenuId] = useState(null);
  const inputRef = useRef(null);
  const flatListRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const editInputRefs = useRef({});
  const [commentsState, setCommentsState] = useState([]);

  // ✅ 사용자 상호작용이 있었을 때만 리스트를 바닥으로 보냄
  const [userInteracted, setUserInteracted] = useState(false);

  const comments = propComments ?? commentsState;
  const setComments = setPropComments ?? setCommentsState;

  // === 기존 네 주석 유지 (자동 스크롤 샘플은 동작 제거) ===
  // const onAddComment = async () => {
  //   // 댓글 등록 로직 (서버 요청 등)
  //   await saveCommentToServer(newComment);
  //   setComments(prev => [...prev, newComment]);
  //   // ⛔ 진입/렌더 자동 스크롤 제거: 사용자 상호작용 시에만 스크롤
  // };

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
        })
        .catch(error => console.error('[초기 진입] 댓글 리스트 불러오기 실패:', error));
    }
  }, [token, postId, myNickname]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchComments();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem('jwt').then(value => {
      if (value) setToken(value);
    });
  }, []);

  const fetchComments = async () => {
    try {
      const data = await getCommentList(postId, token);
      setComments(
        data.map(item => ({
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

  useImperativeHandle(ref, () => ({ refreshComments: fetchComments }));

  function toKoreanDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Date(date.getTime() + 9 * 60 * 60 * 1000);
  }

  function getRelativeTime(isoString) {
    if (!isoString) return '';
    const now = new Date();
    const past = toKoreanDate(isoString);
    const diff = (now.getTime() - past.getTime()) / 1000;

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)}달 전`;
    return `${Math.floor(diff / 31536000)}년 전`;
  }

  useEffect(() => {
    if (propComments) return;
    if (!token || !postId) return;
    fetchComments();
  }, [token, postId, propComments]);

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

      // ✅ "등록"이라는 사용자 상호작용 이후에만 스크롤/포커스
      setUserInteracted(true);
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToEnd?.({ animated: true });
          inputRef.current?.focus();
        });
      });
    } catch (e) {
      alert('댓글 등록/수정 실패');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("댓글 삭제", "댓글을 삭제하시겠습니까?", [
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
    ]);
  };

  const handleEdit = (id, content) => {
    setEditId(id);
    setEditContent(content);
    setTimeout(() => {
      const idx = comments.findIndex(c => c.id === id);
      if (idx >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.6 });
      }
      editInputRefs.current[id]?.focus?.();
    }, 400);
  };

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
  const moreBtnRefs = useRef({});

  const renderItem = ({ item }) => {
    if (!moreBtnRefs.current[item.id]) {
      moreBtnRefs.current[item.id] = React.createRef();
    }

    return (
      <View style={styles.commentRow}>
        <View style={styles.topRow}>
          <Image source={{ uri: item.profileUrl }} style={styles.profileImg} />
          <Text style={styles.nickname}>{item.nickname}</Text>
          <View style={styles.flexSpacer} />
          <View ref={moreBtnRefs.current[item.id]}>
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => {
                const ref = moreBtnRefs.current[item.id].current;
                ref?.measure((fx, fy, width, height, px, py) => {
                  setMenuPosition({ top: py + height - scale(25), right: scale(16) });
                  setOpenMenuId(openMenuId === item.id ? null : item.id);
                });
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="more-horiz" size={scale(22)} color="#7E7E7E" />
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={openMenuId === item.id} transparent animationType="fade" onRequestClose={() => setOpenMenuId(null)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpenMenuId(null)}>
            <View style={[styles.modalMenuBox, { top: menuPosition.top, right: menuPosition.right }]}>
              <TouchableOpacity style={styles.menuEdit} onPress={() => { setOpenMenuId(null); handleEdit(item.id, item.content); }} activeOpacity={0.85}>
                <Text style={[styles.menuText, { color: '#4F46E5' }]}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuDelete} onPress={() => { setOpenMenuId(null); handleDelete(item.id); }} activeOpacity={0.85}>
                <Text style={[styles.menuText, { color: '#F97575' }]}>삭제</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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
              <View style={{ flexDirection: 'row', marginTop: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                <TouchableOpacity style={{ marginRight: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#FFF' }} onPress={() => handleInlineEditSubmit(item.id)}>
                  <Text style={{ color: '#4F46E5', fontWeight: 'bold', fontSize: 13 }}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginRight: scale(6), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#FAFAFA' }} onPress={() => { setEditId(null); setEditContent(''); }}>
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
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={comments}
        renderItem={renderItem}
        keyExtractor={(item, idx) => (item.id ?? idx).toString()}
        // getItemLayout 제거: 댓글 높이가 가변이므로 자동 측정에 맡깁니다.
        contentContainerStyle={{ paddingBottom: vScale(16), paddingTop: vScale(8) }}
        ListEmptyComponent={<View style={{ paddingBottom: vScale(16) }}><Text style={styles.emptyText}>아직 작성된 댓글이 없어요</Text></View>}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // 헤더를 CommentSection 쪽에서 제어할 수 있게 연결
        ListHeaderComponent={headerComponent}
        // ⛔ 화면 진입/렌더 시 자동 스크롤 제거 (사용자 상호작용 전에는 스크롤 이동 안 함)
        // onContentSizeChange 미사용
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          // 실패 시 근사 오프셋으로 1차 스크롤 후 재시도
          const est = Math.max(0, (averageItemLength || 80) * index);
          flatListRef.current?.scrollToOffset({ offset: est, animated: false });
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 1 });
          }, 120);
        }}
        ListFooterComponent={<View style={{ height: vScale(4) }} />} // 바닥 여유 공간 살짝만
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4F46E5" colors={['#4F46E5']} />}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            placeholder="댓글을 작성해 주세요."
            value={input}
            onChangeText={setInput}
            maxLength={200}
            editable={editId === null}
            style={[styles.input, {
              height: Math.max(minHeight, Math.min(inputHeight, maxHeight)),
              fontSize: scale(14),
              backgroundColor: editId === null ? '#FFF' : '#fff',
              color: editId === null ? '#000' : '#B0B0B0'
            }]}
            placeholderTextColor="#7E7E7E"
            multiline
            onContentSizeChange={e => setInputHeight(e.nativeEvent.contentSize.height)}
            textAlignVertical="center"
            returnKeyType="default"
            onFocus={() => {
              console.log('TextInput focused');
              // ✅ 사용자 상호작용 발생: 이후부터만 스크롤 허용
              setUserInteracted(true);
              // 키보드 애니메이션 이후로 살짝 지연 → 마지막 아이템 정조준
              InteractionManager.runAfterInteractions(() => {
                setTimeout(() => {
                  if (comments?.length > 0) {
                    flatListRef.current?.scrollToIndex({
                      index: comments.length - 1,
                      animated: true,
                      viewPosition: 1, // 리스트 바닥에 맞춰보기
                    });
                  } else {
                    flatListRef.current?.scrollToEnd?.({ animated: true });
                  }
                }, 220);
              });
            }}
          />
          <TouchableOpacity
            style={[styles.submitBtn, {
              backgroundColor: input.trim() && editId === null ? '#FFFFFF' : '#FAFAFA',
              opacity: editId === null ? 1 : 0.5
            }]}
            onPress={handleSubmit}
            disabled={!input.trim() || editId !== null}
          >
            <Text style={styles.submitText}>등록</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
});

export default CommentSection;

// 이 코드를 CommentSection.jsx 맨 아래(마지막 줄 근처)에 붙여넣으세요

export function CommentItem(props) {
  // props에는 댓글 한 개의 모든 정보(id, nickname, content, profileUrl, createdDate, isMine 등)가 담겨있음
  return (
    <View style={styles.commentRow}>
      {/* 프로필 + 닉네임 + 시간 */}
      <View style={styles.topRow}>
        <Image source={{ uri: props.profileUrl }} style={styles.profileImg} />
        <Text style={styles.nickname}>{props.nickname}</Text>
        <View style={styles.flexSpacer} />
        <View style={styles.timeAndMenuCol}>
          <Text style={styles.time}>{props.createdDate}</Text>
          {/* 필요한 경우 수정/삭제 버튼은 직접 추가 가능 */}
        </View>
      </View>
      {/* 댓글 본문 */}
      <View style={styles.commentContentWrap}>
        <Text style={styles.commentContent}>{props.content}</Text>
      </View>
    </View>
  );
}

// 반드시 이 코드를 추가해서 내보내세요!
CommentSection.CommentItem = CommentItem;

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
  // 중복 정의 정리: commentContentWrap/commentContent 한 벌만 유지
  commentContentWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: vScale(4),
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
    backgroundColor: '#FFFFFF',
    borderRadius: scale(6),
    padding: scale(6),
    marginLeft: scale(4),
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: scale(16),
    minHeight: vScale(40), // 고정X
    maxHeight: vScale(31) * 5 + vScale(8),
    marginTop: vScale(8),
    marginBottom: vScale(8),
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
    height: vScale(26),
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
    height: vScale(26),
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
