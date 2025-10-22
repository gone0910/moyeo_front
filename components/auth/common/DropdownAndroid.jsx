// auth/common/DropdownAndroid.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';


// props: label, selectedValue, onValueChange, items (label, value)
export default function DropdownAndroid({ label, selectedValue, onValueChange, items }) {
  const [visible, setVisible] = React.useState(false);


  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.text}>
          {items.find(i => i.value === selectedValue)?.label || '선택안함'}
        </Text>
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    setVisible(false);
                    onValueChange(item.value);
                  }}
                >
                  <Text style={styles.text}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    width: '100%',
     marginBottom: 10
},
  label: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
    fontWeight: '400'
},
  dropdown: {
    borderColor: '#D1D5DB',
    borderWidth: 1, borderRadius: 8,
    backgroundColor: '#fff', padding: 12,
    minHeight: 40,
    justifyContent: 'center'
},
  text: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'left'
},
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center'
},
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 40,
    borderRadius: 8,
    maxHeight: 300,
    padding: 10
},
  item: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
},


});
