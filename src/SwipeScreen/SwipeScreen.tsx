import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../libs/hooks/useAuth';
import Toolbar from '../components/Toolbar';


const PLACEHOLDER_DEAL = {
  id: 0,
  business: 'No Deals',
  offer: 'No deals available',
  image: '🛍️',
  location: '',
  category: '',
  expires: '',
  backgroundColor: '#888'
};

const SwipeScreen = ({ navigation }: any) => {

  const { isDarkMode } = useAuth();
  const [deals, setDeals] = useState<any[]>([]);
  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://f3x2ipn2yf.us-east-1.awsapprunner.com/api/deals/all-v2');
        if (!response.ok) throw new Error('Failed to fetch deals');
        const data = await response.json();
        setDeals(data);
        console.log('Fetched deals:', data);
        setCurrentDealIndex(0);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  const currentDeal = deals.length > 0 ? deals[currentDealIndex] : PLACEHOLDER_DEAL;

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      navigation.navigate('DealDetail', { deal: currentDeal });
    } else {
      setCurrentDealIndex((prev) => deals.length > 0 ? (prev + 1) % deals.length : 0);
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
        {loading ? (
          <Text style={{ color: isDarkMode ? '#fff' : '#000', textAlign: 'center', marginTop: 32 }}>Loading deals...</Text>
        ) : error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 32 }}>{error}</Text>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: currentDeal.backgroundColor || '#FF6B35' }]}>  
              <Text style={styles.dealImage}>{currentDeal.image ? currentDeal.image : '🛍️'}</Text>
              <Text style={styles.dealBusiness}>{currentDeal.business || currentDeal.business_name || ''}</Text>
              <Text style={styles.dealOffer}>{currentDeal.description || currentDeal.descrption || currentDeal.description || ''}</Text>
              <Text style={styles.dealLocation}>{currentDeal.category_name || currentDeal.category_name || ''}</Text>
              <Text style={styles.dealExpires}>{currentDeal.expires || currentDeal.expiry || ''}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#222' : '#eee' }]} onPress={() => handleSwipe('left')}>
                <Text style={{ color: '#e74c3c', fontSize: 24 }}>✗</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDarkMode ? '#fff' : '#000' }]} onPress={() => handleSwipe('right')}>
                <Text style={{ color: '#e74c3c', fontSize: 24 }}>♥</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
