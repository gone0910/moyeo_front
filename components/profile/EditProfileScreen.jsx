import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { RadioButton } from 'react-native-paper';
import ProfileImagePicker from '../common/ProfileImagePicker';
import { UserContext } from '../../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfileScreen() {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [mbti, setMbti] = useState('');
  const [image, setImage] = useState(null);

  const { setUser } = useContext(UserContext);

  const handleSave = async () => {
    const updatedUser = { nickname, gender, age, mbti, image };

    try {
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert('저장 완료', '프로필이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      Alert.alert('저장 실패', '다시 시도해주세요.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.label}>프로필 사진</Text>
        <View style={styles.imagePickerContainer}>
          <ProfileImagePicker defaultImage={image} onChange={setImage} />
        </View>

        <Text style={styles.label}>닉네임</Text>
        <TextInput
          style={styles.input}
          placeholder="닉네임을 입력하세요"
          value={nickname}
          onChangeText={setNickname}
        />

        <Text style={styles.label}>성별 선택</Text>
        <RadioButton.Group onValueChange={setGender} value={gender}>
          <View style={styles.radioContainer}>
            <RadioButton value="male" />
            <Text style={styles.radioLabel}>남성</Text>
          </View>
          <View style={styles.radioContainer}>
            <RadioButton value="female" />
            <Text style={styles.radioLabel}>여성</Text>
          </View>
        </RadioButton.Group>

        <Text style={styles.label}>나이</Text>
        <TextInput
          style={styles.input}
          placeholder="나이"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />

        <Text style={styles.label}>MBTI 선택</Text>
        <Picker
          selectedValue={mbti}
          onValueChange={(itemValue) => setMbti(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="선택하지 않음" value="" />
          <Picker.Item label="ISTJ" value="ISTJ" />
          <Picker.Item label="ISFJ" value="ISFJ" />
          <Picker.Item label="ISTP" value="ISTP" />
          <Picker.Item label="ISFP" value="ISFP" />
          <Picker.Item label="INFJ" value="INFJ" />
          <Picker.Item label="INTJ" value="INTJ" />
          <Picker.Item label="INFP" value="INFP" />
          <Picker.Item label="INTP" value="INTP" />
          <Picker.Item label="ESTP" value="ESTP" />
          <Picker.Item label="ESFP" value="ESFP" />
          <Picker.Item label="ESTJ" value="ESTJ" />
          <Picker.Item label="ESFJ" value="ESFJ" />
          <Picker.Item label="ENFP" value="ENFP" />
          <Picker.Item label="ENTP" value="ENTP" />
          <Picker.Item label="ENFJ" value="ENFJ" />
          <Picker.Item label="ENTJ" value="ENTJ" />
        </Picker>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>저장</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  picker: {
    height: 50,
    width: '100%',
    marginVertical: 10,
  },
  button: {
    backgroundColor: 'black',
    padding: 15,
    alignItems: 'center',
    marginVertical: 20,
    marginTop: 50,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
