import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

const SignUpScreen = ({ navigation }: any) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>  
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>Create Account</Text>
      {['First Name', 'Last Name', 'Email', 'Phone Number', 'Password'].map((field, idx) => (
        <TextInput
          key={field}
          style={[styles.input, { color: isDarkMode ? '#fff' : '#000', backgroundColor: isDarkMode ? '#222' : '#f5f5f5' }]}
          placeholder={field}
          placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
          value={fields[["firstName","lastName","email","phone","password"][idx]]}
          onChangeText={text => setFields({ ...fields, [["firstName","lastName","email","phone","password"][idx]]: text })}
          secureTextEntry={field === 'Password'}
          keyboardType={field === 'Email' ? 'email-address' : field === 'Phone Number' ? 'phone-pad' : 'default'}
        />
      ))}
      <TouchableOpacity style={[styles.button, { backgroundColor: isDarkMode ? '#fff' : '#000' }]} onPress={() => navigation.navigate('Swipe')}>
        <Text style={{ color: isDarkMode ? '#000' : '#fff', fontWeight: 'bold' }}>Join DEALZ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
});

export default SignUpScreen;
