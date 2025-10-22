// components/auth/UserInfoScreen.jsx
// NOTE: 기존 주석 유지 + 변경 지점에 ✨ 표시

import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet,
        TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, 
        Platform, Dimensions, PixelRatio, Image,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import { UserContext } from '../../contexts/UserContext';
import ProfileImagePicker from '../common/ProfileImagePicker';
import { registerUserWithFetch, getUserInfoWithFetch } from '../../api/auth_fetch';

// ==== 반응형 유틸 함수 (iPhone 13: 390 x 844) ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}
// ✨ 가독성을 위한 별칭
const wScale = (px) => normalize(px, 'width');
const hScale = (px) => normalize(px, 'height');

const Dropdown = Platform.OS === 'ios'
  ? require('../common/Dropdown').default
  : require('../auth/common/DropdownAndroid').default;

export default function UserInfoScreen() {
  const navigation = useNavigation();
  const { setUser } = useContext(UserContext);

  const [image, setImage] = useState(null);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(''); // '남성' | '여성' | ''
  const [mbti, setMbti] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const parsedAge = parseInt(age);
  const isValid = nickname.length > 0 && gender && !isNaN(parsedAge) && parsedAge >= 10 && parsedAge <= 99;

  // 프로필 이미지 삭제 버튼
  const handleDeleteProfileImage = () => {
    Alert.alert(
      '이미지 삭제',
      '이미지를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', onPress: () => setImage(null), style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  // 딥링크(신규 사용자 임시 토큰) 처리
  useEffect(() => {
    const handleInitialLink = async () => {
      const url = await Linking.getInitialURL();
      if (!url) return;
      const { queryParams } = Linking.parse(url);
      const mode = queryParams?.mode;
      const token = queryParams?.token;        // 회원가입(임시 JWT)
      const access = queryParams?.access;      // 로그인(access)
      const refresh = queryParams?.refresh;    // 로그인(refresh)
      if (mode === 'register' && token) {
        // 신규 회원 가입 플로우: 임시 JWT 저장
        await AsyncStorage.setItem('jwt', token);
        console.log('✅ 신규 사용자 임시 토큰 저장 완료');
      }
      if (mode === 'login' && access) {
        // 로그인 플로우: access/refresh 저장
        await AsyncStorage.setItem('jwt', access);
        if (refresh) await AsyncStorage.setItem('refreshToken', refresh);
        console.log('✅ 로그인 토큰 저장 완료 (access/refreshToken)');
      }
    };
    handleInitialLink();
  }, []);

  // 가입 시작하기 (회원가입 요청)
  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('jwt');
    const isMock = await AsyncStorage.getItem('mock');

    const userData = {
      nickname,
      gender: gender === '남성' ? 'MALE' : gender === '여성' ? 'FEMALE' : '',
      age: parseInt(age),
      mbti: mbti === '' ? null : mbti,
    };

    if (isMock === 'true') {
      const mockUser = {
        ...userData,
        profileImageUrl: image?.uri || null,
      };
      setUser(mockUser);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      navigation.replace('BottomTab');
      return;
    }

    try {
      const result = await registerUserWithFetch(userData, image, token);
      // [ADDED] 회원가입 성공 응답 처리(방어적): accessToken/refreshToken/token(단일) 모두 대응
      const { accessToken, refreshToken, token: singleToken } = result || {};
      const finalAccess = accessToken || singleToken || token;  // access 우선, 없으면 단일 token
      const finalRefresh = refreshToken || null;

      // [ADDED] 토큰 저장
      await AsyncStorage.setItem('jwt', finalAccess);
      if (finalRefresh) await AsyncStorage.setItem('refreshToken', finalRefresh);

      const newUser = await getUserInfoWithFetch(finalAccess);
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      Alert.alert('완료', '회원가입이 완료되었습니다.');
      navigation.replace('BottomTab');
    } catch (e) {
      let errorMessage = '회원가입에 실패했습니다.';
      try {
        const data = JSON.parse(e.message);
        if (data?.message === 'Nickname already exists') {
          errorMessage = '중복된 닉네임입니다.';
        }
      } catch {}
      Alert.alert('오류', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ✨ 새 헤더: 뒤로가기 + 타이틀 */}
        <View style={styles.headerLeftGroup}>
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack?.()}
              accessibilityLabel="뒤로가기"
            >
              <Ionicons name="chevron-back" size={normalize(24)} color="#111111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>회원가입</Text>
            {/* <View style={{ width: normalize(24) }} /> */}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {/* ✨ 프로필+리드문구 블록 */}
          <View style={styles.profileRow}>
            {/* 기존 ProfileImagePicker 재사용 */}
            <View style={{ marginTop: hScale(6) /* ✨ 프로필 사진만 아래로 내림 */ }}>
              <ProfileImagePicker defaultImage={image} onChange={setImage} size={normalize(72)} />
              {image && typeof image === 'object' && image.uri && (
                <TouchableOpacity onPress={handleDeleteProfileImage} style={styles.cameraBadge} accessibilityLabel="프로필 사진 삭제">
                  <MaterialIcons name="cancel" size={normalize(18)} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.leadText}>
              지금 가입하고{'\n'}새로운 경험을 하세요
            </Text>
          </View>

          {/* 폼 */}
          <View style={styles.formArea}>
            {/* 닉네임 카드 */}
            <View style={[styles.card, focusedField === 'nickname' && styles.cardFocused /* ✨ */]}>
              <View style={styles.cardLabelRow}>
                <Text style={styles.cardLabel}>닉네임 <Text style={styles.asterisk}>*</Text></Text>
              </View>
              <View style={styles.cardFieldRow}>
                <TextInput
                  style={styles.cardInput}
                  placeholder="닉네임을 입력해 주세요"
                  placeholderTextColor="#999999"
                  value={nickname}
                  onChangeText={(t) => t.length <= 12 && setNickname(t)}
                  onFocus={() => setFocusedField('nickname') /* ✨ */}
                  onBlur={() => setFocusedField(null) /* ✨ */}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* 성별 토글 */}
            <View style={styles.genderGroup}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === '남성' && styles.genderBtnSelected]}
                onPress={() => setGender(gender === '남성' ? '' : '남성')}
                activeOpacity={0.8}
              >
                <Text style={[styles.genderTxt, gender === '남성' && styles.genderTxtSelected]}>남성</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === '여성' && styles.genderBtnSelected]}
                onPress={() => setGender(gender === '여성' ? '' : '여성')}
                activeOpacity={0.8}
              >
                <Text style={[styles.genderTxt, gender === '여성' && styles.genderTxtSelected]}>여성</Text>
              </TouchableOpacity>
            </View>

            {/* 나이 카드 */}
            <View style={[styles.card, focusedField === 'age' && styles.cardFocused /* ✨ */]}>
              <View style={styles.cardLabelRow}>
                <Text style={styles.cardLabel}>나이 <Text style={styles.asterisk}>*</Text></Text>
              </View>
              <View style={styles.cardFieldRow}>
                <TextInput
                  style={styles.cardInput}
                  placeholder="나이를 입력해 주세요"
                  placeholderTextColor="#999999"
                  keyboardType="numeric"
                  value={age.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text);
                    if (!isNaN(num) && num >= 0 && num <= 99) setAge(num);
                    else if (text === '') setAge('');
                  }}
                  onFocus={() => setFocusedField('age') /* ✨ */}
                  onBlur={() => setFocusedField(null) /* ✨ */}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* MBTI 카드 */}
            <View style={styles.card}>
              <View style={styles.cardLabelRow}>
                <Text style={styles.cardLabel}>MBTI</Text>
              </View>
              <View style={[styles.cardFieldRow, styles.mbtiRow]}>
                <View style={{ flex: 1 }}>
                  <Dropdown
                    selectedValue={mbti}
                    onValueChange={setMbti}
                    items={[
                      { label: '선택안함', value: '' },
                      'INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
                      'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP',
                    ].map((v) => (typeof v === 'string' ? { label: v, value: v } : v))}
                  />
                </View>
                {/* 수정된 부분: iOS가 아닐 때만 아이콘 표시 */}
                {Platform.OS !== 'ios' && (
                  <Ionicons name="chevron-down" size={normalize(20)} color="#999999" />
                )}
              </View>
            </View>
          </View>

          {/* 하단 CTA */}
          <View style={{ height: hScale(12) }} />
          <TouchableOpacity
            style={[styles.cta, !isValid && styles.ctaDisabled]}
            onPress={handleSubmit}
            disabled={!isValid}
          >
            <Text style={styles.ctaText}>시작하기</Text>
          </TouchableOpacity>
          <View style={{ height: hScale(20) }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ======= 스타일 =======
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ✨ Header (56)
  headerBar: {
    height: hScale(56),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wScale(20),
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: normalize(24),
    height: normalize(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wScale(8),
  },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: '500',
    color: '#111111',
    letterSpacing: -0.3,
  },

  scrollContent: {
    paddingBottom: hScale(24),
  },

  // ✨ Profile block
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wScale(24),
    paddingHorizontal: wScale(32),
    //height: hScale(72),
    marginTop: hScale(12),
    marginBottom: hScale(8),
  },
  cameraBadge: {
    position: 'absolute',
    right: -wScale(2),
    bottom: hScale(24),
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(24),
    backgroundColor: '#F1F1F5',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadText: {
    //maxWidth: wScale(193),
    flexShrink: 1,
    maxWidth: '80%',
    fontSize: normalize(24),
    fontWeight: '500',
    color: '#111111',
    lineHeight: hScale(34),
    letterSpacing: -0.3,
    marginTop: hScale(15),
  },

  // ✨ Form area
  formArea: {
    paddingHorizontal: wScale(32),
    rowGap: hScale(16),
  },

  // 카드 공통 311 x 78
  card: {
    borderWidth: 1,
    borderColor: '#E5E5EC',
    borderRadius: normalize(12),
    overflow: 'hidden',
  },
  cardFocused: {
    borderColor: '#111111',
  },
  cardLabelRow: {
    paddingTop: hScale(16),
    paddingHorizontal: wScale(16),
  },
  cardLabel: {
    fontSize: normalize(13),
    color: '#767676',
    letterSpacing: -0.3,
  },
  asterisk: {
    color: '#EF4444',
    fontWeight: '700',
  },
  cardFieldRow: {
    paddingTop: hScale(8),
    paddingBottom: hScale(14),
    paddingHorizontal: wScale(16),
  },
  cardInput: {
    fontSize: normalize(16),
    color: '#111111',
    paddingVertical: hScale(8),
  },

  // ✨ 성별 토글
  genderGroup: {
    backgroundColor: '#F7F7FB',
    borderRadius: normalize(12),
    padding: wScale(4),
    flexDirection: 'row',
    gap: wScale(1),
    height: hScale(58),
  },
  genderBtn: {
    flex: 1,
    height: hScale(50),
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 1, height: 1 },
    elevation: 1,
  },
  genderTxt: {
    fontSize: normalize(16),
    color: '#767676',
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  genderTxtSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },

  // ✨ MBTI row (아이콘 보조)
  mbtiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: wScale(8),
  },

  // CTA
  cta: {
    marginTop: hScale(8),
    marginHorizontal: wScale(18),
    height: hScale(56),
    borderRadius: normalize(12),
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#BFC3CF',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: normalize(20),
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
