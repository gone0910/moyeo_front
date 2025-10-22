// AuthAPI.js
// 백엔드 명세서: 소셜 리다이렉트 파라미터, 회원가입, 재발급, 로그아웃만 구현

import axios from 'axios';
import { BASE_URL } from './config/api_Config';
import * as TokenManager from './TokenManager';

// 소셜 로그인 리다이렉트 파라미터 처리 
export async function handleOAuthRedirectParams(params) {
  try {
    if (params?.mode === 'login') {
      const at = params.access;   // 기존 사용자: access, refresh 동시 전달
      const rt = params.refresh;
      if (at) await TokenManager.setTokens(at, rt || '');
      return { next: 'Home' };
    }
    if (params?.mode === 'register') {
      //const temp = params.token;  // 신규 사용자: 임시 JWT = token
      //if (temp) await TokenManager.setJwt(temp); // 임시도 'jwt' 키 사용
      const temp = params.token?.toString().trim()
        .replace(/^Bearer\s+/i, '')
        .replace(/^"|"$/g, '');
      if (temp) await TokenManager.setJwt(temp);
      return { next: 'SignUp' };
    }
    return { next: 'Login' };
  } catch {
    return { next: 'Login' };
  }
}

// [ADDED] 회원가입 (multipart/form-data)
// Header: Authorization: Bearer {jwt}  (임시/정식 모두 동일 키 사용)
export async function signupWithFormData(formData) {
  const bearer = await TokenManager.getAccessToken();
  if (!bearer) throw new Error('JWT가 없습니다(jwt).');

  const res = await axios.post(`${BASE_URL}/auth/signup`, formData, {
    headers: {
      // Content-Type 지정 X (RN이 boundary 자동 설정)
      Accept: 'application/json',
      Authorization: `Bearer ${bearer}`, // 명세서: 임시 JWT 사용
    },
  });

  const at = res.data?.accessToken;
  const rt = res.data?.refreshToken;
  if (!at || !rt) throw new Error('SignupResponseMissingTokens');

  await TokenManager.setTokens(at, rt); // 회원가입 성공 → 정식 토큰 저장(= jwt 덮어쓰기)
  return res.data;
}


// 토큰 재발급 (POST /auth/reissue)
// Header: refreshToken: Bearer {JWT}  (바디 없음)
// Response: { accessToken, refreshToken }  → 둘 다 저장(회전)
export async function reissueToken(refreshToken) {
  const res = await axios.post(`${BASE_URL}/auth/reissue`, null, {
    headers: { refreshToken: refreshToken }, // 정정 : 순수 RT만 전송
  });

  console.log('--- 🚨 토큰 재발급 API 응답 원본 🚨 ---', res.data);

  const at = res.data?.accessToken;
  const newRt = res.data?.refreshToken;                 // [RESTORED] 변수 충돌 방지
  if (!at || !newRt) throw new Error('ReissueResponseMissingTokens');

  await TokenManager.setTokens(at, newRt);              // 'jwt' / 'refreshToken' 저장
  return { accessToken: at, refreshToken: newRt };
}



// [ADDED] 로그아웃 (POST /auth/logout)
// Header: refreshToken: Bearer {JWT}  (바디 없음)
export async function logoutUser() {
  const rt = await TokenManager.getRefreshToken();

  // 로컬 토큰은 선삭제 (명세 외 부가동작 없이 정리만)
  await TokenManager.clearTokens();

  if (!rt) return; // RT 없으면 서버 호출 생략 가능 (명세 위반 아님)

  try {
    await axios.post(`${BASE_URL}/auth/logout`, null, {
      headers: { refreshToken: rt }, // 정정: 순수 RT만 전송
    });
  } catch {
    // 명세에 없는 추가 처리(알림/네비게이션)는 하지 않음
  }
}