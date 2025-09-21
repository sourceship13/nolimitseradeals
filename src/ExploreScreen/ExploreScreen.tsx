import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAuth } from '../libs/hooks/useAuth';
import Toolbar from '../components/Toolbar';

const exploreItems = [
  { id: 1, business: "Ara's Beauty Bar", item: "Free Lipstick", image: "💄", category: "Cosmetics" },
  { id: 2, business: "Ara's Café", item: "Free Coffee", image: "☕", category: "Food" },
  { id: 3, business: "Ara's Gym", item: "Free Dumbbells", image: "🏋️", category: "Fitness" },
  { id: 4, business: "Ara's Electronics", item: "Free Headphones", image: "🎧", category: "Tech" },
  { id: 5, business: "Ara's Bakery", item: "Free Cupcakes", image: "🧁", category: "Food" },
  { id: 6, business: "Ara's Skincare", item: "Free Face Mask", image: "✨", category: "Cosmetics" },
  { id: 7, business: "Ara's Sports", item: "Free Water Bottle", image: "🥤", category: "Fitness" },
  { id: 8, business: "Ara's Gadgets", item: "Free Phone Case", image: "📱", category: "Tech" }
];

const ExploreScreen = ({ navigation }: any) => {
  const { isDarkMode, categories } = useAuth();
  const activeCategories = Object.keys(categories).filter(key => categories[key]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      setError(null);
      try {
        // Replace with your actual AWS endpoint URL
        const response = await fetch('https://f3x2ipn2yf.us-east-1.awsapprunner.com/api/deals/all-v2');
        if (!response.ok) throw new Error('Failed to fetch deals');
        const data = await response.json();
        setDeals(data);
        console.log('Fetched deals:', data);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }}>
      <Toolbar
        title="Explore"
        onBack={() => navigation.goBack()}
        showSettings={true}
        onSettings={() => navigation.navigate('Settings')}
      />
      {/* Top bar for categories */}
      <View style={[styles.topBar, { backgroundColor: isDarkMode ? '#111' : '#f5f5f5', borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#222' : '#eee' }]}> 
        {activeCategories.length === 0 ? (
          <Text style={{ color: isDarkMode ? '#fff' : '#333', fontStyle: 'italic', padding: 8 }}>No categories selected</Text>
        ) : (
          activeCategories.map(cat => (
            <View key={cat} style={[styles.categoryChip, { backgroundColor: isDarkMode ? '#222' : '#fff', borderColor: isDarkMode ? '#444' : '#ddd' }]}> 
              <Text style={{ color: isDarkMode ? '#fff' : '#333', fontWeight: 'bold', textTransform: 'capitalize' }}>{cat}</Text>
            </View>
          ))
        )}
      </View>
      <View style={styles.container}>
        {loading ? (
          <Text style={{ color: isDarkMode ? '#fff' : '#000', textAlign: 'center', marginTop: 32 }}>Loading deals...</Text>
        ) : error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 32 }}>{error}</Text>
        ) : (
          <FlatList
            data={deals}
            keyExtractor={item => item.id?.toString?.() || Math.random().toString()}
            numColumns={2}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: isDarkMode ? '#222' : '#f5f5f5' }]}
                onPress={() => navigation.navigate('DealDetail', { deal: item })}
                activeOpacity={0.8}
              >
                <Text style={styles.itemImage}>{item.image ? item.image : '🛍️'}</Text>
                <Text style={styles.itemBusiness}>{item.business_name}</Text>
                <Text style={styles.itemCategory}>{item.category_name}</Text>
                <Text style={styles.itemCategory}>{item.description}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.grid}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  categoryChip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'center',
  },
  grid: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    margin: 8,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 160,
  },
  itemImage: {
    fontSize: 36,
    marginBottom: 8,
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  itemBusiness: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: '#aaa',
  },
});

export default ExploreScreen;
