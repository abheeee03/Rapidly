import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native'
import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

const { width, height } = Dimensions.get('window')

const ArticleDetail = () => {
  const { theme } = useTheme()
  const params = useLocalSearchParams() || {}
  
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
        </View>
        
        {/* Article Content */}
        <View style={styles.contentContainer}>
          {/* Category */}
          <Text style={[styles.category, { color: theme.accent, fontFamily: theme.font }]}>
            {article.category}
          </Text>
          
          {/* Title */}
          <Text style={[styles.title, { color: theme.text, fontFamily: theme.font }]}>
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