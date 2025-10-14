import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import { useAuth } from '../../libs/hooks/useAuth';
import { getColors } from '../../libs/colors';
import Toolbar from '../../components/Toolbar';
import { iOSUIKit } from 'react-native-typography';



const SavedDealsScreen = ({ navigation }: any) => {
  const { isDarkMode, deals } = useAuth();
  const colors = getColors(isDarkMode);
  const [isLoading, setIsLoading] = React.useState(true);
  const [heartedDeals, setHeartedDeals] = React.useState<any[]>([]);

  useEffect(() => {
    console.log('=================================');
    console.log(deals);
    var heartedDeals = deals.filter(deal => deal.is_hearted
    );
    console.log('❤️ SavedDeals: Loaded hearted deals:', heartedDeals);
    setHeartedDeals(heartedDeals);
    setIsLoading(false);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Toolbar
        title="My Deals"
        showSettings={true}
        onSettings={() => navigation.navigate('Settings')}
      />
      <View style={styles.container}>
        {isLoading ? (
          <Text style={[iOSUIKit.body, { color: colors.text, textAlign: 'center' }]}>Loading saved deals...</Text>
        ) : heartedDeals.length === 0 ? (
          <Text style={[iOSUIKit.body, { color: colors.text, textAlign: 'center' }]}>No saved deals yet.</Text>
        ) : (
          <FlatList
            data={heartedDeals}
            keyExtractor={item => (item.id || item.deal_id).toString()}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: colors.card }]}>  
                {/* Show real deal image if available, else fallback to business image, else emoji */}
                {item.deal_images && item.deal_images.length > 0 ? (
                  <View>
                    <ImageBackground
                      source={{ uri: item.deal_images[0].image_url }}
                      style={[styles.dealImage, { justifyContent: 'center', alignItems: 'center' }]}
                      imageStyle={{ borderRadius: 8 }}
                    />
                  </View>
                ) : item.deal_image_url ? (
                  <View>
                    <ImageBackground
                      source={{ uri: item.deal_image_url }}
                      style={[styles.dealImage, { justifyContent: 'center', alignItems: 'center' }]}
                      imageStyle={{ borderRadius: 8 }}
                    />
                  </View>
                ) : item.business_images && item.business_images.length > 0 ? (
                  <View>
                    <ImageBackground
                      source={{ uri: item.business_images[0].image_url }}
                      style={[styles.dealImage, { justifyContent: 'center', alignItems: 'center' }]}
                      imageStyle={{ borderRadius: 8 }}
                    />
                  </View>
                ) : (
                  <Text style={styles.dealImage}>{item.image ? item.image : '💖'}</Text>
                )}
                <Text style={[styles.dealTitle, { color: colors.text }]}>{item.deal_title || item.item || item.offer || item.description || 'Saved Deal'}</Text>
                <Text style={[styles.dealBusiness, { color: colors.disabled }]}>{item.business_name || item.business || ''}</Text>
                <Text style={[styles.dealBusiness, { color: colors.secondary }]}>{item.category_name || ''}</Text>
                <Text style={[styles.dealBusiness, { color: colors.text }]}>{item.description || ''}</Text>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.text }]}
                  onPress={() => navigation.navigate('Redemption', { deal: item })}
                >
                  <Text style={[iOSUIKit.subhead, { color: colors.background, fontWeight: 'bold' }]}>Redeem Now</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingBottom: 80, // Add enough padding to sit above bottom nav bar
  },
  title: StyleSheet.flatten([
    iOSUIKit.largeTitleEmphasized,
    {
      marginBottom: 16,
      alignSelf: 'center',
    }
  ]),
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
    width: 160,
    height: 120,
  },
  dealTitle: StyleSheet.flatten([
    iOSUIKit.callout,
    {
      fontWeight: 'bold',
      marginBottom: 4,
    }
  ]),
  dealBusiness: StyleSheet.flatten([
    iOSUIKit.caption2,
    {
      marginBottom: 8,
    }
  ]),
  button: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    width: 120,
  },
  redeemed: StyleSheet.flatten([
    iOSUIKit.subhead,
    {
      fontWeight: 'bold',
      marginTop: 8,
    }
  ]),
});

export default SavedDealsScreen;
