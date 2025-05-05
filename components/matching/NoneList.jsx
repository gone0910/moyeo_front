import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../../contexts/UserContext';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export default function NoneList() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [fontsLoaded] = useFonts({ KaushanScript: KaushanScript_400Regular });

  if (!fontsLoaded) return null;

  return (
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerWrapper}>
          <Text style={styles.logotext} numberOfLines={1} adjustsFontSizeToFit>moyeo </Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileHome', user)}>
            {user?.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder} />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.headerLine} />
      {/* 아래에 ScrollView 등으로 리스트를 추가할 수 있습니다 */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* 매칭 리스트 아이템들 예시 */}
        <Text style={styles.NoneListText1}>
        같이 떠날 수 있는 여행자가 없어요
        </Text>
        <Text style={styles.NoneListText2}>
        동행자 정보를 수정하시는 걸 추천드려요
        </Text>

        <View style={styles.buttonContainer}>
              <TouchableOpacity /*로켓 모양 누르면 MatchingList로 돌아감*/
                style={styles.MachingListButton}
                onPress={() => navigation.navigate('MatchingList')}
              >
                <Ionicons name="rocket-outline" size={24} color="white" />
              </TouchableOpacity>
              </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 16,
        paddingTop: 24,
      },
      headerWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      logotext: {
        fontSize: 40,
        fontFamily: 'KaushanScript',
        color: '#4F46E5',
        lineHeight: 80,
        letterSpacing: 0,
      },
      profileImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginTop: 22,
        top:-5,
      },
      profilePlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        top:5,
        backgroundColor: '#D1D5DB',
      },
      headerLine: {
        height: 1,
        backgroundColor: '#999',
        marginVertical: 8,
        top:-10,
      },

      NoneListText1: {
        fontSize: 22,
        color: '#1E1E1E',
        textAlign: 'center',
        marginVertical: 12,
        top:150,
      },

      NoneListText2: {
        fontSize: 16,
        color: '#7E7E7E',
        textAlign: 'center',
        marginVertical: 12,
        top:150,
      },
      contentContainer: {
        padding: 25,
        paddingBottom: 100, 
        alignItems: 'center', 
        justifyContent: 'center', 
    },
    buttonContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
    flexDirection: "row",
    gap: 12,
    },
    MachingListButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    top:-120,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
  },
});
