// components/commnuity/PostDetailScreen.jsx 게시글 상세보기기
// 게시글 상세 전체(메인) 화면, 컴포넌트 조합
import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Dimensions, Image,
   ActivityIndicator, useNavigation, BackHandler, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHeader from './common/PostHeader';
import PostImageCarousel from './common/PostImageCarousel';
import CommentSection from './common/CommentSection';
import { getPostDetail, deletePost, getCommentList } from '../../api/community';
import {decode as atob} from 'base-64';
import { ENUM_TO_PROVINCE_KOR, ENUM_TO_CITY_KOR } from '../common/regionMap';
import { useFocusEffect } from '@react-navigation/native';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'VirtualizedLists should never be nested', // 해당 경고 포함하는 메시지 모두 무시
]); // 본문은 scrollview, 댓글은 flatlist라 충돌우려

// api 받아온 타임스탬프 정형화
const formatKoreanDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  // UTC 기준 timestamp에 +9시간을 직접 보정
  const utc = date.getTime();
  const kst = new Date(utc + 9 * 60 * 60 * 1000);

  // pad 함수 (한 자리수 → 0붙임)
  const pad = (n) => n.toString().padStart(2, '0');

  const year = kst.getFullYear();
  const month = pad(kst.getMonth() + 1);
  const day = pad(kst.getDate());
  const hour = pad(kst.getHours());
  const minute = pad(kst.getMinutes());
  return `${year}.${month}.${day} ${hour}:${minute}`;
};


// JWT 직접 파싱 함수 추가
function decodeJWT(token) {
  if (!token) return {};
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.log('[JWT 파싱 에러]', e);
    return {};
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const vScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;


// 1. mock/postId 설정
const isMock = false; // true면 mock, false면 api 연동
const mockPost = {
  id: 1,
  title: "일본식 정통카레의 끝장판",
  nickname: "카레홀릭",
  userProfileImage: "https://placehold.co/36x36.png",
  createdDate: "2025.06.03 14:05",
  destination: "춘천",
  postImages: [
    // require('../../assets/images/testImage1.png'),
    // require('../../assets/images/testImage2.png'),
  ],
  content: `노란 간판부터 일본식 감성 제대로.
혼밥하기 좋은 바 좌석도 있어서
점심에 조용히 혼자 먹기에도 딱 좋은 곳이에요.
카레는 기본 매운맛 조절 가능!`,
  userId: 7
};


export default function PostDetailScreen({ route, navigation }) {
  const [token, setToken] = useState(null);
  const [post, setPost] = useState(isMock ? mockPost : null);
  const [loading, setLoading] = useState(!isMock);
  const [myNickname, setMyNickname] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const commentSectionRef = useRef();
  const [comments, setComments] = useState([]);

  const hasImage = post?.postImages && post.postImages.length > 0; // 사진없으면 min값 확대 있으면 축소
  const contentMinHeight = hasImage ? vScale(100) : vScale(280);

      // 받아온 타임스탬프에 +9시간 더하기 (utc에서 변환)
        function toKoreanDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        // UTC → KST (+9시간)
        return new Date(date.getTime() + 9 * 60 * 60 * 1000);
      }


      // 한국시간 변환
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
  
  // 게시글 + 댓글 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // 본문 새로고침
      if (!isMock && token && postId) {
        const data = await getPostDetail(postId, token);
        setPost(data);
      }
      // 댓글 새로고침 (직접 API 호출)
      if (!isMock && token && postId) {
        const commentData = await getCommentList(postId, token);
    // myNickname은 이미 상태에 있음
    setComments(
      commentData.map(item => ({
        id: item.commentId,
        nickname: item.nickname,
        content: item.comment,
        profileUrl: item.userProfile,
        createdDate: getRelativeTime(item.updatedAt), // (함수 선언 필요)
        isMine: item.nickname === myNickname,
      })));
            console.log('[새로고침] 댓글 리스트 갱신', commentData);
      }
    } catch (error) {
      Alert.alert('새로고침 실패!');
      console.error(error);
    }
    setRefreshing(false);
  };

  // 뒤로가기 시 무조건 commuinityScren.jsx
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('CommunityMain'); // ← 무조건 CommunityMain으로 이동
        return true; // 기본 뒤로가기 동작 무시
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        backHandler.remove(); 
      };
    }, [navigation])
  );


  // route에서 postId 받아오기, 없으면 1 (fallback)
  const postId = route?.params?.postId || 1;


 // jwt 토큰 가져와서 닉네임 추출
  useEffect(() => {
  const loadJwt = async () => {
    try {
      const value = await AsyncStorage.getItem('jwt');
      if (value) {
        setToken(value); // 반드시 먼저 setToken!
        const claims = decodeJWT(value);
        setMyNickname(claims.nickname);
      }
    } catch (e) {
      alert('토큰 불러오기 실패');
    }
  };
  loadJwt();
}, []);

  // ✅ post 값이 바뀔 때마다 구조를 확인하는 로그!
  useEffect(() => {
    console.log('[post 객체 구조]', post);
  }, [post]);

  useEffect(() => {
  console.log('[PostDetailScreen] postId:', postId);
  console.log('[PostDetailScreen] token:', token);
}, [postId, token]);


  // 3. 게시글 상세 API 호출 (토큰/ID 모두 준비된 후)
  useEffect(() => {
  if (!isMock && token && postId) { // token이 있을 때만 호출
    setLoading(true);
    getPostDetail(postId, token)
      .then(data => {
        console.log('[PostDetailScreen] getPostDetail API 응답:', data);
        setPost(data);
      })
      .catch(error => {
        console.error('[PostDetailScreen] getPostDetail 에러:', error);
        alert('게시글 불러오기 실패!');
      })
      .finally(() => setLoading(false));
  }
}, [isMock, token, postId]);


  if (!post) return <Text>게시글을 불러올 수 없습니다.</Text>; // 최소 로딩 표시

  console.log('[상세화면 이미지]', post.postImages);

  // **내가 쓴 글일 때만 더보기 버튼 보이게**
  console.log('[글 작성자 닉네임]', post.nickname);
  // const isMyPost = post.nickname === myNickname;
  const isMyPost = post && myNickname && post.nickname === myNickname;

  // **삭제 함수**  로딩, 에러 처리 (view 렌더링 이전)
  const handleDelete = async () => {
    console.log('[handleDelete] 호출됨!');
    Alert.alert(
      "게시글 삭제",
      "글을 삭제하시겠습니까?",
      [
        { text: "아니오", style: "cancel" },
        { 
          text: "네",
          style: "destructive",
          onPress: async () => {
            try {
              if (isMock) {
                navigation.replace('CommunityMain');
                return;
              }
              await deletePost(postId, token);
              navigation.replace('CommunityMain'); // 뒤로가기로 삭제된 상세 못 봄
            } catch (e) {
              Alert.alert("삭제 실패", e.message || "삭제에 실패했습니다.");
            }
          }
        },
      ]
    );
  };

return (
  <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
  <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
    <PostHeader
      title={post.title}
      showMore={isMyPost}
      onDelete={handleDelete}
      onBack={() => navigation.navigate('CommunityMain')}
      onEdit={() => {
        navigation.navigate('EditPost', {
          postId: post.postId,
          post: post,
        });
      }}
    />
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4F46E5']}
          tintColor="#4F46E5"
        />
      }
    >
      {/* 본문 영역 */}
      <View style={styles.mainCardContainer}>
        <View style={styles.titleProfileContainer}>
          <Text style={styles.title}>{post.title}</Text>
          <View style={styles.profileBlock}>
            <View style={styles.profileTopRow}>
              <Image source={{ uri: post.userProfileImage }} style={styles.profileImg} />
              <Text style={styles.nickname}>{post.nickname}</Text>
            </View>
            <View style={styles.profileBottomRow}>
              <Text style={styles.date}>
                {post.createdDate ? formatKoreanDateTime(post.createdDate) : ''}
              </Text>
              <Text style={styles.destination}>
                {post.province && post.province !== 'NONE'
                  ? ENUM_TO_PROVINCE_KOR[post.province] +
                      (
                        post.city && post.city !== 'NONE'
                          ? ' ' + (ENUM_TO_CITY_KOR[post.city] || post.city).replace(/시$/, '')
                          : ''
                      )
                  : ''
                }
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 공백 */}
      <View style={{ height: vScale(10) }} />

      {/* 이미지 슬라이더 */}
      <PostImageCarousel images={post.postImages} />
      {/* 본문 텍스트 */}
      <Text
        style={[
          styles.content,
          { minHeight: contentMinHeight }, // 크기 조절
        ]}
      >
        {post.content}
      </Text>
      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 댓글 섹션 */}
      {post && post.postId && (
        <CommentSection
          postId={post.postId}
          myNickname={myNickname}
          comments={comments} // ← 직접 관리하는 상태 전달
          setComments={setComments}
        />
      )}
    </ScrollView>
  </SafeAreaView>
  </KeyboardAvoidingView>
);}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  
  mainCardContainer: {   // 제목 ~본문까지 전체 묶는 컨테이너
    backgroundColor: '#FFFFFF',
    borderRadius: scale(14), // 원하는 만큼
    marginHorizontal: scale(14),
    marginTop: vScale(13),
  },
  titleProfileContainer: {
    flexDirection: 'column',   // 제목이 길면 프로필 섹션을 자동으로 아래로 밀어냄
    marginTop: vScale(13),
    paddingHorizontal: scale(10),
  },
  title: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(22),
    lineHeight: scale(25),
    color: '#1E1E1E',
    borderRadius: scale(4),
    paddingVertical: vScale(4),
  },
  profileBlock: {
    marginTop: vScale(8),
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vScale(2),
  },
  profileBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(6),
    marginBottom: scale(6),
  },
  profileImg: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(14),
    backgroundColor: '#eee',
    // marginRight: scale(8),
  },
  profileImg: {
  width: scale(36),
  height: scale(36),
  borderRadius: scale(14),
  backgroundColor: '#eee',
  // marginRight: scale(8),  // 제거
  },
  nickname: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(25),
    color: '#333333',
    borderRadius: scale(8),
    marginLeft: scale(6),   // 제거
  },
  date: {
    fontSize: scale(14),
    color: '#606060',
    borderRadius: scale(6),
    // marginRight: scale(6),  // 제거
  },
  destination: {
    fontSize: scale(14),
    color: '#606060',
    borderRadius: scale(6),
    marginLeft: scale(6),  // 제거
  },

  content: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16),
    lineHeight: scale(22),
    backgroundColor: '#FFFFFF',
    color: '#373737',
    marginTop: vScale(16),
    marginHorizontal: scale(13),
    padding: scale(12),
    borderRadius: scale(8),
  },
  divider: {
    width: scale(358),
    borderBottomWidth: 1,
    borderBottomColor: '#B3B3B3',
    marginTop: vScale(18),
    marginLeft: scale(16),
    marginBottom: vScale(6),
  },
});