import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../libs/hooks/useAuth';
import Toolbar from '../components/Toolbar';


// const defaultDeal = {
//   business: "Ara's Sandwich Shop",
//   offer: "Free Turkey Club Sandwich",
//   description: "Get a delicious turkey club sandwich absolutely free! Premium turkey, crispy bacon, fresh lettuce and tomato on artisan bread.",
//   image: "🥪",
//   location: "Downtown • 0.3 mi",
//   category: "Food",
//   expires: "Expires in 2 days",
//   backgroundColor: "#FF6B35"
// };

const DealDetailScreen = ({ navigation, route }: any) => {
  const { isDarkMode } = useAuth();
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
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }}>
      <Toolbar
        title="Deal Details"
        onBack={() => navigation.goBack()}
        showSettings={true}
        onSettings={() => navigation.navigate('Settings')}
      />
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: deal.backgroundColor || '#FF6B35' }]}>  
          <Text style={styles.dealImage}>{dealImage}</Text>
          <Text style={styles.dealOffer}>{offer}</Text>
          <Text style={styles.dealBusiness}>{business}</Text>
          <Text style={styles.dealLocation}>{location}</Text>
          <Text style={styles.dealExpires}>{expires}</Text>
          {category && <Text style={styles.dealExpires}>{category}</Text>}
          {description && <Text style={styles.dealDescription}>{description}</Text>}
        </View>
        <View style={styles.redeemSection}>
          <Text style={[styles.redeemLabel, { color: isDarkMode ? '#fff' : '#000' }]}>Send to how many contacts?</Text>
          <View style={styles.redeemRow}>
            <TouchableOpacity onPress={() => setContactsToSend(Math.max(2, contactsToSend - 1))} style={styles.redeemBtn}><Text style={styles.redeemBtnText}>-</Text></TouchableOpacity>
            <Text style={styles.contactsCount}>{contactsToSend}</Text>
            <TouchableOpacity onPress={() => setContactsToSend(Math.min(6, contactsToSend + 1))} style={styles.redeemBtn}><Text style={styles.redeemBtnText}>+</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: isDarkMode ? '#fff' : '#000' }]} onPress={() => {/* send logic */}}>
            <Text style={{ color: isDarkMode ? '#000' : '#fff', fontWeight: 'bold' }}>Send to {contactsToSend} Contacts</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#FF6B35', marginTop: 16 }]} onPress={() => navigation.navigate('SavedDeals')}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Deal</Text>
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
    color: '#fff',
  },
  dealBusiness: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  dealLocation: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  dealExpires: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 8,
  },
  dealDescription: {
    fontSize: 14,
    color: '#fff',
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
    backgroundColor: '#eee',
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
