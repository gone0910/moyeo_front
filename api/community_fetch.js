// api/community_fetch.js
// import * as FileSystem from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경
import * as TokenManager from './TokenManager';
import { reissueToken } from './AuthApi'; // 사진 전송을 위해 fetch를 보존하고 내에서 토큰 재발급 구현


// const BASE_URL = 'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080'; // 실제 서버 주소로 교체

// 1. 게시글 생성 (POST /community/post/create)
// (이미지 첨부)
// export async function createPostWithImages({ postInfo, postImages }, token) {
//   const formData = new FormData();

//   // JSON 데이터 인코딩 후 파일처럼 첨부
//   const jsonString = JSON.stringify(postInfo);
//   const base64Encoded = btoa(unescape(encodeURIComponent(jsonString)));
//   formData.append('postInfo', {
//     uri: `data:application/json;base64,${base64Encoded}`,
//     type: 'application/json',
//     name: 'postInfo.json',
//   });

//   // 이미지 파일 첨부 (여러장 가능)
//   if (Array.isArray(postImages)) {
//     postImages.forEach((img, idx) => {
//       formData.append('postImages', {
//         uri: img.uri,
//         type: img.type ?? 'image/jpeg',
//         name: img.name ?? `photo${idx}.jpg`,
//       });
//     });
//   }

//   // 디버깅: FormData 구조 확인
//   for (let [key, value] of formData.entries()) {
//     console.log(`${key}:`, value);
//   }

//   const response = await fetch(`${BASE_URL}/community/post/create`, {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${token}`,
//       // 'Content-Type'을 절대 명시하지 않는다!
//     },
//     body: formData,
//   });

//   if (!response.ok) {
//     const errText = await response.text();
//     throw new Error(`게시글 생성 실패: ${response.status} - ${errText}`);
//   }
//   return response.json();
// }

// 2. 게시글 수정 (PUT /community/post/edit/{postId})
// 추가 수정 필요. 만약 기존에 받아온 사진을 편집하지 않고 보내면 사진 파일이 아닌 url로 보내져 기존 사진을 안보내질 수 있음.
// export async function editPostWithImages(postId, { postInfo, postImages }, token) {
//   const formData = new FormData();

//   // Base64 인코딩 후 파일처럼 첨부 (생성과 동일)
//   const jsonString = JSON.stringify(postInfo);
//   const base64Encoded = btoa(unescape(encodeURIComponent(jsonString)));
//   formData.append('postInfo', {
//     uri: `data:application/json;base64,${base64Encoded}`,
//     type: 'application/json',
//     name: 'postInfo.json',
//   });

//   if (Array.isArray(postImages)) {
//     postImages.forEach((img, idx) => {
//       formData.append('postImages', {
//         uri: img.uri,
//         type: img.type ?? 'image/jpeg',
//         name: img.name ?? `photo${idx}.jpg`,
//       });
//     });
//   }

//   const response = await fetch(`${BASE_URL}/community/post/edit/${postId}`, {
//     method: 'PUT',
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//     body: formData,
//   });

//   if (!response.ok) {
//     const errText = await response.text();
//     throw new Error(`게시글 수정 실패: ${response.status} - ${errText}`);
//   }
//   return response.json();
// }

// 게시글 수정.
// 이미지 URL → base64 파일 객체 변환
// 기존 이미지 URL → base64 파일 객체 변환
async function urlToBase64File(url, idx = 0) {
  const filename = `origin_${idx}.jpg`;
  const filePath = FileSystem.cacheDirectory + filename;
  await FileSystem.downloadAsync(url, filePath);

  const base64 = await FileSystem.readAsStringAsync(filePath, { encoding: 'base64' });
  return {
    uri: `data:image/jpeg;base64,${base64}`,
    name: filename,
    type: 'image/jpeg',
  };
}

// 새로 추가된 파일 → base64 파일 객체 변환
async function localImageToBase64File(image, idx = 0) {
  if (!image?.uri) return null;
  const base64 = await FileSystem.readAsStringAsync(image.uri, { encoding: 'base64' });
  return {
    uri: `data:image/jpeg;base64,${base64}`,
    name: image.name || `photo${idx}.jpg`,
    type: image.type || 'image/jpeg',
  };
}

/**
 * [내부 함수] 실제 fetch 로직 수행 (token을 인자로 받음)
 */
async function _doFetchEditPost(postId, { postInfo, newImages, oldImageUrls }, token) {
  const formData = new FormData();

  // 1. postInfo JSON → base64 (기존 로직 동일)
  const jsonString = JSON.stringify(postInfo);
  const jsonBase64 = btoa(unescape(encodeURIComponent(jsonString)));
  formData.append('postInfo', {
    uri: `data:application/json;base64,${jsonBase64}`,
    type: 'application/json',
    name: 'postInfo.json',
  });

  // 2. 기존 이미지 URL → base64 (기존 로직 동일)
  if (Array.isArray(oldImageUrls)) {
    for (let i = 0; i < oldImageUrls.length; i++) {
      const file = await urlToBase64File(oldImageUrls[i], i);
      if (file) formData.append('postImages', file);
    }
  }

  // 3. 새 이미지 파일 → base64 (기존 로직 동일)
  if (Array.isArray(newImages)) {
    for (let i = 0; i < newImages.length; i++) {
      const file = await localImageToBase64File(newImages[i], i);
      if (file) formData.append('postImages', file);
    }
  }

  // 4. FormData 로그 (디버깅용)
  for (let pair of formData.entries()) { /* (로그 로직 생략) */ }

  // 5. API 요청 보내기
  const response = await fetch(`${BASE_URL}/community/post/edit/${postId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    const error = new Error(`게시글 수정 실패: ${errText}`);
    error.status = response.status; // ⬅️ 401 감지를 위해 status 추가
    throw error;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    return response.json();
  } else {
    return; // 성공 처리
  }
}

/**
 * [export] 게시글 수정 (401 재발급 로직 포함)
 * (token 인자 제거됨)
 */
export async function editPostWithImages(postId, data) {
  // 1. 현재 Access Token 가져오기
  const token = await TokenManager.getAccessToken();
  if (!token) {
    console.warn('❌ 토큰 없음 — 로그인 후 다시 시도하세요.');
    throw new Error('UNAUTHORIZED');
  }

  try {
    // 2. 1차 시도 (현재 토큰)
    console.log('[editPost] 1차 시도');
    return await _doFetchEditPost(postId, data, token);

  } catch (err) {
    // 3. 401 오류(토큰 만료)인지 확인
    if (err.status === 401) {
      console.warn('[editPost] 401 감지. 토큰 재발급 시도...');
      try {
        // 4. Refresh Token 가져오기
        const rt = await TokenManager.getRefreshToken();
        if (!rt) throw new Error('Refresh Token이 없습니다.');

        // 5. 재발급 API 호출
        const { accessToken: newAT, refreshToken: newRT } = await reissueToken(rt);

        // 6. 새 토큰 저장
        await TokenManager.setTokens(newAT, newRT);

        // 7. 2차 시도 (새 토큰)
        console.log('[editPost] 2차 시도 (새 토큰)');
        return await _doFetchEditPost(postId, data, newAT);
        
      } catch (reissueErr) {
        // 8. 재발급 실패 (Refresh Token 만료 등)
        console.error('[editPost] 재발급 실패:', reissueErr.message);
        await TokenManager.clearTokens();
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
      }
    }
    // 9. 401이 아닌 다른 오류 (500, 404 등)
    console.error('[editPost] 401이 아닌 오류:', err.message);
    throw err;
  }
}