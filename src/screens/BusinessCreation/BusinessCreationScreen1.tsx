import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../libs/hooks/useAuth';
import { getColors } from '../../libs/colors';
import Toolbar from '../../components/Toolbar';
import { iOSUIKit } from 'react-native-typography';
import { TextInput } from 'react-native-gesture-handler';

const BusinessCreationScreen1 = ({ navigation }: any) => {
  const { isDarkMode } = useAuth();
  const colors = getColors(isDarkMode);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Toolbar
        title="Business Access"
        onBack={() => navigation.goBack()}
        showSettings={false}
      />
      <View style={styles.container}>
        <Text style={[iOSUIKit.largeTitleEmphasized, { color: colors.text, marginBottom: 16 }]}>
          Business Creation - Step 1
        </Text>
        <Text style={[iOSUIKit.body, { color: colors.text, marginVertical: 20 }]}>
          This is the first step in the business creation process. More steps will be added here to guide you through setting up your business account.
        </Text>
        <Text style={[iOSUIKit.title3, { color: colors.text, marginVertical: 20 }]}>
          Let's get started by collecting some basic information about your business.
        </Text>
        <TextInput
          style={{
            height: 40,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            color: colors.text,
            backgroundColor: colors.surface,
          }}
          placeholder="Business Name"
          placeholderTextColor={colors.placeholder}
        />
        <TextInput
          style={{
            height: 40,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            color: colors.text,
            backgroundColor: colors.surface,
          }}
          placeholder="Description"
          placeholderTextColor={colors.placeholder}
        />
        <TextInput
          style={{
            height: 40,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            color: colors.text,
            backgroundColor: colors.surface,
          }}
          placeholder="Address"
          placeholderTextColor={colors.placeholder}
        />
        <TextInput
          style={{
            height: 40,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            color: colors.text,
            backgroundColor: colors.surface,
          }}
          placeholder="City"
          placeholderTextColor={colors.placeholder}
        />
        <TextInput
          style={{
            height: 40,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            color: colors.text,
            backgroundColor: colors.surface,
          }}
          placeholder="Country"
          placeholderTextColor={colors.placeholder}
        />
        <TextInput
          style={{
            height: 40,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            color: colors.text,
            backgroundColor: colors.surface,
          }}
          placeholder="State"
          placeholderTextColor={colors.placeholder}
        />
        <TextInput
          style={{
            height: 40,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            color: colors.text,
            backgroundColor: colors.surface,
          }}
          placeholder="Phone Number"
          placeholderTextColor={colors.placeholder}
        />
        <TextInput
          style={{
            height: 40,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            color: colors.text,
            backgroundColor: colors.surface,
          }}
          placeholder="Business Url"
          placeholderTextColor={colors.placeholder}
        />
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: colors.primary,
          padding: 15,
          borderRadius: 10,
          margin: 24,
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('BusinessCreationScreen2')}
      >
        <Text style={{ color: colors.background, fontWeight: 'bold', fontSize: 16 }}>
          Next Step
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});

export default BusinessCreationScreen1;
