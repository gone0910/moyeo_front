import { createContext, useState } from 'react';

// AsyncStorage 설치 npx expo install @react-native-async-storage/async-storage

// 백엔드 연동 대비 프로필 등 데이터를 상태관리
// 사용자 정보를 앱 전역에서 공유할 수 있도록 만드는 Context
export const UserContext = createContext();

// 앱 전체를 감싸는 Provider 컴포넌트 내부에서는 user와 setUser를 자유롭게 사용가능(로그인,프로필 표시 등)
export function UserProvider({ children }) {
  // user 상태 전역으로 관리 (초기값은 null)
  const [user, setUser] = useState(null);

  return (
    // 하위 컴포넌트에 user, setUser 값을 전달
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
