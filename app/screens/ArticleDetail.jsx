import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { db } from '../../Utlis/firebase'
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { scale, verticalScale, moderateScale } from 'react-native-size-matters'
import { BlurView } from 'expo-blur'

const { width, height } = Dimensions.get('window')

const ArticleDetail = () => {
  const { theme } = useTheme()
  const { user } = useAuth()
  const { language } = useLanguage()
  const params = useLocalSearchParams() || {}
  const [isSaved, setIsSaved] = useState(false)
  const [savedDocId, setSavedDocId] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Get localized content based on selected language
  const getLocalizedContent = () => {
    switch (language) {
      case 'hindi':
        return {
          title: params.title_hi || params.title || 'Article Title',
          content: params.content_hi || params.content || 'No content available',
        };
      case 'marathi':
        return {
          title: params.title_mr || params.title || 'Article Title',
          content: params.content_mr || params.content || 'No content available',
        };
      default:
        return {
          title: params.title || 'Article Title',
          content: params.content || 'No content available',
        };
    }
  };
  
  const localizedContent = getLocalizedContent();
  
  // Parse article data from params with null checks
  const article = {
    id: params.id || 'unknown',
    title: localizedContent.title,
    description: params.description || 'No description available',
    content: localizedContent.content,
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
      
      const savedRef = collection(db, 'users', user.uid, 'savedArticles');
      const q = query(savedRef, where('articleId', '==', article.id));
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

  // Handle saving/unsaving article
  const handleSaveArticle = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to save articles');
      return;
    }
    
    try {
      if (isSaved && savedDocId) {
        // Remove from saved articles
        await deleteDoc(doc(db, 'users', user.uid, 'savedArticles', savedDocId));
        setIsSaved(false);
        setSavedDocId(null);
      } else {
        // Add to saved articles
        const savedRef = collection(db, 'users', user.uid, 'savedArticles');
        const docRef = await addDoc(savedRef, {
          articleId: article.id,
          title: article.title,
          description: article.description,
          content: article.content,
          coverImage: article.coverImage,
          category: article.category,
          createdAt: serverTimestamp(),
          savedAt: serverTimestamp()
        });
        
        setIsSaved(true);
        setSavedDocId(docRef.id);
      }
    } catch (error) {
      console.error('Error saving/unsaving article:', error);
      Alert.alert('Error', 'Failed to save/unsave article');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      {/* Header with back button and save button */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSaveArticle} style={styles.saveButton}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isSaved ? theme.primary : theme.text} 
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Article Image */}
        <Image 
          source={{ uri: article.coverImage }} 
          style={styles.coverImage}
          resizeMode="cover"
        />
        
        {/* Article Content */}
        <View style={[styles.contentContainer, { backgroundColor: theme.background }]}>
          {/* Category and Date */}
          <View style={styles.metaContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.categoryText}>{article.category}</Text>
            </View>
            
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {article.createdAt ? new Date(article.createdAt.seconds ? article.createdAt.seconds * 1000 : article.createdAt).toLocaleDateString() : 'Recent'}
            </Text>
          </View>
          
          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>
            {article.title}
          </Text>
          
          {/* Content */}
          <Text style={[styles.content, { color: theme.text }]}>
            {article.content}
          </Text>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Ionicons name="eye-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {article.views} views
              </Text>
            </View>
            
            <View style={styles.stat}>
              <Ionicons name="heart-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {article.likes} likes
              </Text>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  coverImage: {
    width: '100%',
    height: 300,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 32,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
  },
})