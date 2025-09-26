import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../libs/hooks/useAuth';
import { getColors } from '../../libs/colors';

const SignInScreen = ({ navigation }: any) => {
  const { isDarkMode, login } = useAuth();
  const colors = getColors(isDarkMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 SignIn: Attempting login with email:', email);
      
      await login({ email, password });
      
      console.log('✅ SignIn: Login successful, navigating to Swipe');
      navigation.navigate('Swipe');
    } catch (error) {
      console.error('❌ SignIn: Login failed:', error);
      Alert.alert('Sign In Failed', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>  
      <Text style={[styles.title, { color: colors.text }]}>DEALZ</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Swipe. Save. Share. Repeat.</Text>
      <TextInput
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
        placeholder="Email"
        placeholderTextColor={colors.textPlaceholder}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
        placeholder="Password"
        placeholderTextColor={colors.textPlaceholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: loading ? colors.disabled : colors.text }]} 
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
          <Text style={{ color: colors.background, fontWeight: 'bold' }}>Sign In</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={[styles.buttonOutline, { borderColor: colors.text }]} onPress={() => navigation.navigate('SignUp')}>
        <Text style={{ color: colors.text, fontWeight: 'bold' }}>Create Account</Text>
      </TouchableOpacity>

      {/* Social Sign In Buttons */}
      <View style={styles.socialContainer}>
        <TouchableOpacity
          style={[styles.socialBtn, { backgroundColor: colors.google, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => navigation.navigate('Swipe')}
        >
          <FontAwesome name="google" size={22} color={colors.background} style={styles.socialIcon} />
          <Text style={[styles.socialText, { color: colors.background }]}>Sign in with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.socialBtn, { backgroundColor: colors.facebook }]}
          onPress={() => navigation.navigate('Swipe')}
        >
          <FontAwesome name="facebook" size={22} color={colors.background} style={styles.socialIcon} />
          <Text style={[styles.socialText, { color: colors.background }]}>Sign in with Facebook</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.socialBtn, { backgroundColor: colors.instagram }]}
          onPress={() => navigation.navigate('Swipe')}
        >
          <FontAwesome name="instagram" size={22} color={colors.background} style={styles.socialIcon} />
          <Text style={[styles.socialText, { color: colors.background }]}>Sign in with Instagram</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.socialBtn, { backgroundColor: colors.apple }]}
          onPress={() => navigation.navigate('Swipe')}
        >
          <FontAwesome5 name="apple" size={22} color={colors.background} style={styles.socialIcon} />
          <Text style={[styles.socialText, { color: colors.background }]}>Sign in with Apple</Text>
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
  debugButton: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    padding: 8,
    borderRadius: 5,
    borderWidth: 1,
  },
});

export default SignInScreen;
