import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAuth } from '../libs/hooks/useAuth';
import { getColors } from '../libs/colors';
import Toolbar from '../components/Toolbar';

const savedDeals = [
  { id: 1, business: "Ara's Pizza", item: "Free Margherita Pizza", status: "saved", image: "🍕" },
  { id: 2, business: "Ara's Smoothies", item: "Free Protein Shake", status: "redeemed", image: "🥤" },
  { id: 3, business: "Ara's Books", item: "Free Notebook", status: "saved", image: "📚" }
];

const SavedDealsScreen = ({ navigation }: any) => {
  const { isDarkMode } = useAuth();
  const colors = getColors(isDarkMode);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
            <View style={[styles.card, { backgroundColor: colors.card }]}>  
              <Text style={styles.dealImage}>{item.image}</Text>
              <Text style={[styles.dealTitle, { color: colors.text }]}>{item.item}</Text>
              <Text style={[styles.dealBusiness, { color: colors.disabled }]}>{item.business}</Text>
              {item.status === 'saved' ? (
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.text }]}> 
                  <Text style={{ color: colors.background, fontWeight: 'bold' }}>Redeem Now</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.redeemed, { color: colors.secondary }]}>Redeemed</Text>
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
    fontWeight: 'bold',
    marginTop: 8,
  },
});

export default SavedDealsScreen;
