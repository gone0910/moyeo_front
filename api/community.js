// api/community.js

import axios from 'axios';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경

// const BASE_URL = 'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080'; // 실제 서버 주소로 교체

// 1. 게시글 상세 조회
// GET /community/post/full/{postId}
export async function getPostDetail(postId, token) {
  const res = await axios.get(
    `${BASE_URL}/community/post/full/${postId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}


// 2. 게시글 삭제
// DELETE /community/post/delete/{postId}
export async function deletePost(postId, token) {
  const res = await axios.delete(
    `${BASE_URL}/community/post/delete/${postId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}


// 3. 댓글 생성
// POST /community/comment/create/{postId}
// 백엔드 명세서 기반, content는 문자열, JWT 토큰 필요
export async function createComment(postId, content, token) {
  try {
    const res = await axios.post(
      `${BASE_URL}/community/comment/create/${postId}`,
      { content }, // { "content": "내용" }
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (error) {
    // 명세서 정의 에러 메시지 로깅
    if (error.response) {
      console.log('[댓글 생성 에러]', error.response.data);
      throw error.response.data;
    }
    throw error;
  }
}

// 4. 댓글 수정
// PUT /community/comment/edit/{commentId}
export async function editComment(commentId, content, token) {
  const res = await axios.put(
    `${BASE_URL}/community/comment/edit/${commentId}`,
    { content },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}

// 5. 댓글 삭제
// DELETE /community/comment/delete/{commentId}
export async function deleteComment(commentId, token) {
  const res = await axios.delete(
    `${BASE_URL}/community/comment/delete/${commentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}

// 6. 댓글 리스트 조회
// GET /community/comment/list/{postId}
export async function getCommentList(postId, token) {
  const res = await axios.get(
    `${BASE_URL}/community/comment/list/${postId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  // 반환 예시:
  // [
  //   {
  //     "nickname": "redis",
  //     "userProfile": "https://...png",
  //     "comment": "테스트 댓글",
  //     "updatedAt": "2025-06-03T20:31:01.419956"
  //   },
  //   ...
  // ]
  return res.data;
}
