import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getColors } from '../../libs/colors';
import { useAuth } from '../../libs/hooks/useAuth';
import Toolbar from '../../components/Toolbar';
import { iOSUIKit } from 'react-native-typography';

const RedemptionScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { isDarkMode } = useAuth();
  const colors = getColors(isDarkMode);
  const { code, deal } = route.params || {};

  // Fallback code if not provided
  const redemptionCode = code || deal?.redemption_code || 'ABC123';
  const qrValue = redemptionCode;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Toolbar
        title="Redeem Deal"
        onBack={() => navigation.goBack()}
        showSettings={false}
      />
      <View style={styles.container}>
        <Text style={[iOSUIKit.title3Emphasized, { color: colors.text, marginBottom: 16 }]}>Show this code to the business</Text>
        <View style={styles.codeBox}>
          <Text style={[iOSUIKit.largeTitleEmphasized, { color: colors.primary }]}>{redemptionCode}</Text>
        </View>
        <Text style={[iOSUIKit.body, { color: colors.text, marginVertical: 16 }]}>Or scan this QR code:</Text>
        <View style={styles.qrBox}>
          {/* <QRCode value={qrValue} size={180} backgroundColor={colors.background} color={colors.primary} /> */}
        </View>
        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={[iOSUIKit.title3, { color: colors.background }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  codeBox: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  qrBox: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  doneBtn: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 24,
    alignItems: 'center',
  },
});

export default RedemptionScreen;
