// api/auth.js
// 로그인, 회원가입, 사용자 정보 요청을 담당하는 API 유틸 파일
// React Native 전용 + Axios 기반 + 백엔드 기본 이미지 처리 반영(사용자 사진 미첨부시)

import axios from 'axios';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


// 백엔드 주소 설정 (배포 서버 주소 또는 EC2 주소로 교체 필요)
const BASE_URL = 'https://your-backend-url.com'; // ! 반드시 수정할 것

// 1. [OAuth 로그인 시작]
// 사용자가 카카오 또는 구글 로그인 버튼을 클릭했을 때 호출
// 백엔드에서 소셜 로그인 진행 후, JWT를 담아 앱으로 리디렉션됨
export const startOAuthLogin = async (provider) => {
const oauthUrl = `${BASE_URL}/oauth2/authorization/${provider}`;
  await Linking.openURL(oauthUrl); // React Native에선 Linking을 사용해 브라우저 오픈
};

// 2. [딥링크 URL에서 JWT 추출 및 저장]
// 백엔드에서 로그인 성공 시 JWT를 쿼리파라미터로 담아 리디렉션됨(Oauth 로그인 후 자동 앱으로 이동)
// 예: myapp://oauth/callback?token=eyJ...
export const saveJwtFromRedirect = async (url) => {
  try {
    const token = new URL(url).searchParams.get('token');
    if (token) {
      await AsyncStorage.setItem('jwtToken', token); // JWT 저장
      return token;
    }
  } catch (error) {
    console.error('JWT 추출 실패:', error);
  }
};

// 3. [회원가입 요청 (FormData 방식 유지)]
export const registerUser = async (userData, imageFile, token) => {
  const formData = new FormData();

  // 📦 JSON 데이터(userProfile)를 Blob 형태로 감싸서 FormData에 추가(blob 안쓰면 string처리됨)
  const jsonBlob = new Blob([JSON.stringify(userData)], {
    type: 'application/json',
  });
  formData.append('userProfile', jsonBlob);

  if (imageFile) {
    formData.append('profileImage', {
      uri: imageFile.uri,
      name: imageFile.fileName || 'profile.jpg',
      type: imageFile.type || 'image/jpeg',
    });
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/user/profile`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('회원가입 실패:', error);
    throw error;
  }
};

// 🔁 4. [회원정보 수정 요청 - JSON 기반 PUT 방식]
// 사용자가 입력한 정보(JSON)을 백엔드에 전달
// profileImage는 문자열 URL 또는 null 전달 가능
export const editUserProfile = async (userInfo, profileImage, token) => {
  try {
    const requestBody = {
      userInfo,               // 닉네임, 성별, 나이, MBTI 포함
      profileImage: profileImage || null, // 이미지 없으면 null 처리
    };
    
    const response = await axios.put(`${BASE_URL}/user/edit`, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
    

  } catch (error) {
    console.error('회원정보 수정 실패:', error);
    throw error;
  }
};

// 5. [사용자 정보 조회 - 경로 수정됨]
// JWT를 사용해 서버로부터 사용자 정보를 가져옴 (프로필 편집 시 사용)
export const getUserInfo = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      return null;
    }
    throw error;
  }
};
