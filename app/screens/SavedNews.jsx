import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../Utlis/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const SavedNews = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shorts'); // 'shorts' or 'articles'

  useEffect(() => {
    loadSavedContent();
  }, [activeTab]);

  const loadSavedContent = async () => {
    try {
      setLoading(true);
      if (!user) return;

      if (activeTab === 'shorts') {
        // Load saved shorts
        const savedShortsRef = collection(db, 'users', user.uid, 'savedShorts');
        const querySnapshot = await getDocs(savedShortsRef);
        
        const shortsData = await Promise.all(
          querySnapshot.docs.map(async (document) => {
            // Use getDoc with doc reference properly
            const shortId = document.data().shortId;
            const shortRef = doc(db, 'shorts', shortId);
            const shortDoc = await getDoc(shortRef);
            
            if (shortDoc.exists()) {
              return {
                savedId: document.id, // Store the saved document ID for deletion
                id: shortId,
                contentType: 'short',
                ...shortDoc.data(),
                savedAt: document.data().savedAt?.toDate() || new Date(),
              };
            }
            return null;
          })
        );

        // Filter out null values (shorts that might have been deleted)
        setSavedItems(shortsData.filter(item => item !== null));
      } else {
        // Load saved articles
        const savedArticlesRef = collection(db, 'users', user.uid, 'savedArticles');
        const querySnapshot = await getDocs(savedArticlesRef);
        
        const articlesData = querySnapshot.docs.map(document => {
          const data = document.data();
          return {
            savedId: document.id,
            id: data.articleId,
            contentType: 'article',
            title: data.title,
            description: data.description,
            coverImage: data.coverImage,
            category: data.category,
            savedAt: data.savedAt?.toDate() || new Date(),
          };
        });
        
        setSavedItems(articlesData);
      }
    } catch (error) {
      console.error('Error loading saved content:', error);
      setSavedItems([]); // Reset on error
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (savedId) => {
    try {
      const collectionName = activeTab === 'shorts' ? 'savedShorts' : 'savedArticles';
      await deleteDoc(doc(db, 'users', user.uid, collectionName, savedId));
      setSavedItems(prev => prev.filter(item => item.savedId !== savedId));
    } catch (error) {
      console.error('Error unsaving content:', error);
    }
  };

  const handleBackPress = () => {
    router.push('/(tabs)/Account');
  };

  const handleItemPress = (item) => {
    if (item.contentType === 'short') {
      router.push(`/screens/Shorts/${item.id}`);
    } else {
      // Navigate to article with all necessary data
      router.push({
        pathname: '/screens/ArticleDetail',
        params: {
          id: item.id,
          title: item.title,
          description: item.description,
          coverImage: item.coverImage,
          category: item.category
        }
      });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.itemContainer, { backgroundColor: theme.cardBackground }]}
      onPress={() => handleItemPress(item)}
    >
      <Image 
        source={{ 
          uri: item.coverImage || 
               item.thumbnailUrl || 
               item.videoUrl || 
               'https://via.placeholder.com/150'
        }}
        style={styles.thumbnail}
      />
      <View style={styles.itemContent}>
        <View style={styles.categoryContainer}>
          <Text style={[styles.category, { 
            color: theme.accent, 
            fontFamily: theme.font,
            backgroundColor: theme.accent + '15', // Semi-transparent accent color
          }]}>
            {item.contentType === 'short' ? 'SHORT' : item.category?.toUpperCase() || 'ARTICLE'}
          </Text>
        </View>
        
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.titleFont }]} numberOfLines={2}>
          {item.title || 'Untitled Content'}
        </Text>
        
        <Text style={[styles.description, { color: theme.textSecondary, fontFamily: theme.font }]} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>
        
        <View style={styles.metaInfo}>
          <Text style={[styles.date, { color: theme.textSecondary, fontFamily: theme.font }]}>
            {item.savedAt?.toLocaleDateString() || 'Recently saved'}
          </Text>
          <TouchableOpacity 
            onPress={() => handleUnsave(item.savedId)}
            style={styles.unsaveButton}
          >
            <Ionicons name="bookmark" size={20} color={theme.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: theme.titleFont }]}>Saved Content</Text>
          <View style={{width: 24}} />
        </View>
        
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text, fontFamily: theme.font }]}>Loading saved content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: theme.titleFont }]}>Saved Content</Text>
        <View style={{width: 24}} />
      </View>
      
      <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={[
            styles.tab,
            activeTab === 'shorts' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('shorts')}
        >
          <Text style={[
            styles.tabText,
            { 
              color: activeTab === 'shorts' ? theme.accent : theme.textSecondary,
              fontFamily: theme.titleFont
            }
          ]}>Saved Shorts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab,
            activeTab === 'articles' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('articles')}
        >
          <Text style={[
            styles.tabText,
            { 
              color: activeTab === 'articles' ? theme.accent : theme.textSecondary,
              fontFamily: theme.titleFont
            }
          ]}>Saved Articles</Text>
        </TouchableOpacity>
      </View>

      {savedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary, fontFamily: theme.font }]}>
            No saved {activeTab === 'shorts' ? 'shorts' : 'articles'} yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedItems}
          renderItem={renderItem}
          keyExtractor={item => item.savedId}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: 120,
    height: 120,
    backgroundColor: '#ddd',
  },
  itemContent: {
    flex: 1,
    padding: 12,
  },
  categoryContainer: {
    marginBottom: 6,
  },
  category: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
  },
  unsaveButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default SavedNews; 