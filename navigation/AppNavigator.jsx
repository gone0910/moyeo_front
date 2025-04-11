import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../components/auth/LoginScreen';
import UserInfoScreen from '../components/auth/UserInfoScreen';
import EditProfileScreen from '../components/profile/EditProfileScreen';
import HomeScreen from '../components/home/HomeScreen'; //홈화면_



const Stack = createNativeStackNavigator();

/**
 * 앱 전체의 기본 네비게이션 구조
 * @param {boolean} isLoggedIn - 로그인 여부 (App.jsx에서 전달)
 */
export default function AppNavigator({ isLoggedIn }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? 'Home' : 'Login'}>
        {/* 로그인 흐름 */}
        {!isLoggedIn && (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="UserInfo" component={UserInfoScreen} options={{ title: '정보 입력' }} />
          </>
        )}

        {/* 공통 접근 가능 화면 (로그인 이후) */}
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: '프로필 편집' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
