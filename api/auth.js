// api/auth.js
// 설치 npx expo install axios

import axios from 'axios';

const BASE_URL = 'https://your-api.com'; // 백엔드 주소에 맞게 수정하셈셈

// 일반 로그인 요청 (이메일/비밀번호)
export const loginUser = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email,
    password,
  });
  return response.data; // 서버에서 받은 사용자 정보
};

// OAuth 로그인 요청 (카카오/구글)
export const loginUserWithOAuth = async (provider, code) => {
  // 예: provider = 'kakao', code = OAuth 인증 코드
  const response = await axios.post(`${BASE_URL}/auth/${provider}/callback`, {
    code,
  });
  return response;
};

// 회원가입 요청 (회원정보 입력 후 최종 등록)
export const registerUser = async (formData, token) => {
  const response = await axios.post(`${BASE_URL}/auth/register`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};