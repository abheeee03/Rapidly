import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { db } from '../../Utlis/firebase'
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

const { width, height } = Dimensions.get('window')

const ArticleDetail = () => {
  const { theme } = useTheme()
  const { user } = useAuth()
  const params = useLocalSearchParams() || {}
  const [isSaved, setIsSaved] = useState(false)
  const [savedDocId, setSavedDocId] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Parse article data from params with null checks
  const article = {
    id: params.id || 'unknown',
    title: params.title || 'Article Title',
    description: params.description || 'No description available',
    content: params.content || 'No content available',
    coverImage: params.coverImage || 'https://via.placeholder.com/800x400?text=No+Image',
    category: params.category || 'News',
    createdAt: params.createdAt || null,
    likes: parseInt(params.likes || '0'),
    views: parseInt(params.views || '0'),
    sourceIndex: params.sourceIndex
  }
  
  // Check if article is saved on component mount
  useEffect(() => {
    if (user && article.id !== 'unknown') {
      checkIfArticleSaved();
    } else {
      setLoading(false);
    }
  }, [user, article.id]);

  // Check if article is already saved by this user
  const checkIfArticleSaved = async () => {
    try {
      if (!user) return;
      
      const savedArticlesRef = collection(db, 'users', user.uid, 'savedArticles');
      const q = query(savedArticlesRef, where('articleId', '==', article.id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setIsSaved(true);
        setSavedDocId(querySnapshot.docs[0].id);
      }
    } catch (error) {
      console.error('Error checking if article is saved:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle save/unsave article
  const handleSaveArticle = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to save articles');
      return;
    }

    try {
      if (isSaved) {
        // Unsave article
        await deleteDoc(doc(db, 'users', user.uid, 'savedArticles', savedDocId));
        setIsSaved(false);
        setSavedDocId(null);
        Alert.alert('Unsaved', 'Article has been removed from your saved collection');
      } else {
        // Save article
        const savedArticlesRef = collection(db, 'users', user.uid, 'savedArticles');
        const docRef = await addDoc(savedArticlesRef, {
          articleId: article.id,
          title: article.title,
          description: article.description,
          coverImage: article.coverImage,
          category: article.category,
          savedAt: serverTimestamp()
        });
        
        setIsSaved(true);
        setSavedDocId(docRef.id);
        Alert.alert('Saved', 'Article has been saved to your collection');
      }
    } catch (error) {
      console.error('Error saving/unsaving article:', error);
      Alert.alert('Error', 'Failed to save article. Please try again.');
    }
  };
  
  // Calculate display date with error handling
  const displayDate = params.createdAt ? 
    (() => {
      try {
        return new Date(params.createdAt).toLocaleDateString()
      } catch (error) {
        console.log('Date parsing error:', error)
        return 'Recent'
      }
    })() : 'Recent'
  
  // Handle back navigation
  const handleBack = () => {
    // Navigate back to the Articles screen with the original index
    if (article.sourceIndex) {
      router.push({
        pathname: '/(tabs)/Articles',
        params: { restoreIndex: article.sourceIndex }
      })
    } else {
      router.back()
    }
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: article.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveArticle}
            disabled={loading}
          >
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
        
        {/* Article Content */}
        <View style={styles.contentContainer}>
          {/* Category */}
          <Text style={[styles.category, { color: theme.accent, fontFamily: theme.font }]}>
            {article.category}
          </Text>
          
          {/* Title */}
          <Text style={[styles.title, { color: theme.text, fontFamily: theme.titleFont }]}>
            {article.title}
          </Text>
          
          {/* Publication Date */}
          <Text style={[styles.date, { color: theme.textSecondary, fontFamily: theme.font }]}>
            {displayDate}
          </Text>
          
          {/* Article Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary, fontFamily: theme.font }]}>
                {article.likes}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary, fontFamily: theme.font }]}>
                {article.views}
              </Text>
            </View>

            {/* Save Button for Text */}
            <TouchableOpacity 
              style={styles.saveStatItem} 
              onPress={handleSaveArticle}
              disabled={loading}
            >
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={isSaved ? theme.accent : theme.textSecondary} 
              />
              <Text 
                style={[
                  styles.statText, 
                  { 
                    color: isSaved ? theme.accent : theme.textSecondary, 
                    fontFamily: theme.font 
                  }
                ]}
              >
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Article Body */}
          <View style={styles.bodyContainer}>
            <Text style={[styles.description, { color: theme.text, fontFamily: theme.font }]}>
              {article.description}
            </Text>
            
            <Text style={[styles.content, { color: theme.text, fontFamily: theme.font }]}>
              {article.content}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ArticleDetail

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: width,
    height: height * 0.35,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  saveButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  contentContainer: {
    padding: 20,
  },
  category: {
    fontSize: 14,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 32,
  },
  date: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  saveStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginLeft: 'auto',
  },
  statText: {
    marginLeft: 5,
    fontSize: 14,
  },
  bodyContainer: {
    marginTop: 16,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    lineHeight: 24,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  }
})