import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PixelRatio,
  Platform
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';

// ==== 반응형 유틸 함수 (아이폰 13 기준) ====
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height'
    ? SCREEN_HEIGHT / BASE_HEIGHT
    : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Platform.OS === 'ios'
    ? Math.round(PixelRatio.roundToNearestPixel(newSize))
    : Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
}

// ✅ 외부 상태 제어용 AccordionCard 컴포넌트
const AccordionCard = forwardRef(({ title, children, onToggle, contentStyle, isOpen }, ref) => {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={[
        styles.card,
        isOpen ? styles.cardExpanded : { height: normalize(62, 'height') },
      ]}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text style={styles.title}>{title}</Text>
        <AntDesign
          name={isOpen ? 'up' : 'down'}
          size={normalize(16)}
          color="#7E7E7E"
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.content, contentStyle]}>
          {children}
        </View>
      )}
    </View>
  );
});

export default AccordionCard;

const styles = StyleSheet.create({
  card: {
    width: normalize(358),
    height: normalize(62, 'height'),
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(20),
    alignSelf: 'center',
    paddingHorizontal: normalize(16),
    justifyContent: 'center',
    marginBottom: normalize(12, 'height'),
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: normalize(10),
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },
  cardExpanded: {
    height: undefined,
    justifyContent: 'flex-start',
    paddingTop: normalize(20, 'height'),
    paddingBottom: normalize(20, 'height'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  title: {
    fontSize: normalize(14),
    fontWeight: '400',
    color: '#373737',
    fontFamily: 'Roboto',
  },
  content: {
    marginTop: normalize(14, 'height'),
  },
});
