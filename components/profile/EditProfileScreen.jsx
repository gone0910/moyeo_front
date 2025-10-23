import React, { useState, useContext, useEffect } from 'react';
import {  View, Text, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView,
 Platform, TouchableOpacity, Dimensions, PixelRatio,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import ProfileImagePicker from '../common/ProfileImagePicker';
import { editUserProfileWithFetch, getUserInfoWithFetch, urlToBase64ProfileImage } from '../../api/auth_fetch';

// ==== 반응형 유틸 함수 (UserInfoScreen 스타일) ====
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
const wScale = (px) => normalize(px, 'width');
const hScale = (px) => normalize(px, 'height');

// OS에 따른 Dropdown 컴포넌트 임포트
const Dropdown = Platform.OS === 'ios'
  ? require('../common/Dropdown').default
  : require('../auth/common/DropdownAndroid').default;

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);

  // --- 상태 관리 (기존 EditProfileScreen과 동일) ---
  const [image, setImage] = useState(null);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(''); // '남성' | '여성' | ''
  const [mbti, setMbti] = useState('');
  const [focusedField, setFocusedField] = useState(null); // UserInfoScreen의 UI 상호작용을 위한 상태

  // --- 유효성 검사 (기존 EditProfileScreen 기준: 13세 이상) ---
  const isValid = nickname.length > 0 && gender && Number(age) >= 13 && Number(age) <= 99;

  // --- 데이터 로딩 (기존 EditProfileScreen 로직) ---
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('jwt');
      const isMock = await AsyncStorage.getItem('mock');
      
      // 초기 사용자 정보 설정
      const populateState = (userData) => {
        setNickname(userData?.nickname || '');
        setGender(userData?.gender === 'MALE' ? '남성' : userData?.gender === 'FEMALE' ? '여성' : '');
        setAge(userData?.age?.toString() || '');
        setMbti((userData?.mbti || '').toUpperCase());
        setImage(userData?.profileImageUrl || null);
      };

      if (isMock === 'true') {
        populateState(user);
      } else {
        try {
          const freshUser = await getUserInfoWithFetch(token);
          populateState(freshUser);
        } catch (e) {
          console.error('❌ 사용자 정보 조회 실패:', e);
          Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
        }
      }
    };
    init();
  }, []);

  // --- 프로필 이미지 삭제 (기존 EditProfileScreen 로직) ---
  const handleDeleteProfileImage = () => {
    Alert.alert(
      '이미지 삭제',
      '이미지를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => setImage(null) },
      ]
    );
  };

  // --- 프로필 수정 제출 (기존 EditProfileScreen 로직) ---
  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('jwt');
    const isMock = await AsyncStorage.getItem('mock');
    const userData = {
      nickname,
      gender: gender === '남성' ? 'MALE' : 'FEMALE',
      age: Number(age),
      mbti: mbti === '' ? null : mbti,
    };

    if (isMock === 'true') {
      const mockUserData = { ...userData, profileImageUrl: image };
      setUser(mockUserData);
      await AsyncStorage.setItem('user', JSON.stringify(mockUserData));
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
      return;
    }

    try {
      let imageForUpload = image;
      // ✅ 중요: 기존 이미지가 URL이면 base64로 변환 (EditProfileScreen 핵심 로직)
      if (typeof image === 'string' && image.startsWith('http')) {
        imageForUpload = await urlToBase64ProfileImage(image);
      }

      await editUserProfileWithFetch(userData, imageForUpload, token);
      const updatedUser = await getUserInfoWithFetch(token);
      
      setUser({ ...updatedUser, token });
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
    } catch (e) {
      let errorMessage = '편집에 실패했습니다.';
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
        {/* ✨ 헤더: UserInfoScreen 스타일 적용 */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="뒤로가기"
          >
            <Ionicons name="chevron-back" size={normalize(24)} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>프로필 편집</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ✨ 프로필+리드문구 블록: UserInfoScreen 스타일 적용 */}
          <View style={styles.profileRow}>
            <View style={{ marginTop: hScale(6) }}>
              {/* ProfileImagePicker에 기존 로직(onChange, defaultImage) 연결 */}
              <ProfileImagePicker defaultImage={image} onChange={setImage} size={normalize(110)} />
              {/* 이미지가 있을 때만 삭제 버튼 표시 */}
              {image && (
                <TouchableOpacity onPress={handleDeleteProfileImage} style={styles.cameraBadge} accessibilityLabel="프로필 사진 삭제">
                  <MaterialIcons name="cancel" size={normalize(18)} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          
          </View>

          {/* ✨ 폼 영역: UserInfoScreen 스타일 적용 */}
          <View style={styles.formArea}>
            {/* 닉네임 카드 */}
            <View style={[styles.card, focusedField === 'nickname' && styles.cardFocused]}>
              <View style={styles.cardLabelRow}>
                <Text style={styles.cardLabel}>닉네임 <Text style={styles.asterisk}>*</Text></Text>
              </View>
              <TextInput
                style={styles.cardInput}
                placeholder="닉네임을 입력해 주세요"
                placeholderTextColor="#999999"
                value={nickname}
                onChangeText={(t) => t.length <= 12 && setNickname(t)}
                onFocus={() => setFocusedField('nickname')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
              />
            </View>

            {/* 성별 토글 */}
            <View style={styles.genderGroup}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === '남성' && styles.genderBtnSelected]}
                onPress={() => setGender('남성')}
                activeOpacity={0.8}
              >
                <Text style={[styles.genderTxt, gender === '남성' && styles.genderTxtSelected]}>남성</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === '여성' && styles.genderBtnSelected]}
                onPress={() => setGender('여성')}
                activeOpacity={0.8}
              >
                <Text style={[styles.genderTxt, gender === '여성' && styles.genderTxtSelected]}>여성</Text>
              </TouchableOpacity>
            </View>

            {/* 나이 카드 */}
            <View style={[styles.card, focusedField === 'age' && styles.cardFocused]}>
              <View style={styles.cardLabelRow}>
                <Text style={styles.cardLabel}>나이 <Text style={styles.asterisk}>*</Text></Text>
              </View>
              <TextInput
                style={styles.cardInput}
                placeholder="나이를 입력해 주세요"
                placeholderTextColor="#999999"
                keyboardType="numeric"
                value={age.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num >= 0 && num <= 99) setAge(String(num));
                  else if (text === '') setAge('');
                }}
                onFocus={() => setFocusedField('age')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
              />
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
                    // ✅ EditProfile의 Dropdown 항목 사용
                    items={[
                      { label: '선택하지 않음', value: '' }, { label: 'INTJ', value: 'INTJ' },
                      { label: 'INTP', value: 'INTP' }, { label: 'ENTJ', value: 'ENTJ' },
                      { label: 'ENTP', value: 'ENTP' }, { label: 'INFJ', value: 'INFJ' },
                      { label: 'INFP', value: 'INFP' }, { label: 'ENFJ', value: 'ENFJ' },
                      { label: 'ENFP', value: 'ENFP' }, { label: 'ISTJ', value: 'ISTJ' },
                      { label: 'ISFJ', value: 'ISFJ' }, { label: 'ESTJ', value: 'ESTJ' },
                      { label: 'ESFJ', value: 'ESFJ' }, { label: 'ISTP', value: 'ISTP' },
                      { label: 'ISFP', value: 'ISFP' }, { label: 'ESTP', value: 'ESTP' },
                      { label: 'ESFP', value: 'ESFP' },
                    ]}
                  />
                </View>
                <Ionicons name="chevron-down" size={normalize(20)} color="#999999" />
              </View>
            </View>
          </View>

          {/* ✨ 하단 버튼: UserInfoScreen 스타일 적용 */}
          <View style={{ height: hScale(12) }} />
          <TouchableOpacity
            style={[styles.cta, !isValid && styles.ctaDisabled]}
            onPress={handleSubmit}
            disabled={!isValid}
          >
            <Text style={styles.ctaText}>저장하기</Text>
          </TouchableOpacity>
          <View style={{ height: hScale(20) }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ======= 스타일 (UserInfoScreen의 스타일 시트) =======
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    height: hScale(56),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wScale(20),
  },
  backButton: {
    width: normalize(24),
    height: normalize(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: '500',
    color: '#111111',
    letterSpacing: -0.3,
    marginLeft: wScale(8),
  },
  scrollContent: {
    paddingBottom: hScale(24),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    gap: wScale(24),
    paddingHorizontal: wScale(32),
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
  formArea: {
    paddingHorizontal: wScale(32),
    rowGap: hScale(16),
    marginTop: hScale(24), // 프로필 영역과 간격 추가
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E5EC',
    borderRadius: normalize(12),
    paddingHorizontal: wScale(16),
    paddingTop: hScale(16),
    paddingBottom: hScale(14),
  },
  cardFocused: {
    borderColor: '#111111',
  },
  cardLabelRow: {
    marginBottom: hScale(8),
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
  cardInput: {
    fontSize: normalize(16),
    color: '#111111',
    paddingVertical: 0, // 내부 패딩 제거
  },
  genderGroup: {
    backgroundColor: '#F7F7FB',
    borderRadius: normalize(12),
    padding: wScale(4),
    flexDirection: 'row',
    height: hScale(58),
  },
  genderBtn: {
    flex: 1,
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
  mbtiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: wScale(8),
    marginTop: hScale(8),
  },
  cta: {
    marginTop: hScale(24),
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