// components/common/HeaderBar.jsx 로고, 프사, 구분선을 포함한 상단헤더
// kaushan 폰트는 앱 전역에서 발생되기에 App.jsx에서  한번에 폰트를 로딩.
import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';

export default function CommonHeader({ showDivider = true }) {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.logoText}>moyeo </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileHome')}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder} />
          )}
        </TouchableOpacity>
      </View>
      {showDivider && <View style={styles.headerLine} />}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fafafa',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontFamily: 'KaushanScript',
    color: '#4F46E5',
    lineHeight: 80,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: 20,
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1D5DB',
    marginTop: 20,
  },
  headerLine: {
    height: 1,
    backgroundColor: '#999999',
    marginTop: 1,
  },
});