import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../libs/hooks/useAuth';

const SignInScreen = ({ navigation }: any) => {
  const { isDarkMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>  
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>DEALZ</Text>
      <Text style={[styles.subtitle, { color: isDarkMode ? '#aaa' : '#333' }]}>Swipe. Save. Share. Repeat.</Text>
      <TextInput
        style={[styles.input, { color: isDarkMode ? '#fff' : '#000', backgroundColor: isDarkMode ? '#222' : '#f5f5f5' }]}
        placeholder="Email"
        placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { color: isDarkMode ? '#fff' : '#000', backgroundColor: isDarkMode ? '#222' : '#f5f5f5' }]}
        placeholder="Password"
        placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: isDarkMode ? '#fff' : '#000' }]} onPress={() => navigation.navigate('Swipe')}>
        <Text style={{ color: isDarkMode ? '#000' : '#fff', fontWeight: 'bold' }}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.buttonOutline, { borderColor: isDarkMode ? '#fff' : '#000' }]} onPress={() => navigation.navigate('SignUp')}>
        <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: 'bold' }}>Create Account</Text>
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
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
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
    marginBottom: 12,
  },
  buttonOutline: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
});

export default SignInScreen;
