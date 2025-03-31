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
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../Utlis/firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const SavedNews = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [savedShorts, setSavedShorts] = useState([]);
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
          querySnapshot.docs.map(async (doc) => {
            const shortRef = doc(db, 'shorts', doc.data().shortId);
            const shortDoc = await getDocs(shortRef);
            return {
              id: doc.id,
              ...shortDoc.data(),
              savedAt: doc.data().savedAt?.toDate(),
            };
          })
        );

        setSavedShorts(shortsData);
      } else {
        // Load saved articles (implement when needed)
        setSavedShorts([]);
      }
    } catch (error) {
      console.error('Error loading saved content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savedShorts', itemId));
      setSavedShorts(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error unsaving content:', error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.itemContainer, { backgroundColor: theme.cardBackground }]}
      onPress={() => router.push(`/screens/Shorts/${item.id}`)}
    >
      <Image 
        source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/150' }}
        style={styles.thumbnail}
      />
      <View style={styles.itemContent}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.metaInfo}>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {item.savedAt?.toLocaleDateString()}
          </Text>
          <TouchableOpacity 
            onPress={() => handleUnsave(item.id)}
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading saved content...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab,
            activeTab === 'shorts' && { borderBottomColor: theme.accent }
          ]}
          onPress={() => setActiveTab('shorts')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'shorts' ? theme.accent : theme.textSecondary }
          ]}>Saved Shorts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab,
            activeTab === 'articles' && { borderBottomColor: theme.accent }
          ]}
          onPress={() => setActiveTab('articles')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'articles' ? theme.accent : theme.textSecondary }
          ]}>Saved Articles</Text>
        </TouchableOpacity>
      </View>

      {savedShorts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No saved {activeTab === 'shorts' ? 'shorts' : 'articles'} yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedShorts}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
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
  },
  itemContent: {
    flex: 1,
    padding: 12,
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