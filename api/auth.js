// 📁 api/auth.js
// ✅ 로그인, 회원가입, 사용자 정보 요청을 담당하는 API 유틸 파일
// - React Native (Expo) 전용
// - Axios 기반
// - JWT 토큰 관리 + FormData 전송 방식 + 딥링크 처리 포함


import axios from 'axios';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isMockMode } from '../utils/MockMode'; // 테스트용 로그인, api 영향을 받지않는.
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경




// ✅ 백엔드 주소 설정 (배포 서버 또는 EC2 주소로 반드시 수정)
//const BASE_URL = 'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080';


// ---------------------------------------------------
// 1. [OAuth 로그인 시작]
// ---------------------------------------------------
export const redirectToOAuth = async (provider) => {
  try {
    const redirectUri = Linking.createURL('');
    const oauthUrl = `${BASE_URL}/oauth2/authorization/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log('🔗 OAuth 로그인 요청 URL:', oauthUrl);
    await Linking.openURL(oauthUrl);
  } catch (error) {
    console.error('[OAuth 시작 오류]', error);
  }
};


// ---------------------------------------------------
// 2. [딥링크 리디렉션 → JWT 저장]
// ---------------------------------------------------
export const saveJwtFromRedirect = async (url) => {
  try {
    const parsed = Linking.parse(url);
    const token = parsed.queryParams?.token;


    if (token) {
      await AsyncStorage.setItem('jwt', token);  // 정식 jwt 저장
      return token;
    } else {
      console.warn('❗ 토큰이 URL에 포함되지 않았습니다:', url);
      return null;
    }
  } catch (error) {
    console.error('[토큰 저장 오류]', error);
    return null;
  }
};


// ---------------------------------------------------
// 3. [회원가입 요청 - FormData 사용]
// ---------------------------------------------------
// registerUser() auth_fetch.js로 이전, 사용되지않음.
// */
export const registerUser = async (userData, image, token) => {
  try {
    console.log('🟡 [STEP 0] registerUser 진입');
    console.log('📦 전달받은 userData:', userData);
    console.log('🪪 전달받은 토큰:', token);
    console.log('🖼 이미지 유무:', image ? '있음' : '없음');


    const formData = new FormData();


    // 🔁 userInfo 추가
    const userInfoStr = JSON.stringify(userData);
    console.log('🧾 [STEP 1] userInfo JSON 문자열 생성:', userInfoStr);
    formData.append('userInfo', userInfoStr);
    console.log('✅ userInfo 필드 FormData에 추가 완료');


    // ✅ key 분해 방식으로 각 필드 개별 전송
    formData.append('nickname', userData.nickname);
    formData.append('gender', userData.gender);
    formData.append('age', userData.age.toString()); // 숫자는 문자열로 변환
    formData.append('mbti', userData.mbti);
    console.log('✅ 유저 정보 필드들 FormData에 개별 추가 완료');
 
    // // json을 한덩어리로 보낼때, 이미지 추가 (있을 때만)
    // if (image) {
    //   const imageFile = {
    //     uri: image.uri,
    //     type: image.type || 'image/jpeg',
    //     name: image.name || 'profile.jpg',
    //   };
    //   formData.append('profileImage', imageFile);
    //   console.log('✅ profileImage 필드 추가됨:', imageFile);
    // } else {
    //   console.log(' 이미지가 없어 profileImage 필드는 생략됨');
    // }


    // 🔁 Axios config 구성
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // Content-Type은 FormData 자동 처리
      },
    };


    console.log('🌐 [STEP 2] Axios 요청 준비 완료');
    console.log('🌐 요청 URL:', `${BASE_URL}/auth/signup`);
    console.log('📮 요청 헤더:', config.headers);
    console.log('🧾 FormData 목록:', formData._parts);  // Android에서 필드 확인용


    // 🔁 API 호출
    const response = await axios.post(`${BASE_URL}/auth/signup`, formData, config);


    console.log('✅ [STEP 3] 회원가입 요청 성공:', response.data);
    return response.data;


  } catch (error) {
    console.error('❌ [STEP 4] 회원가입 요청 실패');
    console.error('🧱 오류 메시지:', error.message);
    console.error('📍 요청 주소:', error.config?.url);
    console.error('📥 응답 상태:', error.response?.status);
    console.error('🧩 Axios 스택:', error.stack);


    throw error;
  }
};






// ---------------------------------------------------
// 4. [회원 정보 수정 요청 - JSON 방식]
// ---------------------------------------------------
// export const editUserProfile = async (userInfo, profileImage, token) => {


//   if (await isMockMode()) { // 테스트용 mock 전용 함수
//     console.log('🧪 [MockMode] editUserProfile 실행됨 - 서버 전송 생략');
//     const updatedUser = {
//       ...userInfo,
//       profileImageUrl: profileImage?.uri || null,
//     };
//     await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
//     return updatedUser;
//   }




//   try {
//     const requestBody = {
//       userInfo,                       // nickname, gender, age, mbti
//       profileImage: profileImage || null,
//     };


//     const response = await axios.put(`${BASE_URL}/user/edit`, requestBody, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         // 'Content-Type': 'application/json',
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error('❌ 회원정보 수정 실패:', error.response?.data || error.message);
//     throw error;
//   }
// };


// ---------------------------------------------------
// 5. [사용자 정보 조회 - JWT 기반] + 홈화면에서 프로필 사진 요청
// ---------------------------------------------------
export const getUserInfo = async (token) => {


  if (await isMockMode()) {  // 테스트용 mock 전용 함수.
    console.log('🧪 [MockMode] getUserInfo 실행됨 - 로컬 유저 반환');
    const localUser = await AsyncStorage.getItem('user');
    return JSON.parse(localUser);
  }


 
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
    console.error('❌ 사용자 정보 조회 오류:', error.response?.data || error.message);
    throw error;
  }
};


// 테스트용 로그인
// export const loginMockUser = async (setUser) => {
//   const mockUser = {
//     nickname: '테스터',
//     gender: 'MALE',
//     age: 26,
//     mbti: 'INTP',
//     profileImageUrl: 'https://via.placeholder.com/100',
//   };
//   await AsyncStorage.setItem('user', JSON.stringify(mockUser));
//   await AsyncStorage.removeItem('jwt'); // 임시 토큰 제거
//   setUser(mockUser);
// };

