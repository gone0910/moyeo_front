// components/commnuity/PostDetailScreen.jsx 게시글 상세보기기
// [리팩토링]
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image,
   ActivityIndicator, useNavigation, BackHandler, Alert, RefreshControl, Platform, KeyboardAvoidingView,
  } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHeader from './common/PostHeader';
import PostImageCarousel from './common/PostImageCarousel';
import CommentSection from './common/CommentSection';
import { getPostDetail, deletePost, getCommentList } from '../../api/community';
import {decode as atob} from 'base-64';
import { ENUM_TO_PROVINCE_KOR, ENUM_TO_CITY_KOR } from './common/regionEnum'; 
import { useFocusEffect } from '@react-navigation/native';
import { LogBox } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

LogBox.ignoreLogs([
  'VirtualizedLists should never be nested', 
]);

// --- (Helper Functions: formatKoreanDateTime, decodeJWT, scale, vScale, 등) ---
// (기존 코드와 동일)
// api 받아온 타임스탬프 정형화
const formatKoreanDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const utc = date.getTime();
  const kst = new Date(utc + 9 * 60 * 60 * 1000);
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

 const isMock = false; 
// ---------------------------------------------------------------------


export default function PostDetailScreen({ route, navigation }) {
  const [token, setToken] = useState(null);
  const [post, setPost] = useState(isMock ? mockPostList : null);
  const [loading, setLoading] = useState(!isMock);
  const [myNickname, setMyNickname] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const commentSectionRef = useRef();
  // const [comments, setComments] = useState([]); // CommentSection이 자체 관리하므로 주석 처리
  
  const postId = route?.params?.postId || 1; // postId를 상단으로 이동

  // [수정] 1. 게시글 데이터 로드 함수 추출
  const loadPostData = async (showLoadingSpinner = true) => {
    if (isMock || !token || !postId) return;

    if (showLoadingSpinner) {
      setLoading(true); // 메인 로딩 스피너
    } else {
      setRefreshing(true); // 당겨서 새로고침 스피너
    }
    
    try {
      // 본문 새로고침
      const data = await getPostDetail(postId, token);
      setPost(data);
      console.log('[loadPostData] 게시글 본문 갱신 완료');
    } catch (error) {
      Alert.alert('데이터 로드 실패', error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      console.error(error);
    }
    
    if (showLoadingSpinner) {
      setLoading(false);
    } else {
      setRefreshing(false);
    }
  };

  // onRefresh가 loadPostData 함수를 호출
  const onRefresh = async () => {
    await loadPostData(false); 
  };


  // --- (Helper Functions: toKoreanDate, getRelativeTime) ---
  // (기존 코드와 동일)
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
  // ---------------------------------------------------------------------

  // 뒤로가기 제어 (기존 코드와 동일)
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('CommunityMain'); 
        return true; 
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        backHandler.remove(); 
      };
    }, [navigation])
  );

  // JWT 토큰 로드 (기존 코드와 동일)
  useEffect(() => {
    const loadJwt = async () => {
      try {
        const value = await AsyncStorage.getItem('jwt');
        if (value) {
          setToken(value); 
          const claims = decodeJWT(value);
          setMyNickname(claims.nickname);
        }
      } catch (e) {
        alert('토큰 불러오기 실패');
      }
    };
    loadJwt();
  }, []);

  // [수정] 3. 첫 로드 시 loadPostData 호출
  useEffect(() => {
    if (!isMock && token && postId) { 
      loadPostData(true); // true = 메인 로딩 스피너 사용
    } else if (isMock) {
      // (mock 데이터 로직)
      const selected = mockPostList[postId];
      setPost(selected || null);
    }
  }, [isMock, token, postId]); 

  // [추가] 4. 수정 완료 후 돌아왔을 때 loadPostData 호출
  useEffect(() => {
    if (route.params?.postUpdated) {
      console.log('[PostDetailScreen] postUpdated 신호 감지! 새로고침합니다.');
      loadPostData(false); // false = 메인 스피너 없이 새로고침
      // 불필요한 새로고침을 방지하기 위해 파라미터를 초기화합니다.
      navigation.setParams({ postUpdated: false });
    }
  }, [route.params?.postUpdated, navigation]); // route.params.postUpdated와 navigation을 의존성 배열에 추가


  // --- (Loading 및 Post Check) ---
  // 1. 로딩 중일 때
  if (loading) { 
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        <PostHeader
          title="" 
          showMore={false}
          onBack={() => navigation.navigate('CommunityMain')}
        />
        <ActivityIndicator size="large" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  // 2. 로딩이 끝났는데 post가 없을 때
  if (!post) return <Text>게시글을 불러올 수 없습니다.</Text>;
  // ------------------------------------


  // --- (변수 및 핸들러) ---
  const hasImage = post?.postImages && post.postImages.length > 0;
  const contentMinHeight = hasImage ? vScale(100) : vScale(280);
  const isMyPost = post && myNickname && post.nickname === myNickname;

  // 삭제 함수 (기존 코드와 동일)
  const handleDelete = async () => {
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
              navigation.replace('CommunityMain');
            } catch (e) {
              Alert.alert("삭제 실패", e.message || "삭제에 실패했습니다.");
            }
          }
        },
      ]
    );
  };


  // 댓글 렌더 함수 (CommentSection에 개별 댓글 렌더 분리했으면 그거 써도 OK)
  // const renderCommentItem = ({ item }) => (
  //     <CommentSection.CommentItem {...item} />
  //   );

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }} edges={['top']}>
      <PostHeader
        showMore={isMyPost}
        onBack={() => navigation.navigate('CommunityMain')}
        onDelete={handleDelete}
        onEdit={() => navigation.navigate('EditPost', { postId: post.postId, post })}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // PostHeader의 높이(56)를 보정합니다.
        keyboardVerticalOffset={Platform.OS === 'ios' ? scaleHeight(56) : 0} 
      >
        <CommentSection
          style={{ flex: 1 }} // ⬅️ 이 style은 유지
          postId={postId}
          myNickname={myNickname}
          ListHeaderComponent={renderHeader()} 
        />
        
      </KeyboardAvoidingView>
      {/* ⬆️ [제거] */}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  
  mainCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12), 
    marginHorizontal: scale(16), 
    marginTop: vScale(13),
  },
  titleProfileContainer: {
    flexDirection: 'column',
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
  },
  nickname: { 
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14), 
    lineHeight: scale(25),
    color: '#333333', 
    borderRadius: scale(8),
    marginLeft: scale(6),
  },
  date: { 
    fontSize: scale(14), 
    color: '#606060', 
    borderRadius: scale(6),
  },
  destination: { 
    fontSize: scale(14), 
    color: '#606060', 
    borderRadius: scale(6),
    marginLeft: scale(6),
  },
  content: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16), 
    lineHeight: scale(22),
    backgroundColor: '#FFFFFF',
    color: '#373737', 
    marginTop: vScale(16),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderRadius: scale(12), 
  },
  divider: {
    width: '90%', 
    alignSelf: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1', 
    marginTop: vScale(18),
    marginBottom: vScale(18),

  },
});