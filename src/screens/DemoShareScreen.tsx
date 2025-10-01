import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import DealShareButton from '../components/DealShareButton';

// Demo component to test sharing functionality
const DemoShareScreen = () => {
  // Mock deal data for testing
  const mockDeal = {
    id: 1,
    business_name: 'Coffee Bean Cafe',
    business: 'Coffee Bean Cafe',
    description: 'Buy 2 Coffees, Get 1 Free!',
    category_name: 'Food & Drink',
    expires: 'Expires: Dec 31, 2024',
    is_premium_business: true
  };

  const handleTestShare = () => {
    Alert.alert('Test', 'This is a demo sharing screen to test the sharing functionality');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deal Sharing Demo</Text>
      <Text style={styles.subtitle}>Test the contact-based sharing system</Text>
      
      <View style={styles.dealCard}>
        <Text style={styles.dealTitle}>{mockDeal.business_name}</Text>
        <Text style={styles.dealDescription}>{mockDeal.description}</Text>
        <Text style={styles.dealCategory}>{mockDeal.category_name}</Text>
        <Text style={styles.dealExpires}>{mockDeal.expires}</Text>
        
        <DealShareButton 
          deal={mockDeal}
          requiredShares={3}
          style={styles.shareButton}
        />
      </View>
      
      <TouchableOpacity style={styles.testButton} onPress={handleTestShare}>
        <Text style={styles.testButtonText}>Test Manual Share</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  dealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dealTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dealDescription: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  dealCategory: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  dealExpires: {
    fontSize: 12,
    marginBottom: 16,
    color: '#999',
  },
  shareButton: {
    marginTop: 8,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DemoShareScreen;