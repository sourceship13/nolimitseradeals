import React from 'react';
import { View, Text, StyleSheet, FlatList, useColorScheme } from 'react-native';
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
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }}>
      <Toolbar title="Explore" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <FlatList
          data={exploreItems}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: isDarkMode ? '#222' : '#f5f5f5' }]}>  
              <Text style={styles.itemImage}>{item.image}</Text>
              <Text style={styles.itemTitle}>{item.item}</Text>
              <Text style={styles.itemBusiness}>{item.business}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
            </View>
          )}
          contentContainerStyle={styles.grid}
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
  grid: {
    alignItems: 'center',
  },
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 140,
    maxWidth: 160,
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
