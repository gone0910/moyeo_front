// 📁 components/home/TravelSection.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import TravelCard from '../common/TravelCard';

/**
 * 다가오는 여행 카드 리스트를 출력하는 컴포넌트입니다.
 * - 여행 플랜이 있는 경우 TravelCard들을 렌더링합니다.
 * - 여행 플랜이 없는 경우 안내 메시지를 출력합니다.
 * - "여행 플랜 만들러 가기" 버튼도 포함됩니다.
 *
 * @param {Array} travelList - 여행 플랜 배열
 * @param {Function} onPressCreate - 플랜 생성 버튼 클릭 시 실행될 함수
 */
export default function TravelSection({ travelList, onPressCreate }) {
  return (
    <View style={styles.container}>
      {travelList.length === 0 ? (
        <View style={styles.noPlanBox}>
          <Text style={styles.noPlanText}>아직 여행 플랜이 없어요</Text>
          <TouchableOpacity onPress={onPressCreate}>
            <Text style={styles.noPlanLink}>함께 여행계획을 세우러 가볼까요?</Text>
          </TouchableOpacity>
        </View>
      ) : (
        travelList.map(plan => (
          <TravelCard
            key={plan.id}
            title={plan.title}
            dDay={plan.dDay}
            period={plan.period}
            route={plan.route}
          />
        ))
      )}

      <TouchableOpacity style={styles.createBtn} onPress={onPressCreate}>
        <View style={styles.plusCircle}>
          <MaterialIcons name="add" size={21} color="#FFFFFF" />
        </View>
        <Text style={styles.createText}>여행 플랜 만들러 가기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  noPlanBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    height: 160,
    paddingHorizontal: 24,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  noPlanText: {
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: '400',
    color: '#00000',
  },
  noPlanLink: {
    fontFamily: 'Roboto',
    fontSize: 12,
    fontWeight: '400',
    color: '#4F46E5B2',
    marginTop: 8,
  },
  createBtn: {
    height: 48,
    borderRadius: 20,              // TravelCard radius와 맞추기
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 36,
    marginTop: 15,
    marginHorizontal: 0,           // 양옆 딱 맞추기
  },
  plusCircle: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  createText: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 12,
    color: '#000000',
    textAlign: 'center',     // 텍스트 중앙 정렬
    flex: 1,                 // 공간을 다 차지함 → 가운데 위치   
    paddingRight: 36,        // 오른쪽 여백 추가해서 조금 왼쪽으로 보이게
  },  
});