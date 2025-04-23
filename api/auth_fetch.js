// 📁 api/auth_fetch.js
// ✅ fetch 기반 회원가입, 사용자 조회, 프로필 수정 API 모음
// - Axios 사용 없이 모든 요청을 fetch API로 구성함
// - FormData 및 JSON 방식 요청 모두 대응
// - JWT는 Authorization 헤더로 전달됨
// - 프론트에서 이미지 포함 multipart 전송 및 JSON 수정 요청을 분리 처리

import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ 백엔드 서버 주소 설정
const BASE_URL = 'http://ec2-15-164-231-5.ap-northeast-2.compute.amazonaws.com:8080';

/**
 * 1. OAuth2.0 로그인 요청
 * - OAuth 로그인 페이지로 리디렉션
 * - 백엔드가 redirect_uri를 기준으로 JWT 및 mode 포함한 딥링크 리디렉션
 *
 * @param {string} provider - 소셜 로그인 제공자 ('kakao', 'google' 등)
 */
export const redirectToOAuthWithFetch = async (provider) => {
  try {
    const redirectUri = Linking.createURL('/'); // 또는 '/callback' 등 명시적으로 써줘야 함
    const oauthUrl = `${BASE_URL}/oauth2/authorization/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log('🔗 OAuth 로그인 요청 URL:', oauthUrl);
    await Linking.openURL(oauthUrl);

  } catch (error) {
    console.error('❌ OAuth2.0 로그인 요청 실패:', error);
    throw error;
  }
};


// 2. 회원가입 요청 (FormData 전송 방식)
// ✅ fetch 기반 회원가입 API (multipart/form-data, key 분해 방식)
export const registerUserWithFetch = async (userData, image, token) => {
  try {
    console.log('🟡 [fetch] registerUser() 진입');
    console.log('📦 userInfo:', userData);
    console.log('🪪 token:', token);
    console.log('🖼 image:', image ? image.uri : '없음');

    const formData = new FormData();
    formData.append('userInfo', JSON.stringify(userData));

    if (image) {
      formData.append('profileImage', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.name || 'profile.jpg',
      });
    }

    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [fetch] 응답 오류 상태:', response.status);
      console.error('📦 응답 바디:', errorText);
      throw new Error(`회원가입 실패 (status ${response.status})`);
    }

    const result = await response.json();
    console.log('✅ [fetch] 회원가입 성공 응답:', result);
    return result;

  } catch (error) {
    console.error('❌ [fetch] 회원가입 실패:', error);
    throw error;
  }
};


/**
 * 3. 사용자 정보 조회 (홈화면, 프로필 화면 등에서 사용)
 * - JWT 토큰 기반으로 사용자 정보를 조회함
 * - 실패 시 400 응답은 null 반환
 *
 * @param {string} token - JWT 토큰
 * @returns {Object|null} 사용자 정보 객체 또는 null
 */
export const getUserInfoWithFetch = async (token) => {
  const response = await fetch(`${BASE_URL}/user/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 400) {
      console.warn('⚠️ 사용자 정보 없음 (400)');
      return null;
    }
    const errText = await response.text();
    console.error('❌ 사용자 정보 조회 실패:', response.status, errText);
    throw new Error(`조회 실패 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  console.log('✅ 사용자 정보 조회 성공:', data);
  return data;
};

/**
 * 4. 사용자 프로필 수정 요청 (JSON 형식)
 * - 프로필 정보 수정 및 이미지 URI 포함 가능
 * - Multipart가 아닌 JSON 요청이며, 이미지가 null이면 기본 이미지 유지
 *
 * @param {Object} userInfo - { nickname, gender, age, mbti }
 * @param {Object|null} image - 선택적 프로필 이미지 (URI만 전달됨)
 * @param {string} token - JWT 토큰
 * @returns {Object} 서버 응답 (수정된 사용자 정보)
 */
export const editUserProfileWithFetch = async (userInfo, image, token) => {
  const requestBody = {
    userInfo,
    profileImage: image, // null 또는 { uri: ... } 형식
  };

  const response = await fetch(`${BASE_URL}/user/edit`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('❌ 프로필 수정 실패:', response.status, errText);
    throw new Error(`수정 실패 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  console.log('✅ 프로필 수정 성공:', data);
  return data;
};
