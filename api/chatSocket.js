/**
 * chatSocket.js - SDK 54 대응 (SDK 53 방식 기반)
 * 
 * [변경사항]
 * 1. Polyfill 최소화 (Buffer, EventEmitter만)
 * 2. forceBinaryWSFrames/appendMissingNULLonIncoming 조건부 적용
 * 3. reconnectDelay: 0 유지
 * 4. heartbeat: 0,0 명시
 */

// ===== Polyfill (SDK54 필수) =====
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { EventEmitter } from 'events';
global.EventEmitter = EventEmitter;

// TextEncoder/Decoder는 조건부 적용
if (!global.TextEncoder) {
  const TextEncodingPolyfill = require('text-encoding');
  Object.assign(global, {
    TextEncoder: TextEncodingPolyfill.TextEncoder,
    TextDecoder: TextEncodingPolyfill.TextDecoder,
  });
  console.log('✅ [Polyfill] TextEncoder/Decoder 등록');
}

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL } from './config/api_Config';

let stompClient = null;

/**
 * STOMP WebSocket 연결
 */
export const connectStompClient = (roomId, onMessage, token, onConnected, onReadNotice) => {
  console.log('🛰️ [connectStompClient] 연결 시작', { roomId, token: token?.slice(0, 20) });

  if (!token) {
    console.error('❌ [STOMP] JWT 토큰 없음');
    return;
  }

  try {
    stompClient = new Client({
      // ===== WebSocket Factory =====
      webSocketFactory: () => {
        console.log('🌐 [SockJS] 인스턴스 생성');
        const sock = new SockJS(`${BASE_URL}/connect`);
        
        // SockJS 이벤트 리스너 (디버깅용)
        sock.addEventListener('open', () => {
          console.log('🌐🌐🌐 [SockJS] 연결 열림');
        });
        
        sock.addEventListener('close', (e) => {
          console.warn('🔌 [SockJS] 연결 닫힘:', e.code, e.reason);
        });
        
        sock.addEventListener('error', (e) => {
          console.error('❌ [SockJS] 에러:', e);
        });
        
        return sock;
      },

      // ===== SDK54 옵션 (조건부 적용) =====
      // forceBinaryWSFrames: true,  // ❌ 백엔드 호환성 문제 가능
      // appendMissingNULLonIncoming: true,  // ❌ 백엔드가 이미 NULL 보낼 수 있음

      // ===== Heartbeat 명시적 비활성화 =====
      // heartbeatIncoming: 0,
      // heartbeatOutgoing: 0,

      // ===== 자동 재연결 방지 =====
      reconnectDelay: 0,

      // ===== 연결 헤더 =====
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Debug-Token': token ? 'YES' : 'NO',
      },

      // ===== 디버그 로그 =====
      debug: (str) => {
        console.log('[STOMP DEBUG]', str);
        
        if (str.includes('<<< CONNECTED')) {
          console.log('🎉🎉🎉 [STOMP] CONNECTED 프레임 수신');
        }
        if (str.includes('>>> CONNECT')) {
          console.log('📤 [STOMP] CONNECT 프레임 전송');
        }
      },

      // ===== 연결 성공 =====
      onConnect: (frame) => {
        console.log('✅ [STOMP] 연결 성공!');
        
        // 메시지 수신 구독
        stompClient.subscribe(`/queue/${roomId}`, (message) => {

          // 💡 [수정] JSON 파싱 전에 원본 문자열을 먼저 로그로 찍어봅니다.
          console.log('📩 [메시지 수신 - 원본 BODY]', message.body); 

          try {
            const body = JSON.parse(message.body);
            console.log('📩 [메시지 수신 - 파싱 성공]', body);

            if (!body.message|| !body.sender|| !body.timestamp) {
              console.warn('⚠️ [메시지] 필드 누락:', body);
            }

            if (onMessage) onMessage(body);
          } catch (e) {
            console.error('❌ [메시지 파싱 실패]', e, message.body);
          }
        });

        // 읽음 알림 구독
        if (onReadNotice) {
          stompClient.subscribe(`/queue/${roomId}/read`, (message) => {
            try {
              const notice = JSON.parse(message.body);
              console.log('📥 [읽음 알림 수신]', notice);
              onReadNotice(notice);
            } catch (e) {
              console.error('❌ [읽음 알림 파싱 실패]', e);
            }
          });
        }

        console.log('✅ [STOMP] 구독 완료');

        if (onConnected) {
          console.log('🔔 [STOMP] onConnected 콜백 실행');
          onConnected();
        }
      },

      // ===== STOMP 에러 =====
      onStompError: (frame) => {
        console.error('❌ [STOMP ERROR]', {
          message: frame.headers['message'],
          body: frame.body,
        });
      },

      // ===== WebSocket 에러 =====
      onWebSocketError: (err) => {
        console.error('❌ [WebSocket ERROR]', {
          url: `${BASE_URL}/connect`,
          error: err?.message || err,
        });
      },

      // ===== WebSocket 종료 (중요!) =====
      onWebSocketClose: (event) => {
        console.warn('🔌 [WebSocket CLOSE]', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        
        // code 1006 = 비정상 종료
        if (event.code === 1006) {
          console.error('🚨 [비정상 종료] 서버 연결이 예기치 않게 끊어짐');
        }
      },

      // ===== STOMP 연결 해제 =====
      onDisconnect: (frame) => {
        console.log('📴 [STOMP] onDisconnect', {
          command: frame?.command,
          headers: frame?.headers,
        });
      },
    });

    console.log('🚀 [STOMP] activate() 호출');
    stompClient.activate();
    console.log('✅ [STOMP] activate() 완료');

  } catch (error) {
    console.error('❌ [STOMP] 초기화 실패:', error);
  }
};

/**
 * STOMP 연결 해제
 */
export const disconnectStompClient = (token) => {
  console.log('📴 [disconnectStompClient] 호출', {
    connected: stompClient?.connected,
  });

  if (stompClient && stompClient.connected) {
    console.log('📴 [STOMP] deactivate() 실행');
    
    stompClient.deactivate({
      disconnectHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('✅ [STOMP] 연결 해제 완료');
  } else {
    console.warn('🚫 [STOMP] 연결 없음 - 해제 스킵');
  }
};

/**
 * 메시지 전송
 */
export const sendMessage = (roomId, payload) => {
  console.log('📤 [sendMessage] 시도', {
    connected: stompClient?.connected,
    roomId,
    payload,
  });

  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: `/publish/${roomId}`,
      body: JSON.stringify(payload),
    });
    console.log('✅ [sendMessage] 전송 완료');
  } else {
    console.error('❌ [sendMessage] STOMP 연결 안 됨');
  }
};
