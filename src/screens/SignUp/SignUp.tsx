
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useAuth } from '../../libs/hooks/useAuth';
import { getColors } from '../../libs/colors';

const fieldKeys = ["firstName", "lastName", "email", "phone", "password"] as const;
const fieldLabels = ["First Name", "Last Name", "Email", "Phone Number", "Password"];

const SignUpScreen = ({ navigation }: any) => {
  const { isDarkMode } = useAuth();
  const colors = getColors(isDarkMode);
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>  
      <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
      {fieldLabels.map((field, idx) => (
        <TextInput
          key={field}
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
          placeholder={field}
          placeholderTextColor={colors.textPlaceholder}
          value={fields[fieldKeys[idx]]}
          onChangeText={text => setFields({ ...fields, [fieldKeys[idx]]: text })}
          secureTextEntry={field === 'Password'}
          keyboardType={field === 'Email' ? 'email-address' : field === 'Phone Number' ? 'phone-pad' : 'default'}
        />
      ))}
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.text }]} onPress={() => navigation.navigate('Swipe')}>
        <Text style={{ color: colors.background, fontWeight: 'bold' }}>Join DEALZ</Text>
      </TouchableOpacity>
      {/* Social Sign Up Buttons */}
      <View style={styles.socialContainer}>
        <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.google, borderColor: colors.border, borderWidth: 1 }]}> 
          <FontAwesome name="google" size={22} color={colors.background} style={styles.socialIcon} />
          <Text style={[styles.socialText, { color: colors.background }]}>Sign up with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.facebook }]}> 
          <FontAwesome name="facebook" size={22} color={colors.background} style={styles.socialIcon} />
          <Text style={[styles.socialText, { color: colors.background }]}>Sign up with Facebook</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.instagram }]}> 
          <FontAwesome name="instagram" size={22} color={colors.background} style={styles.socialIcon} />
          <Text style={[styles.socialText, { color: colors.background }]}>Sign up with Instagram</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.apple }]}> 
          <FontAwesome5 name="apple" size={22} color={colors.background} style={styles.socialIcon} />
          <Text style={[styles.socialText, { color: colors.background }]}>Sign up with Apple</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 12,
  },
  socialContainer: {
    width: '100%',
    marginTop: 16,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    justifyContent: 'center',
  },
  socialIcon: {
    marginRight: 12,
  },
  socialText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SignUpScreen;
