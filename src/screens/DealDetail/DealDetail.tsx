import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../libs/hooks/useAuth';
import { getColors } from '../../libs/colors';
import Toolbar from '../../components/Toolbar';

const DealDetailScreen = ({ navigation, route }: any) => {
  const { isDarkMode } = useAuth();
  const colors = getColors(isDarkMode);
  const [contactsToSend, setContactsToSend] = useState(3);
  // Prefer backend fields, fallback to defaultDeal for missing values
  const deal = route?.params?.deal;
  
  console.log('Deal details:', deal);

  // Use placeholder if no image
  const dealImage = deal.image ? deal.image : '🛍️';
  // Prefer backend field names for business, offer, etc.
  const business = deal.business || deal.business_name || '';
  const offer = deal.offer || deal.item || deal.title || '';
  const category = deal.category || deal.category_name || '';
  const location = deal.location || deal.location_name || '';
  const expires = deal.expires || deal.expiry || '';
  const description = deal.description || '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Toolbar
        title="Deal Details"
        onBack={() => navigation.goBack()}
        showSettings={true}
        onSettings={() => navigation.navigate('Settings')}
      />
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: deal.backgroundColor || colors.primary }]}>  
          <Text style={styles.dealImage}>{dealImage}</Text>
          <Text style={[styles.dealOffer, { color: colors.background }]}>{offer}</Text>
          <Text style={[styles.dealBusiness, { color: colors.background }]}>{business}</Text>
          <Text style={[styles.dealLocation, { color: colors.background }]}>{location}</Text>
          <Text style={[styles.dealExpires, { color: colors.background }]}>{expires}</Text>
          {category && <Text style={[styles.dealExpires, { color: colors.background }]}>{category}</Text>}
          {description && <Text style={[styles.dealDescription, { color: colors.background }]}>{description}</Text>}
        </View>
        <View style={styles.redeemSection}>
          <Text style={[styles.redeemLabel, { color: colors.text }]}>Send to how many contacts?</Text>
          <View style={styles.redeemRow}>
            <TouchableOpacity onPress={() => setContactsToSend(Math.max(2, contactsToSend - 1))} style={[styles.redeemBtn, { backgroundColor: colors.surface }]}><Text style={[styles.redeemBtnText, { color: colors.text }]}>-</Text></TouchableOpacity>
            <Text style={[styles.contactsCount, { color: colors.text }]}>{contactsToSend}</Text>
            <TouchableOpacity onPress={() => setContactsToSend(Math.min(6, contactsToSend + 1))} style={[styles.redeemBtn, { backgroundColor: colors.surface }]}><Text style={[styles.redeemBtnText, { color: colors.text }]}>+</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.text }]} onPress={() => {/* send logic */}}>
            <Text style={{ color: colors.background, fontWeight: 'bold' }}>Send to {contactsToSend} Contacts</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={() => navigation.navigate('SavedDeals')}>
          <Text style={{ color: colors.background, fontWeight: 'bold' }}>Save Deal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    width: 300,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  dealImage: {
    fontSize: 64,
    marginBottom: 12,
  },
  dealOffer: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dealBusiness: {
    fontSize: 16,
    marginBottom: 4,
  },
  dealLocation: {
    fontSize: 14,
    marginBottom: 4,
  },
  dealExpires: {
    fontSize: 12,
    marginBottom: 8,
  },
  dealDescription: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  redeemSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  redeemLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  redeemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  redeemBtn: {
    borderRadius: 16,
    padding: 8,
    marginHorizontal: 8,
  },
  redeemBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactsCount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  button: {
    width: 220,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
});

export default DealDetailScreen;
