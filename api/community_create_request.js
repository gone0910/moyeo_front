import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경
import * as TokenManager from './TokenManager';
import { reissueToken } from './AuthApi'; // 사진 전송을 위해 fetch를 보존하고 내에서 토큰 재발급 구현

/**
 * fetch를 실행하는 내부 헬퍼 함수
 * @param {string} token - 사용할 Access Token
 * @param {object} postData - { title, content, city, province, imageUris }
 * @returns {Promise<object>} - 성공 시 JSON 응답
 * @throws {Error} - 실패 시 status 속성이 포함된 에러
 */
async function doFetchCreatePost(token, { title, content, city, province, imageUris }) {
  const url = `${BASE_URL}/community/post/create`;
  
  const formData = new FormData();

  // 1. postInfo JSON 생성 (기존 방식 유지)
  const postInfo = { title, content, city, province };
  const jsonString = JSON.stringify(postInfo);
  const base64Encoded = btoa(unescape(encodeURIComponent(jsonString)));
  formData.append('postInfo', {
    uri: `data:application/json;base64,${base64Encoded}`,
    type: 'application/json',
    name: 'postInfo.json',
  });

  // 2. 이미지 파일 첨부 (기존 방식 유지)
  if (imageUris?.length) {
    imageUris.forEach((uri) => {
      const fileName = uri.split('/').pop();
      let ext = fileName.split('.').pop().toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === 'png') mimeType = 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';

      formData.append('postImages', {
        uri,
        name: fileName,
        type: mimeType,
      });
    });
  }

  // 3. fetch 실행
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // 'Content-Type' 생략
    },
    body: formData,
  });

  // 4. 응답 처리
  const resText = await response.text();
  if (!response.ok) {
    // 401을 감지할 수 있도록 status를 포함한 에러를 생성
    const error = new Error(resText);
    error.status = response.status;
    console.warn(`[doFetch] API 실패: ${error.status}`, resText);
    throw error;
  }

  try {
    return JSON.parse(resText);
  } catch {
    return resText;
  }
}


/**
 * 게시글 생성 (401 재발급 로직 포함)
 */
export async function createCommunityPost(data) {
  // 1. 현재 Access Token 가져오기
  const token = await TokenManager.getAccessToken();
  if (!token) {
    console.warn('❌ 토큰 없음 — 로그인 후 다시 시도하세요.');
    throw new Error('UNAUTHORIZED');
  }

  try {
    // 2. 1차 시도 (현재 토큰)
    console.log('[createPost] 1차 시도');
    return await doFetchCreatePost(token, data);

  } catch (err) {
    // 3. 401 오류(토큰 만료)인지 확인
    if (err.status === 401) {
      console.warn('[createPost] 401 감지. 토큰 재발급 시도...');
      try {
        // 4. Refresh Token 가져오기
        const rt = await TokenManager.getRefreshToken();
        if (!rt) throw new Error('Refresh Token이 없습니다.');

        // 5. 재발급 API 호출
        const { accessToken: newAT, refreshToken: newRT } = await reissueToken(rt);

        // 6. 새 토큰 저장
        await TokenManager.setTokens(newAT, newRT);

        // 7. 2차 시도 (새 토큰)
        console.log('[createPost] 2차 시도 (새 토큰)');
        return await doFetchCreatePost(newAT, data);
        
      } catch (reissueErr) {
        // 8. 재발급 실패 (Refresh Token 만료 등)
        console.error('[createPost] 재발급 실패:', reissueErr.message);
        await TokenManager.clearTokens();
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
      }
    }
    // 9. 401이 아닌 다른 오류 (500, 404 등)
    console.error('[createPost] 401이 아닌 오류:', err.message);
    throw err;
  }
}