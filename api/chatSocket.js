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
  console.log('🛰️ connectStompClient 실행됨', { roomId, token });

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
      Authorization: `Bearer ${token}`, // ⬅️ 전달받은 원본 토큰 사용
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
    },

    onWebSocketError: (err) => {
      console.error('❌ WebSocket 연결 오류 발생');
      console.error('🔧 상세 정보:', err.message || err);
    },

    onDisconnect: () => {
      console.log('🔌 STOMP 연결이 해제되었습니다');
    },
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