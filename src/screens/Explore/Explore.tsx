import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../libs/hooks/useAuth';
import { getColors } from '../../libs/colors';
import Toolbar from '../../components/Toolbar';
import ApiService from '../../services/api.service';
import ApiConfig from '../../libs/utils/api.utils';

const ExploreScreen = ({ navigation }: any) => {
  const { isDarkMode, categories, availableCategories } = useAuth();
  const colors = getColors(isDarkMode);
  
  // Filter available categories to show only the ones the user has enabled
  // If no categories are set (empty object), show all available categories
  const activeCategories = Object.keys(categories).length === 0 
    ? availableCategories 
    : availableCategories.filter(cat => categories[cat.slug]);
  
  // Debug category filtering
  console.log('🔍 Explore Debug - availableCategories:', availableCategories.length, availableCategories.map(c => c.slug));
  console.log('🔍 Explore Debug - categories object:', categories);
  console.log('🔍 Explore Debug - activeCategories:', activeCategories.length, activeCategories.map(c => c.slug));
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch deals
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await ApiService.getDeals();
        
        // Handle both direct array and object with data property
        const dealsData = result.data || result;
        setDeals(Array.isArray(dealsData) ? dealsData : []);
        console.log('Fetched deals count:', Array.isArray(dealsData) ? dealsData.length : (dealsData as any)?.data?.length || 0);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
        console.error('Error fetching deals:', err);
      } finally {
        setLoading(false);
      }
    };

  // Filter deals by selectedCategory if set
  const filteredDeals = selectedCategory
    ? deals.filter(deal => {
        // Match against category_name since that's what's in your API response
        const dealCategory = (deal.category_name || '').toLowerCase();
        const selectedCat = availableCategories.find(cat => cat.slug === selectedCategory);
        return selectedCat && dealCategory === selectedCat.name.toLowerCase();
      })
    : deals;

  // Sort deals: Premium first, then featured deals (priority_score > 0), then regular deals
  const sortedDeals = [...filteredDeals].sort((a, b) => {
    // Premium deals first (is_premium = true)
    if (a.is_premium_business !== b.is_premium_business) {
      return b.is_premium_business ? 1 : -1;
    }
    // Then featured deals (higher priority score = higher position)
    if (a.priority_score !== b.priority_score) {
      return (b.priority_score || 0) - (a.priority_score || 0);
    }
    return 0;
  });

  const renderDealCard = ({ item }: { item: any }) => {
    const isFeatured = item.priority_score && item.priority_score > 0;
    const isPremium = item.is_premium === true;
    
    return (
      <TouchableOpacity
        style={[
          styles.card,
          isDarkMode ? styles.glassCardDark : styles.glassCard, 
          { 
            backgroundColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.06)' 
              : 'rgba(255, 255, 255, 0.15)',
            borderColor: isPremium
              ? '#FF8C00' // Orange border for premium deals
              : isFeatured 
                ? colors.primary 
                : isDarkMode 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(0, 0, 0, 0.05)',
            borderWidth: isPremium ? 3 : (isFeatured ? 2 : 1),
          }
        ]}
        onPress={() => navigation.navigate('DealDetail', { deal: item })}
        activeOpacity={0.7}
      >
        {/* Gradient overlays temporarily removed */}
        
        {/* Subtle glow effect for dark mode - much more transparent */}
        {isDarkMode && (
          <>
            <View style={[
              styles.innerGlow,
              {
                borderColor: 'rgba(255, 255, 255, 0.12)',
              }
            ]} />
            <View style={[
              styles.shimmerEffect,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.015)',
              }
            ]} />
          </>
        )}
        
        {isPremium ? (
          <View style={[
            styles.premiumBadge, 
            { 
              backgroundColor: '#FF8C00',
              borderWidth: 1,
              borderColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.3)'
                : '#FF7700', 
            }
          ]}>
            <Text style={[styles.premiumText, { color: '#FFFFFF', fontSize:24 }]}>PREMIUM</Text>
          </View>
        ) : isFeatured ? (
          <View style={[
            styles.featuredBadge, 
            { 
              backgroundColor: isDarkMode 
                ? colors.primary + 'E6' // More opaque in dark mode
                : colors.primary + '95',
              borderWidth: 1,
              borderColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.3)'
                : colors.primary + '40'
            }
          ]}>
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
          <View style={{ padding: 8, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontStyle: 'italic', textAlign: 'center' }}>
              No categories available. 
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Settings')}
              style={{ marginTop: 4 }}
            >
              <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>
                Go to Settings to manage categories
              </Text>
            </TouchableOpacity>
          </View>
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
                        ? ((cat as any).color_hex || colors.primary) 
                        : colors.chip,
                      borderColor: isSelected 
                        ? ((cat as any).color_hex || colors.primary) 
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
                  {(cat as any).active_deal_count ? (
                    <Text
                      style={{
                        color: isSelected ? colors.background : colors.textPlaceholder,
                        fontSize: 10,
                        marginLeft: 4,
                      }}
                    >
                      ({(cat as any).active_deal_count})
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
  glassCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  glassCardDark: {
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    opacity: 0.8,
    zIndex: 0,
  },
  gradientMiddle: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    height: '60%',
    borderRadius: 6,
    opacity: 0.6,
    zIndex: 0,
  },

  innerGlow: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: 11,
    borderWidth: 1,
    zIndex: 0,
  },
  shimmerEffect: {
    position: 'absolute',
    top: -10,
    left: '20%',
    width: '60%',
    height: '120%',
    borderRadius: 12,
    transform: [{ rotate: '25deg' }],
    opacity: 0.5,
    zIndex: 0,
  },
  featuredBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 4,
  },
  featuredText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  premiumBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  itemImage: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
    zIndex: 1,
  },
  itemBusiness: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    zIndex: 1,
  },
  itemDescription: {
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 14,
    zIndex: 1,
  },
  dealDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    zIndex: 1,
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