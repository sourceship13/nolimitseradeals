import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAuth } from '../libs/hooks/useAuth';
import Toolbar from '../components/Toolbar';

const savedDeals = [
  { id: 1, business: "Ara's Pizza", item: "Free Margherita Pizza", status: "saved", image: "🍕" },
  { id: 2, business: "Ara's Smoothies", item: "Free Protein Shake", status: "redeemed", image: "🥤" },
  { id: 3, business: "Ara's Books", item: "Free Notebook", status: "saved", image: "📚" }
];

const SavedDealsScreen = ({ navigation }: any) => {
  const { isDarkMode } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }}>
      <Toolbar
        title="My Deals"
        onBack={() => navigation.goBack()}
        showSettings={true}
        onSettings={() => navigation.navigate('Settings')}
      />
      <View style={styles.container}>
        <FlatList
          data={savedDeals}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: isDarkMode ? '#222' : '#f5f5f5' }]}>  
              <Text style={styles.dealImage}>{item.image}</Text>
              <Text style={styles.dealTitle}>{item.item}</Text>
              <Text style={styles.dealBusiness}>{item.business}</Text>
              {item.status === 'saved' ? (
                <TouchableOpacity style={[styles.button, { backgroundColor: isDarkMode ? '#fff' : '#000' }]}>
                  <Text style={{ color: isDarkMode ? '#000' : '#fff', fontWeight: 'bold' }}>Redeem Now</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.redeemed}>Redeemed</Text>
              )}
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  list: {
    alignItems: 'center',
  },
  card: {
    width: 280,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  dealImage: {
    fontSize: 36,
    marginBottom: 8,
  },
  dealTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  dealBusiness: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  button: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    width: 120,
  },
  redeemed: {
    color: '#4ECDC4',
    fontWeight: 'bold',
    marginTop: 8,
  },
});

export default SavedDealsScreen;
