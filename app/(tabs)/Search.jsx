import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Keyboard, Image, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { collection, query as firestoreQuery, where, getDocs, orderBy, limit, or } from 'firebase/firestore'
import { db } from '../../Utlis/firebase'
import { router } from 'expo-router'

const SEARCH_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'search' },
  { id: 'articles', label: 'Articles', icon: 'newspaper-outline' },
  { id: 'channels', label: 'Channels', icon: 'people-outline' },
  { id: 'topics', label: 'Topics', icon: 'list-outline' }
]

const Search = () => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestedTopics, setSuggestedTopics] = useState([
    'Technology', 'Politics', 'Health', 'Sports', 'Entertainment'
  ]);

  // Load recent searches from storage on component mount
  // useEffect(() => {
  //   // In a real app, you would load from AsyncStorage
  //   // For this demo, we'll use hardcoded recent searches
  //   setRecentSearches([
  //     'Climate change', 'Coronavirus', 'Local news'
  //   ]);
  // }, []);

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    
    // If the input is empty, clear results
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Debounce search for better performance (wait for user to stop typing)
    if (text.length > 2) {
      setLoading(true);
      const timeoutId = setTimeout(() => {
        performSearch(text);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  // Handle search submission
  const handleSearch = () => {
    Keyboard.dismiss();
    if (searchQuery.trim()) {
      setLoading(true);
      performSearch(searchQuery);
      
      // Save to recent searches (avoiding duplicates)
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev].slice(0, 5));
      }
    }
  };

  // Perform search query in Firestore
  const performSearch = async (searchText) => {
    try {
      setLoading(true);
      const normalizedQuery = searchText.toLowerCase().trim();
      let results = [];
      
      // Search based on active filter
      if (activeFilter === 'all' || activeFilter === 'articles') {
        const articlesRef = collection(db, 'articles');
        
        try {
          // Use a simple query first (title only)
          const articlesQuerySnapshot = await getDocs(
            firestoreQuery(
              articlesRef,
              limit(10)
            )
          );
          
          const articleResults = [];
          
          // Filter results client-side
          articlesQuerySnapshot.forEach(doc => {
            const data = doc.data();
            const title = data.title || '';
            
            // Simple includes check - you can make this more sophisticated
            if (title.toLowerCase().includes(normalizedQuery)) {
              articleResults.push({
                id: doc.id,
                type: 'article',
                title: data.title || 'Untitled',
                description: data.description || '',
                image: data.coverImage || 'https://via.placeholder.com/100',
                category: data.category || 'General',
                createdAt: data.createdAt?.toDate?.() || new Date(),
                content: data.content || ''
              });
            }
          });
          
          results = [...results, ...articleResults];
        } catch (firestoreError) {
          console.error("Firestore query error:", firestoreError);
          // Continue with other searches even if this one fails
        }
      }
      
      if (activeFilter === 'all' || activeFilter === 'channels') {
        // Demo channels search (in a real app, this would query a channels collection)
        const channelResults = [
          {
            id: 'channel1',
            type: 'channel',
            title: 'Tech News Channel',
            description: 'The latest in technology news and updates',
            image: 'https://res.cloudinary.com/dvd9p28iu/image/upload/v1680000000/banners/tech_channel.jpg',
            subscribers: 12500
          },
          {
            id: 'channel2',
            type: 'channel',
            title: 'Sports Updates',
            description: 'Live scores, highlights and commentary',
            image: 'https://res.cloudinary.com/dvd9p28iu/image/upload/v1680000000/banners/sports_channel.jpg',
            subscribers: 8300
          }
        ].filter(channel => 
          channel.title.toLowerCase().includes(normalizedQuery) || 
          channel.description.toLowerCase().includes(normalizedQuery)
        );
        
        results = [...results, ...channelResults];
      }
      
      if (activeFilter === 'all' || activeFilter === 'topics') {
        // Demo topics search
        const allTopics = [
          'Politics', 'Technology', 'Health', 'Business', 'Entertainment', 
          'Sports', 'Science', 'Education', 'World News', 'Environment', 
          'Finance', 'Lifestyle', 'Travel', 'Food', 'Automotive'
        ];
        
        const topicResults = allTopics
          .filter(topic => topic.toLowerCase().includes(normalizedQuery))
          .map(topic => ({
            id: `topic-${topic.toLowerCase().replace(/\s/g, '-')}`,
            type: 'topic',
            title: topic,
            image: `https://res.cloudinary.com/dvd9p28iu/image/upload/v1680000000/topics/${topic.toLowerCase().replace(/\s/g, '_')}.jpg`
          }));
        
        results = [...results, ...topicResults];
      }
      
      setSearchResults(results);
      setLoading(false);
    } catch (error) {
      console.error("Error searching:", error);
      setLoading(false);
      setSearchResults([]);
    }
  };

  // Navigate to article/channel/topic
  const handleResultPress = (item) => {
    switch (item.type) {
      case 'article':
        router.push({
          pathname: "/ArticleDetail",
          params: {
            id: item.id,
            title: item.title,
            content: item.content || "",
            image: item.image,
            category: item.category || "General"
          }
        });
        break;
      case 'channel':
        // Navigate to channel page
        console.log(`Navigate to channel: ${item.id}`);
        break;
      case 'topic':
        // Set category filter in Articles page
        router.push({
          pathname: "/(tabs)/Articles",
          params: { category: item.title }
        });
        break;
      default:
        break;
    }
  };

  // Apply search filter
  const applyFilter = (filterId) => {
    setActiveFilter(filterId);
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  // Handle recent search tap
  const handleRecentSearch = (query) => {
    setSearchQuery(query);
    performSearch(query);
  };

  // Handle topic tap
  const handleTopicTap = (topic) => {
    router.push({
      pathname: "/(tabs)/Articles",
      params: { category: topic }
    });
  };

  // Render a search result item
  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={[styles.resultItem, { borderBottomColor: theme.border }]}
      onPress={() => handleResultPress(item)}
    >
      {item.image ? (
        <Image 
          source={{ uri: item.image }} 
          style={styles.resultImage} 
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholderImage, { backgroundColor: theme.accent + '40' }]}>
          <Ionicons 
            name={item.type === 'article' ? 'newspaper' : item.type === 'channel' ? 'people' : 'list'} 
            size={24} 
            color={theme.accent} 
          />
        </View>
      )}
      
      <View style={styles.resultContent}>
        <Text 
          style={[styles.resultTitle, { color: theme.text }]} 
          numberOfLines={1}
        >
          {item.title}
        </Text>
        
        <View style={styles.resultMeta}>
          {item.type === 'article' && (
            <>
              <Text style={[styles.resultCategory, { color: theme.accent }]}>
                {item.category}
              </Text>
              <Text style={[styles.resultDetail, { color: theme.textSecondary }]}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </>
          )}
          
          {item.type === 'channel' && (
            <Text style={[styles.resultDetail, { color: theme.textSecondary }]}>
              {item.subscribers.toLocaleString()} subscribers
            </Text>
          )}
          
          {item.type === 'topic' && (
            <Text style={[styles.resultDetail, { color: theme.textSecondary }]}>
              Category
            </Text>
          )}
        </View>
        
        {item.description && (
          <Text 
            style={[styles.resultDescription, { color: theme.textSecondary }]} 
            numberOfLines={1}
          >
            {item.description}
          </Text>
        )}
      </View>
      
      <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Search</Text>
        <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            placeholder="Search for Articles, Channels, Topics"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {SEARCH_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterTab,
                activeFilter === category.id && [styles.activeFilterTab, { backgroundColor: theme.accent + '30' }]
              ]}
              onPress={() => applyFilter(category.id)}
            >
              <Ionicons 
                name={category.icon} 
                size={16} 
                color={activeFilter === category.id ? theme.accent : theme.textSecondary}
                style={styles.filterIcon} 
              />
              <Text 
                style={[
                  styles.filterText, 
                  { 
                    color: activeFilter === category.id ? theme.accent : theme.textSecondary,
                    fontWeight: activeFilter === category.id ? '600' : 'normal'
                  }
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      )}
      
      {/* Search Results */}
      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={item => `${item.type}-${item.id}`}
          contentContainerStyle={styles.resultsContainer}
        />
      ) : searchQuery.trim() && !loading ? (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.noResultsText, { color: theme.text }]}>
            No results found for "{searchQuery}"
          </Text>
          <Text style={[styles.noResultsSubtext, { color: theme.textSecondary }]}>
            Try different keywords or browse suggested topics
          </Text>
        </View>
      ) : !loading && (
        <View style={styles.suggestionsContainer}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Searches</Text>
                <TouchableOpacity onPress={() => setRecentSearches([])}>
                  <Text style={[styles.clearButton, { color: theme.accent }]}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentSearches}>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.recentSearch, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                    onPress={() => handleRecentSearch(search)}
                  >
                    <Ionicons name="time-outline" size={14} color={theme.textSecondary} style={styles.recentIcon} />
                    <Text style={[styles.recentText, { color: theme.text }]} numberOfLines={1}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {/* Suggested Topics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Suggested Topics</Text>
            <View style={styles.topicsGrid}>
              {suggestedTopics.map((topic, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.topicItem, { backgroundColor: theme.cardBackground }]}
                  onPress={() => handleTopicTap(topic)}
                >
                  <Text style={[styles.topicText, { color: theme.text }]}>{topic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default Search

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginTop: 10,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 15,
    marginBottom: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterTab: {
    borderRadius: 16,
  },
  filterIcon: {
    marginRight: 5,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    paddingTop: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginRight: 8,
  },
  resultDetail: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  resultDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 8,
  },
  suggestionsContainer: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  clearButton: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  recentSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  recentIcon: {
    marginRight: 5,
  },
  recentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    maxWidth: 120,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  topicItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  topicText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  }
})