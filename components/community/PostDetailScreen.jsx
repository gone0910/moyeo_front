// components/commnuity/PostDetailScreen.jsx 게시글 상세보기기
// 게시글 상세 전체(메인) 화면, 컴포넌트 조합
import React, { useEffect, useState } from 'react';
import { SafeAreaView, FlatList, View, Text, StyleSheet, Dimensions, Image,
   ActivityIndicator, useNavigation, BackHandler,  Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHeader from './common/PostHeader';
import PostImageCarousel from './common/PostImageCarousel';
import CommentSection from './common/CommentSection';
import { getPostDetail, deletePost } from '../../api/community';
import {decode as atob} from 'base-64';
import { ENUM_TO_PROVINCE_KOR, ENUM_TO_CITY_KOR } from '../common/regionMap';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshControl } from 'react-native'; // 새로고침(스크롤 위로 당기면)

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
  
  // 게시글 새로고침
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (!isMock && token && postId) {
        const data = await getPostDetail(postId, token);
        setPost(data);
      }
      // mock 처리 필요하면 추가
    } catch (error) {
      Alert.alert('게시글 새로고침 실패!');
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <PostHeader
        title={post.title}
        showMore={isMyPost}
        onDelete={handleDelete}
        onBack={() => navigation.navigate('CommunityMain')} 
        onEdit={() => {
        // 전체 post 객체 or postId를 넘겨서 이동
        navigation.navigate('EditPost', {
          postId: post.postId,
          post: post // 선택적 (Edit에서 모든 값 자동 세팅 원할 때)
        });
      }}
      />  
      <FlatList
        data={[]} // 댓글 직접 출력하지 않음
        renderItem={null} // 또는 () => null
        ListHeaderComponent={
          <>
            {/* 제목 */}
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
                    {/* 
                      - province(도) 값이 있으면 출력
                      - city(시)가 NONE이거나 undefined/공백이면, 아무것도 붙이지 않음!
                    */}
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
            {/* <View style={styles.divider} /> */}
            
            {/* ✅ 여기서 공백 추가! */}
            <View style={{ height: vScale(34) }} />


            {/* 이미지 슬라이더 */}
            <PostImageCarousel images={post.postImages} />
            {/* 본문 텍스트 */}
            <Text style={styles.content}>{post.content}</Text>
            {/* 구분선 */}
            <View style={styles.divider} />
          </>
        }
        ListFooterComponent={
          <>
          {console.log('[상세화면] CommentSection에 전달하는 post.postId:', post?.postId)}
          {post && post.postId && (
          <CommentSection
            postId={post.postId}
            isMock={isMock}
            myNickname={myNickname} // ✅ 내 닉네임 전달
          />
        )}
              </>
            }
            // scrollEnabled={true} // 기본값
            contentContainerStyle={{ paddingBottom: 20 }}

          refreshControl={ // 새로고침 작동
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },

  titleProfileContainer: {
    flexDirection: 'column',   // 제목이 길면 프로필 섹션을 자동으로 아래로 밀어냄
    paddingHorizontal: scale(19),
    marginTop: vScale(13),
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
  },
  profileImg: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(14),
    backgroundColor: '#eee',
    marginRight: scale(8),
  },
  nickname: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(14),
    lineHeight: scale(25),
    color: '#333333',
    borderRadius: scale(8),
  },
  date: {
    fontSize: scale(14),
    color: '#606060',
    borderRadius: scale(6),
    marginRight: scale(6),
  },
  destination: {
    fontSize: scale(14),
    color: '#606060',
    borderRadius: scale(6),
    paddingLeft: scale(6),
  },
  content: {
    width: scale(312),
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(16),
    lineHeight: scale(22),
    backgroundColor: '#FFFFFF',
    color: '#373737',
    marginTop: vScale(16),
    marginLeft: scale(13),
    padding: scale(12),
    borderRadius: scale(8),
    minHeight: vScale(160), // ⭐ 최소 120px 높이 (아이폰13 기준)
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