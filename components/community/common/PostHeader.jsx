// 커뮤니티 게시글- 상단 헤더
// components/common/CustomHeader.jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const BASE_WIDTH = 390;   // Figma 기준 width
const BASE_HEIGHT = 844;  // Figma 기준 height

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 비율 변환 함수
function scaleWidth(size) {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
}
function scaleHeight(size) {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
}

export default function CustomHeader({
  title = '',
  onBack,
  onEdit,
  onDelete,
  showMore = false, // 더보기 버튼 표시 여부
}) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <View style={styles.headerContainer}>
      {/* 왼쪽: 뒤로가기 */}
      <TouchableOpacity onPress={onBack} style={styles.sideButton}>
        <MaterialIcons name="chevron-left" size={scaleWidth(36)} color="#4F46E5" />
      </TouchableOpacity>

      {/* 가운데: 타이틀 */}
      {/* <View style={styles.titleWrapper}>
        <Text
          style={styles.headerTitle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View> */}

      {/* 오른쪽: 더보기 */}
      {showMore ? (
        <TouchableOpacity onPress={() => setShowMoreMenu(true)} style={styles.sideButton}>
          <MaterialIcons name="more-horiz" size={scaleWidth(36)} color="#4F46E5" />
        </TouchableOpacity>
      ) : (
        <View style={styles.sideButton} /> // 공간 유지용
      )}

      {/* 구분선 */}
      <View style={styles.headerLine} />

      {/* 더보기 메뉴 (Modal) */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity
          style={styles.moreMenuBackdrop}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={styles.moreMenu}>
            {/* 수정 버튼 */}
            <TouchableOpacity style={styles.menuButton} onPress={() => { setShowMoreMenu(false); onEdit && onEdit(); }}>
              <Text style={styles.menuEditText}>수정</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            {/* 삭제 버튼 */}
            <TouchableOpacity style={styles.menuButton} onPress={() => { setShowMoreMenu(false); onDelete && onDelete(); }}>
              <Text style={styles.menuDeleteText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: scaleHeight(60),
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: scaleHeight(10),
    paddingHorizontal: 0,
    justifyContent: 'space-between',
    position: 'relative',
  },
  sideButton: {
    width: scaleWidth(80),
    height: scaleHeight(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
    height: scaleHeight(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scaleWidth(5), // 좌우 공간 살짝
  },
  headerTitle: {
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    fontSize: scaleWidth(20), // 20pt 기준
    color: '#000',
    textAlign: 'center',
    maxWidth: scaleWidth(220),
    includeFontPadding: false,
  },
  headerLine: {
    position: 'absolute',
    top: scaleHeight(60),
    left: scaleWidth(16),
    width: scaleWidth(358),
    height: 1,
    backgroundColor: '#999999',
  },
  // ----- More menu (팝업) -----
  moreMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  moreMenu: {
    position: 'absolute',
    top: scaleHeight(72),
    left: SCREEN_WIDTH - scaleWidth(131),
    width: scaleWidth(114),
    height: scaleHeight(60),
    borderRadius: scaleWidth(12),
    backgroundColor: '#FFF',
    // RN 전용 그림자
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 10,
  },
  menuButton: {
    width: scaleWidth(114),
    height: scaleHeight(30),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  menuDivider: {
    height: 0.7,
    backgroundColor: '#C7C7C7',
    width: '100%',
  },
  menuEditText: {
    fontFamily: 'Roboto',
    fontSize: scaleWidth(14),
    color: '#4F46E5',
    fontWeight: '400',
    textAlign: 'center',
  },
  menuDeleteText: {
    fontFamily: 'Roboto',
    fontSize: scaleWidth(14),
    color: '#F97575',
    fontWeight: '400',
    textAlign: 'center',
  },
});
