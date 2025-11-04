// components/commnuity/PostDetailScreen.jsx 게시글 상세보기기
// 게시글 상세 전체(메인) 화면, 컴포넌트 조합
import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions, Image,
   ActivityIndicator, useNavigation, BackHandler, Alert, RefreshControl, KeyboardAvoidingView, Platform ,FlatList
  } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHeader from './common/PostHeader';
import PostImageCarousel from './common/PostImageCarousel';
import CommentSection from './common/CommentSection';
import { getPostDetail, deletePost, getCommentList } from '../../api/community';
import {decode as atob} from 'base-64';
import { ENUM_TO_PROVINCE_KOR, ENUM_TO_CITY_KOR } from '../common/regionMap';
import { useFocusEffect } from '@react-navigation/native';
import { LogBox } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

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
// const isMock = true; //목데이터
/*
const mockPostList = {
  1: {
    id: 1,
    title: "서울 강남 맛집 추천드려요!",
    nickname: "여행러버123",
    userProfileImage: "https://via.placeholder.com/36x36.png",
    createdDate: "2025.07.09 15:30",
    destination: "서울",
    postImages: ["https://source.unsplash.com/800x600/?korea,food"],
    content: "강남구에서 발견한 숨은 맛집 공유해요! 가격도 괜찮고 분위기 좋았어요~",
    userId: 101,
  },
  2: {
    id: 2,
    title: "제주도 한달살기 후기 공유합니다",
    nickname: "오지여행자",
    userProfileImage: "https://via.placeholder.com/36x36.png",
    createdDate: "2025.07.08 11:10",
    destination: "제주",
    postImages: ["https://source.unsplash.com/800x600/?jeju,island"],
    content: "제주에 살아보니 알게 된 현실 정보들! 렌트카 팁도 있어요.",
    userId: 102,
  },
};

const mockCommentList = {
  1: [
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
  ],
  2: [
    {
      id: 103,
      nickname: '오지여행자',
      content: '좋은 정보 감사합니다!',
      profileUrl: 'https://placehold.co/36x36',
      createdDate: '1시간 전',
      isMine: false,
    },
  ],
}; */


export default function PostDetailScreen({ route, navigation }) {
  const [token, setToken] = useState(null);
  const [post, setPost] = useState(isMock ? mockPostList : null);
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
  //목데이터
  /*
  useEffect(() => {
  if (!isMock && token && postId) {
    getPostDetail(postId, token);
  } else if (isMock) {
    const selected = mockPostList[postId];
    setPost(selected || null);
  }
}, [isMock, token, postId]);
*/
//여기까지
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


  // 댓글 렌더 함수 (CommentSection에 개별 댓글 렌더 분리했으면 그거 써도 OK)
  const renderCommentItem = ({ item }) => (
      <CommentSection.CommentItem {...item} />
    );

    // 게시글 본문 렌더 (헤더)
    const renderHeader = () => (
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
      {/* 구분선 */}
      <View style={styles.divider} />

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

    </View>
  );


  // 입력창 + 댓글 작성 영역 (Footer)
  const renderFooter = () => (
    //목데이터
    /*
    <CommentSection
  postId={postId}
  myNickname={post?.nickname}
  comments={mockCommentList[postId]}
  setComments={undefined}
  /> 
  */
 //여기까지
    
  <CommentSection
    postId={post.postId}
    myNickname={myNickname}
    // comments={comments}
    // setComments={setComments}
  /> 
); 

  if (!post) return <Text>게시글을 불러올 수 없습니다.</Text>;
 
    
    return (
    <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // 헤더 높이에 따라 조절
  >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <PostHeader
          title={post.title}
          showMore={isMyPost}
          onDelete={handleDelete}
          onBack={() => navigation.navigate('CommunityMain')}
          onEdit={() => navigation.navigate('EditPost', { postId: post.postId, post })}
        />
        <ScrollView
      contentContainerStyle={{ paddingBottom: 30 }}
      keyboardShouldPersistTaps="handled"
    >
      {renderHeader()}
      {renderFooter()}
    </ScrollView>
      </SafeAreaView>
    /</KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  
  mainCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12), // ⬅️ 시안 값 (12px)
    marginHorizontal: scale(16), // ⬅️ 시안 값 (left: 16px)
    marginTop: vScale(13),
  },
  titleProfileContainer: {
    flexDirection: 'column',
    marginTop: vScale(13),
    // ⬇️ 343px(카드) - 323px(내용) = 20px / 2 = 10px
    paddingHorizontal: scale(10), 
  },
  title: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(22), // ⬅️ 시안 값 (22px)
    lineHeight: scale(25),
    color: '#1E1E1E', // ⬅️ 시안 값
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
  profileImg: { // 'image 24'
    width: scale(36),
    height: scale(36),
    borderRadius: scale(14), // ⬅️ 시안 값 (14px)
    backgroundColor: '#eee',
  },
  nickname: { // '기본 프로필'
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14), // ⬅️ 시안 값 (14px)
    lineHeight: scale(25),
    color: '#333333', // ⬅️ 시안 값
    borderRadius: scale(8),
    marginLeft: scale(6),
  },
  date: { // '2025.05.31...'
    fontSize: scale(14), // ⬅️ 시안 값 (14px)
    color: '#606060', // ⬅️ 시안 값
    borderRadius: scale(6),
  },
  destination: { // '춘천'
    fontSize: scale(14), // ⬅️ 시안 값 (14px)
    color: '#606060', // ⬅️ 시안 값
    borderRadius: scale(6),
    marginLeft: scale(6),
  },
  content: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16), // ⬅️ 시안 값 (16px)
    lineHeight: scale(22),
    backgroundColor: '#FFFFFF',
    color: '#373737', // ⬅️ 시안 값
    marginTop: vScale(16),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderRadius: scale(12), // ⬅️ 시안 값 (12px)
  },
  divider: {
    width: '90%', // ⬅️ 332px / 375px (비율로 변경)
    alignSelf: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1', // ⬅️ 시안 값
    marginTop: vScale(18),
    marginBottom: vScale(18),

  },
});