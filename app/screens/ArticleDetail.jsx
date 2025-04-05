import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
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
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image with Blur Effect */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: article.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          
          {/* Blurred Overlay */}
          <BlurView intensity={20} style={styles.blurOverlay}>
            <View style={styles.headerButtons}>
              {/* Back Button */}
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: theme.cardBackground + '80' }]}
                onPress={handleBack}
              >
                <Ionicons name="chevron-back" size={24} color={theme.text} />
              </TouchableOpacity>

              {/* Save Button */}
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: theme.cardBackground + '80' }]}
                onPress={handleSaveArticle}
                disabled={loading}
              >
                <Ionicons 
                  name={isSaved ? "bookmark" : "bookmark-outline"} 
                  size={24} 
                  color={theme.text} 
                />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
        
        {/* Article Content */}
        <View style={[styles.contentContainer, { backgroundColor: theme.background }]}>
          {/* Category */}
          <View style={[styles.categoryContainer, { backgroundColor: theme.accent + '20' }]}>
            <Text style={[styles.category, { color: theme.accent, fontFamily: theme.font }]}>
              {article.category}
            </Text>
          </View>
          
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
            <View style={[styles.statItem, { backgroundColor: theme.cardBackground }]}>
              <Ionicons name="heart-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary, fontFamily: theme.font }]}>
                {article.likes}
              </Text>
            </View>
            
            <View style={[styles.statItem, { backgroundColor: theme.cardBackground }]}>
              <Ionicons name="eye-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary, fontFamily: theme.font }]}>
                {article.views}
              </Text>
            </View>

            {/* Save Button for Text */}
            <TouchableOpacity 
              style={[
                styles.saveStatItem, 
                { backgroundColor: theme.cardBackground },
                isSaved && { backgroundColor: theme.accent + '20' }
              ]} 
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
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    position: 'relative',
    width: width,
    height: height * 0.4,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: verticalScale(50),
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
  },
  headerButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    padding: scale(20),
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    marginTop: verticalScale(-20),
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    marginBottom: verticalScale(12),
  },
  category: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
    lineHeight: moderateScale(36),
  },
  date: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(16),
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: verticalScale(20),
    flexWrap: 'wrap',
    gap: scale(10),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
  },
  saveStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
    marginLeft: 'auto',
  },
  statText: {
    marginLeft: scale(5),
    fontSize: moderateScale(14),
  },
  bodyContainer: {
    marginTop: verticalScale(16),
  },
  description: {
    fontSize: moderateScale(18),
    fontWeight: '500',
    marginBottom: verticalScale(16),
    lineHeight: moderateScale(28),
  },
  content: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
  }
})