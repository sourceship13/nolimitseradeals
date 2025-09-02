import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../libs/hooks/useAuth';
import Toolbar from '../components/Toolbar';

const sampleDeals = [
  {
    id: 1,
    business: "Ara's Sandwich Shop",
    offer: "Free Turkey Club Sandwich",
    image: "🥪",
    location: "Downtown • 0.3 mi",
    category: "Food",
    expires: "Expires in 2 days",
    backgroundColor: "#FF6B35"
  },
  {
    id: 2,
    business: "Ara's Fitness Gear",
    offer: "Free Resistance Bands Set",
    image: "💪",
    location: "Midtown • 0.8 mi",
    category: "Fitness",
    expires: "Expires in 5 days",
    backgroundColor: "#4ECDC4"
  }
];

const SwipeScreen = ({ navigation }: any) => {
  const { isDarkMode } = useAuth();
  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const currentDeal = sampleDeals[currentDealIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      navigation.navigate('DealDetail');
    } else {
      setCurrentDealIndex((prev) => (prev + 1) % sampleDeals.length);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }}>
      <Toolbar
        title="DEALZ"
        onBack={() => navigation.goBack()}
        showSettings={true}
        onSettings={() => navigation.navigate('Settings')}
      />
      <View style={styles.topBar}>
        <Text style={[styles.topBarTitle, { color: isDarkMode ? '#fff' : '#111' }]}>Today's Deals</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Explore')}>
          <Text style={[styles.exploreBtnText, { color: isDarkMode ? '#fff' : '#111' }]}>Explore</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: currentDeal.backgroundColor }]}>  
          <Text style={styles.dealImage}>{currentDeal.image}</Text>
          <Text style={styles.dealOffer}>{currentDeal.offer}</Text>
          <Text style={styles.dealBusiness}>{currentDeal.business}</Text>
          <Text style={styles.dealLocation}>{currentDeal.location}</Text>
          <Text style={styles.dealExpires}>{currentDeal.expires}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#222' : '#eee' }]} onPress={() => handleSwipe('left')}>
            <Text style={{ color: '#e74c3c', fontSize: 24 }}>✗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#fff' : '#000' }]} onPress={() => handleSwipe('right')}>
            <Text style={{ color: '#e74c3c', fontSize: 24 }}>♥</Text>
          </TouchableOpacity>
        </View>
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
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  exploreBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  exploreBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 32,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
  },
  actionBtn: {
    borderRadius: 32,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 12,
  },
});

export default SwipeScreen;
