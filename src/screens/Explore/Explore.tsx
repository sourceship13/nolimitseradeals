import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../libs/hooks/useAuth';
import { getColors } from '../../libs/colors';
import Toolbar from '../../components/Toolbar';
import ApiConfig from '../../libs/utils/api.utils';

const ExploreScreen = ({ navigation }: any) => {
  const { isDarkMode, categories, availableCategories } = useAuth();
  const colors = getColors(isDarkMode);
  
  // Filter available categories to show only the ones the user has enabled
  const activeCategories = availableCategories.filter(cat => categories[cat.slug]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch deals
    const fetchDeals = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${ApiConfig.apiURL}/deals/all-v2`);
        if (!response.ok) throw new Error('Failed to fetch deals');
        const result = await response.json();
        
        // Handle both direct array and object with data property
        const dealsData = result.data || result;
        setDeals(Array.isArray(dealsData) ? dealsData : []);
        console.log('Fetched deals count:', dealsData.length);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
        console.error('Error fetching deals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // Filter deals by selectedCategory if set
  const filteredDeals = selectedCategory
    ? deals.filter(deal => {
        // Match against category_name since that's what's in your API response
        const dealCategory = (deal.category_name || '').toLowerCase();
        const selectedCat = availableCategories.find(cat => cat.slug === selectedCategory);
        return selectedCat && dealCategory === selectedCat.name.toLowerCase();
      })
    : deals;

  // Group featured deals (priority_score > 0) first
  const sortedDeals = [...filteredDeals].sort((a, b) => {
    // Featured deals first (higher priority score = higher position)
    if (a.priority_score !== b.priority_score) {
      return (b.priority_score || 0) - (a.priority_score || 0);
    }
    return 0;
  });

  const renderDealCard = ({ item }: { item: any }) => {
    const isFeatured = item.priority_score && item.priority_score > 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.card, 
          { 
            backgroundColor: colors.card,
            borderColor: isFeatured ? colors.primary : 'transparent',
            borderWidth: isFeatured ? 2 : 0,
          }
        ]}
        onPress={() => navigation.navigate('DealDetail', { deal: item })}
        activeOpacity={0.8}
      >
        {isFeatured ? (
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.featuredText, { color: colors.background }]}>Featured</Text>
          </View>
        ) : null}
        <Text style={styles.itemImage}>
          {item.image_url ? '🖼️' : getCategoryEmoji(item.category_name)}
        </Text>
        <Text style={[styles.itemBusiness, { color: colors.text }]} numberOfLines={1}>
          {item.business_name}
        </Text>
        <Text style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.dealDetails}>
          {item.deal_type ? (
            <Text style={[styles.dealType, { color: colors.primary }]}>
              {formatDealType(item.deal_type)}
            </Text>
          ) : null}
          {item.min_shares_required ? (
            <Text style={[styles.sharesRequired, { color: colors.textPlaceholder }]}>
              {item.min_shares_required} shares
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const getCategoryEmoji = (categoryName: string) => {
    const emojiMap: Record<string, string> = {
      'Food & Dining': '🍽️',
      'Coffee & Beverages': '☕',
      'Automotive': '🚗',
      'Beauty & Wellness': '💅',
      'Electronics': '📱',
      'Retail & Shopping': '🛍️',
      'Bakery & Desserts': '🧁',
      'Health & Fitness': '💪',
      'Home Services': '🏠',
    };
    return emojiMap[categoryName] || '🎁';
  };

  const formatDealType = (type: string) => {
    const typeMap: Record<string, string> = {
      'free_item': 'Free Item',
      'bogo': 'BOGO',
      'percentage': 'Discount',
      'fixed_amount': 'Save $',
    };
    return typeMap[type] || type;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Toolbar
        title="Explore"
        onBack={() => navigation.goBack()}
        showSettings={true}
        onSettings={() => navigation.navigate('Settings')}
      />
      
      {/* Category Filter Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }]}> 
        {activeCategories.length === 0 ? (
          <Text style={{ color: colors.text, fontStyle: 'italic', padding: 8 }}>
            No categories selected. Go to Settings to enable categories.
          </Text>
        ) : (
          <FlatList
            data={[{ id: 'all', name: 'All', slug: null }, ...activeCategories]}
            keyExtractor={cat => cat.id || 'all'}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: cat }) => {
              const isSelected = cat.slug === null 
                ? selectedCategory === null 
                : selectedCategory === cat.slug;
              
              return (
                <TouchableOpacity
                  onPress={() => setSelectedCategory(cat.slug)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected 
                        ? (cat.color_hex || colors.primary) 
                        : colors.chip,
                      borderColor: isSelected 
                        ? (cat.color_hex || colors.primary) 
                        : colors.borderStrong,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: isSelected ? colors.background : colors.text,
                      fontWeight: 'bold',
                      fontSize: 12,
                    }}
                  >
                    {cat.name}
                  </Text>
                  {cat.active_deal_count ? (
                    <Text
                      style={{
                        color: isSelected ? colors.background : colors.textPlaceholder,
                        fontSize: 10,
                        marginLeft: 4,
                      }}
                    >
                      ({cat.active_deal_count})
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingVertical: 2 }}
          />
        )}
      </View>

      {/* Deals List */}
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.text, marginTop: 12 }}>Loading deals...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={{ color: colors.error, textAlign: 'center' }}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setError(null);
                // Re-fetch deals
                fetchDeals();
              }}
            >
              <Text style={{ color: colors.background }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : sortedDeals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              {selectedCategory ? `No deals in this category` : 'No deals available'}
            </Text>
            <Text style={{ color: colors.textPlaceholder, marginTop: 8, textAlign: 'center' }}>
              {selectedCategory ? 'Try selecting a different category' : 'Check back later for new deals!'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {sortedDeals.length} {sortedDeals.length === 1 ? 'deal' : 'deals'} available
              {selectedCategory && ' in ' + activeCategories.find(c => c.slug === selectedCategory)?.name}
            </Text>
            <FlatList
              data={sortedDeals}
              keyExtractor={item => item.id?.toString?.() || `${item.business_name}-${item.description}-${Math.random()}`}
              numColumns={2}
              renderItem={renderDealCard}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.row}
            />
          </>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resultsCount: {
    fontSize: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  grid: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    padding: 12,
    maxWidth: '48%',
    minHeight: 140,
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  itemImage: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  itemBusiness: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  itemDescription: {
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 14,
  },
  dealDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  dealType: {
    fontSize: 10,
    fontWeight: '600',
  },
  sharesRequired: {
    fontSize: 9,
  },
})

export default ExploreScreen;