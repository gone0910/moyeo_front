// 📁 api/chatSocket.js
// ✅ STOMP 기반 WebSocket 연결 및 채팅 메시지 송수신 관리

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null; // ✅ 전역 STOMP 클라이언트 인스턴스

/**
 * STOMP WebSocket 연결 및 메시지 수신 구독
 *
 * @param {string} roomId - 채팅방 ID
 * @param {function} onMessage - 메시지 수신 시 콜백
 * @param {string} token - JWT 토큰
 * @param {function} onConnected - 연결 성공 시 콜백
 */
export const connectStompClient = (roomId, onMessage, token, onConnected) => {
  console.log('🛰️ connectStompClient 실행됨', { roomId, token });

  if (!token) {
    console.error('❌ [STOMP 연결 실패] JWT 토큰이 없습니다.');
    return;
  }

  stompClient = new Client({
    webSocketFactory: () => {
      console.log('🌐 SockJS 인스턴스 생성');
      return new SockJS('http://ec2-54-180-25-3.ap-northeast-2.compute.amazonaws.com:8080/ws'); // 반드시 /ws 붙어야 함
    },
    connectHeaders: {
      Authorization: `Bearer ${token}`,  // STOMP handshake에 jwt 토큰  포함.
    },
    reconnectDelay: 0, // ❗ 자동 재연결 끔 (반복 연결 방지)
    // STOMP 연결 성공시 
    onConnect: () => {
      console.log('✅ STOMP 연결 성공 → 채팅방 구독 시작');

      stompClient.subscribe(`/queue/${roomId}`, (message) => {
        const body = JSON.parse(message.body);

        if (!body.message || !body.senderName || !body.createdAt) {
          console.warn('❗ 메시지 필드 누락 또는 잘못된 형식:', body);
          return;
        }

        console.log('📩 수신된 메시지:', body);
        onMessage(body);
      });

      if (onConnected) {
        console.log('🔔 STOMP 연결 콜백 실행');
        onConnected();
      }
    }, // STOMP 연결 디버그용 강화
    onStompError: (frame) => {
      console.error('❌ STOMP 프로토콜 오류 발생');
      console.error('📩 message:', frame.headers['message']);
      console.error('📜 상세:', frame.body);
    },
    onWebSocketError: (err) => {
      console.error('❌ WebSocket 연결 오류 발생');
      console.error('🔧 상세 정보:', err);
    },
    onDisconnect: () => {
      console.log('🔌 STOMP 연결이 해제되었습니다');
    }
  });

  stompClient.activate();
};

/**
 * STOMP 연결 해제
 */
export const disconnectStompClient = () => {
  if (stompClient) {
    stompClient.deactivate();
    console.log('🔌 STOMP 연결 해제됨');
  }
};

/**
 * 메시지 전송
 *
 * @param {string} roomId - 채팅방 ID
 * @param {object} payload - 전송할 메시지 객체
 */
export const sendMessage = (roomId, payload) => {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: `/publish/${roomId}`,
      body: JSON.stringify(payload),
    });
  } else {
    console.warn('⚠️ STOMP가 연결되지 않아 메시지 전송 실패');
  }
};
