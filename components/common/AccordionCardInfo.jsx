// 📁 components/common/AccordionCardInfo.jsx
// 매칭 기입화면 (MatchingInfoScreen.jsx) 요소에 쓰이는 아코디언 카드.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

export default function AccordionCard({ title, children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <Text style={styles.title}>{title}</Text>
        <AntDesign
          name={expanded ? 'up' : 'down'}
          size={16}
          color="##7E7E7E"
        />
      </TouchableOpacity>

      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 358,
    height: 62,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignSelf: 'center',
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },
  cardExpanded: {
    height: undefined, // ✅ 고정 해제 → 내용물에 따라 자동 높이
    justifyContent: 'flex-start',
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,  // 아이폰은 0, 갤럭시는 5. 내부 텍스트 최대한 중심에 맞게.
  },
  title: {
    fontSize: 14,
    fontWeight: '400',
    color: '#373737',
    fontFamily: 'Roboto',
  },
  content: {
    marginTop: 14,
  },
});
