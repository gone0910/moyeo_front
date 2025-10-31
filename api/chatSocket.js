// 📁 api/chatSocket.js
// ✅ React Native 환경 대응 STOMP WebSocket 연결 모듈

// ⬇️ [수정] Polyfill (Buffer, text-encoding) 제거
// import { Buffer } from 'buffer';
// global.Buffer = Buffer;

// import { EventEmitter } from 'events';
// global.EventEmitter = EventEmitter;

// ⬇️ [수정] TextEncoder/Decoder polyfill 등록 제거
// import * as encoding from 'text-encoding';
// Object.assign(global, {
//   TextEncoder: encoding.TextEncoder,
//   TextDecoder: encoding.TextDecoder,
// });

// ✅ STOMP + SockJS
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경

// ✅ 전역 STOMP 클라이언트
let stompClient = null;

/**
 * STOMP WebSocket 연결
 * @param {string} roomId - 채팅방 ID
 * @param {function} onMessage - 메시지 수신 콜백
 * @param {string} token - JWT 토큰
 * @param {function} onConnected - 연결 완료 콜백
 * @param {function} onReadNotice - 읽음 알림 수신 콜백 (선택적)
 */
export const connectStompClient = (roomId, onMessage, token, onConnected, onReadNotice) => {
  // ⬇️ [수정] Polyfill이 제거되었으므로 "토큰 수리" 로직이 필요 없음.
  console.log('🛰️ connectStompClient 실행됨', { roomId, onMessage, token, onConnected, onReadNotice });

  if (!token) {
    console.error('❌ [STOMP 연결 실패] JWT 토큰이 없습니다.');
    return;
  }

  stompClient = new Client({
    // ✅ RN에서 직접 SockJS 인스턴스를 반환
    webSocketFactory: () => {
      console.log('🌐 SockJS 인스턴스 생성');
      return new SockJS(`${BASE_URL}/connect`);
    },

    connectHeaders: {
      Authorization: `Bearer ${token}`, // 전달받은 원본 토큰 사용
      // 📌 [추가 로그] 토큰이 헤더에 포함되었는지 확인
      'X-Debug-Token-Exists': token ? 'YES' : 'NO',
    },

    reconnectDelay: 0, // ❗ 자동 재연결 방지

    debug: (str) => {
      console.log('[STOMP DEBUG]', str); // 연결 상태 디버깅용
    },

    onConnect: () => {
      console.log('✅ STOMP 연결 성공 → 채팅방 구독 시작');

      // ✅ 메시지 수신 구독
      stompClient.subscribe(`/queue/${roomId}`, (message) => {
        const body = JSON.parse(message.body);
        if (!body.message || !body.sender || !body.timestamp) {
          console.warn('❗ 메시지 필드 누락 또는 잘못된 형식:', body);
          return;
        }
        console.log('📩 수신된 메시지:', body);
        onMessage(body);
      }); 
      // { Authorization: `Bearer ${token}` });토큰 제거

      // ✅ 📌 읽음 알림 수신 구독 추가
      if (onReadNotice) {
        stompClient.subscribe(`/queue/${roomId}/read`, (message) => {
          const notice = JSON.parse(message.body);
          console.log('📥 읽음 알림 수신:', notice);
          onReadNotice(notice);
        },); //{ Authorization: `Bearer ${token}` });
      }

      if (onConnected) {
        console.log('🔔 STOMP 연결 콜백 실행');
        onConnected();
      }
    },

    onStompError: (frame) => {
      console.error('❌ STOMP 프로토콜 오류 발생');
      console.error('📩 message:', frame.headers['message']);
      console.error('📜 상세:', frame.body);
      console.error('🔑 토큰 확인:', token.substring(0, 20) + '...');
    },

    onWebSocketError: (err) => {
      console.error('❌ WebSocket 연결 오류 발생');
      console.error('🌐 연결 URL:', `${BASE_URL}/connect`);
      console.error('🔧 상세 정보:', err.message || err);
    },

    // 💡 [최종 추가 로그] WebSocket/SockJS 종료 시 상세 정보 기록
    onWebSocketClose: (event) => {
      console.error('🛑 [WebSocket Close] SockJS/WS 연결이 예기치 않게 종료됨!');
      console.error('🔥 종료 코드:', event.code); // 1006 (비정상), 1000 (정상 또는 서버 인증 실패) 등
      console.error('🔥 종료 이유:', event.reason);
    },

    // 💡 [수정] onDisconnect 콜백에 프레임 객체를 받아 상세 정보 로그 추가
    onDisconnect: (frame) => {
      console.log('🔌 STOMP 연결이 해제되었습니다');
      // frame 객체는 STOMP DISCONNECT 명령에 대한 응답 프레임입니다.
      // 연결이 예기치 않게 종료된 경우에도 이 콜백이 호출되지만,
      // 서버가 보낸 정보가 frame.body나 frame.headers에 담겨있을 수 있습니다.
      
      console.warn('⚠️ [STOMP Disconnect] 상세 정보:', {
        command: frame?.command,
        headers: frame?.headers,
        body: frame?.body,
      });

      if (!frame || frame.command !== 'DISCONNECT') {
        console.error('❗ [심각 경고] 서버에 의한 예상치 못한 연결 종료 의심!');
      }
    },
  });
  
  // 📌 [추가 로그] activate 직전에 최종 정보 확인
  console.log('🚀 STOMP Client 활성화 시도', { 
    SockJS_URL: `${BASE_URL}/connect`, 
    Connect_Headers: stompClient.connectHeaders,
  });
  stompClient.activate(); // ✅ 연결 시작
};

/**
 * STOMP 연결 해제
 */
export const disconnectStompClient = (token) => {
  if (stompClient && stompClient.connected) {
    stompClient.deactivate({
      disconnectHeaders: {
        Authorization: `Bearer ${token}`, // ✅ 명세서에 따라 disconnect에도 포함
      },
    });
    console.log('🔌 STOMP 연결 해제됨 (JWT 포함)');
  } else {
    console.warn('🚫 연결된 STOMP 세션이 없어 disconnect 생략됨');
  }
};


/**
 * 채팅 메시지 전송
 * @param {string} roomId
 * @param {object} payload - { senderId, senderName, message, createdAt, ... }
 */
export const sendMessage = (roomId, payload) => {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: `/publish/${roomId}`,
      body: JSON.stringify(payload),
    });
    console.log('📤 메시지 전송됨:', payload);
  } else {
    console.warn('⚠️ STOMP가 연결되지 않아 메시지 전송 실패');
  }
};