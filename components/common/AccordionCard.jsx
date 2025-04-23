import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

export default function AccordionCard({ title, children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View>
      {["card1"].map((card, index) => (
        <View key={index} style={[styles[card], expanded && styles[`${card}Expanded`]]}>
          <TouchableOpacity
            style={styles[`header${index + 1}`]}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.8}
          >
            <Text style={styles[`title${index + 1}`]}>{title}</Text>
            <AntDesign
              name={expanded ? 'up' : 'down'}
              size={24}
              color="#000"
            />
          </TouchableOpacity>

          {expanded && <View style={styles[`content${index + 1}`]}>{children}</View>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card1: {
    width: 358,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignSelf: 'center',
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },
  card2: {
    width: 358,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  card3: {
    width: 358,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  cardExpanded1: {
    height: 162,
    justifyContent: 'flex-start',
  },
  cardExpanded2: {
    height: 182,
    justifyContent: 'flex-start',
  },
  cardExpanded3: {
    height: 182,
    justifyContent: 'flex-start',
  },
  header1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    top: 30,
  },
  header2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    top: 30,
  },
  header3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    top: 30,
  },
  title1: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'Roboto',
    top: -20,
    marginTop: 5, // 위 간격 추가
    letterSpacing: 2, // 글자 간격 추가
    lineHeight: 30, // 줄 간격 추가
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  title2: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'Roboto',
    top: -20,
    marginTop: 5,
    letterSpacing: 2,
    lineHeight: 35,
  },
  title3: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
    fontFamily: 'Roboto',
    top: -20,
    marginTop: 5,
    letterSpacing: 2,
    lineHeight: 35,
  },
  content1: {
    marginTop: 0,
  },
  content2: {
    marginTop: 0,
  },
  content3: {
    marginTop: 0,
  },
});