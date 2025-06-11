// 📁 components/home/TravelSection.jsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PixelRatio,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import TravelCard from '../common/TravelCard';

// ==== 반응형 유틸 함수 (iPhone 13 기준) ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale =
    based === 'height'
      ? SCREEN_HEIGHT / BASE_HEIGHT
      : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

/**
 * 다가오는 여행 카드 리스트를 출력하는 컴포넌트입니다.
 */
export default function TravelSection({ travelList = [], onPressCreate, onPressCard }) {
  const safeList = Array.isArray(travelList) ? travelList : [];

  return (
    <View style={styles.container}>
      {(safeList?.length ?? 0) === 0 ? (
        <View style={styles.noPlanBox}>
          <Text style={styles.noPlanText}>아직 여행 플랜이 없어요</Text>
          <TouchableOpacity onPress={onPressCreate}>
            <Text style={styles.noPlanLink}>함께 여행계획을 세우러 가볼까요?</Text>
          </TouchableOpacity>
        </View>
      ) : (
        safeList.map(plan => (
          <TravelCard
            key={plan.id}
            title={plan.title}
            period={
              plan.startDate && plan.endDate
                ? `${plan.startDate.replace(/-/g, '.')} ~ ${plan.endDate.replace(/-/g, '.')}`
                : plan.period || ''
            }
            dDay={plan.dDay || plan.dday || ''}
            route={Array.isArray(plan.route) ? plan.route : []}
            onPress={() => {
              console.log('✅ TravelCard 클릭됨! plan.id:', plan.id);  // ← 정상 위치로 이동
              onPressCard?.(plan.id);
            }}
          />
        ))
      )}
      <TouchableOpacity style={styles.createBtn} onPress={onPressCreate}>
        <View style={styles.plusCircle}>
          <MaterialIcons name="add" size={normalize(36)} color="#FFFFFF" />
        </View>
        <Text
          style={{
            fontFamily: 'Roboto',
            fontWeight: '400',
            fontSize: normalize(16),
            color: '#000000',
            textAlign: 'center',
            flex: 1,
            paddingRight: normalize(36),
          }}
        >
          여행 플랜 만들러 가기
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: normalize(0, 'height'),
  },
  noPlanBox: {
    backgroundColor: '#fff',
    borderRadius: normalize(20),
    width: normalize(360),
    height: normalize(100, 'height'),
    paddingHorizontal: normalize(16),
    marginTop: normalize(8, 'height'),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: normalize(4, 'height') },
    shadowOpacity: 0.15,
    shadowRadius: normalize(8),
    elevation: 2,
  },
  noPlanText: {
    fontFamily: 'Roboto',
    fontSize: normalize(16),
    fontWeight: '400',
    color: '#000000',
  },
  noPlanLink: {
    fontFamily: 'Roboto',
    fontSize: normalize(12),
    fontWeight: '400',
    color: '#4F46E5B2',
    marginTop: normalize(8, 'height'),
  },
  createBtn: {
    width: '92%',
    height: normalize(48, 'height'),
    borderRadius: normalize(20),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
  shadowOpacity: 0.1, 
  shadowRadius: normalize(6), 
  shadowOffset: { width: 0, height: 0 }, 
  elevation: 12, 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(36),
    marginTop: normalize(18, 'height'),
    marginHorizontal: normalize(0),
    alignSelf: 'center',
  },
  plusCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(14),
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(12),
  },
  createText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: normalize(16),
    color: '#000000',
    textAlign: 'center',
    flex: 1,
    paddingRight: normalize(36),
  },
});