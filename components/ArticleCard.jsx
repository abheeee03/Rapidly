import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { useTheme } from '../context/ThemeContext'

const { width, height } = Dimensions.get('window')

const ArticleCard = ({ article, globalIndex, isLastInPage, onEndReached }) => {
  const { theme } = useTheme()
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  // Check if this is the last card and we should load more
  useEffect(() => {
    if (isLastInPage) {
      onEndReached?.()
    }
  }, [isLastInPage, onEndReached])
  
  if (!article) return null
  
  // Calculate display date
  const displayDate = article.createdAt ? 
    new Date(article.createdAt.seconds ? article.createdAt.seconds * 1000 : article.createdAt).toLocaleDateString() : 
    'Recent'
  
  // Limit description length to prevent UI issues
  const limitDescription = (text, limit = 160) => {
    if (!text) return 'No description available';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
  
  // Safely determine image source
  const getImageSource = () => {
    if (!article.coverImage || imageError) {
      return { uri: 'https://via.placeholder.com/800x400?text=No+Image' };
    }
    return { uri: article.coverImage };
  }
  
  // Prepare navigation params
  const linkParams = {
    id: article.id || 'unknown',
    title: article.title || 'Article Title',
    description: article.description || 'No description available',
    content: article.content || 'No content available',
    coverImage: imageError ? 'https://via.placeholder.com/800x400?text=No+Image' : article.coverImage || 'https://via.placeholder.com/800x400?text=No+Image',
    category: article.category || 'News',
    createdAt: article.createdAt instanceof Date 
      ? article.createdAt.toISOString() 
      : article.createdAt?.seconds 
        ? new Date(article.createdAt.seconds * 1000).toISOString() 
        : new Date().toISOString(),
    likes: article.likes?.toString() || '0',
    views: article.views?.toString() || '0',
    sourceIndex: globalIndex
  }
  
  return (
    <View style={[styles.articleCard, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.imageContainer}>
        <Image 
          source={getImageSource()}
          style={styles.cardImage}
          resizeMode="cover"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false)
            setImageError(true)
          }}
        />
        {imageLoading && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryDateRow}>
            <Text style={[styles.cardCategory, { color: theme.accent, fontFamily: theme.font }]}>
              {article.category || 'News'}
            </Text>
            
            <Text style={[styles.cardDate, { color: theme.textSecondary, fontFamily: theme.font }]}>
              {displayDate}
            </Text>
          </View>
          
          <Text style={[styles.cardTitle, { color: theme.text, fontFamily: theme.titleFont }]}>
            {article.title}
          </Text>
          
          <Text style={[styles.cardDescription, { color: theme.textSecondary, fontFamily: theme.font }]}>
            {limitDescription(article.description)}
          </Text>
        </View>
        
        <Link href={{
          pathname: "/screens/ArticleDetail",
          params: linkParams
        }} asChild>
          <TouchableOpacity 
            style={[styles.viewDetailsButton, { backgroundColor: theme.accent }]} 
            activeOpacity={0.8}
          >
            <Text style={[styles.viewDetailsText, { color: 'white', fontFamily: theme.font }]}>
              Read More
            </Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  )
}

export default ArticleCard

const styles = StyleSheet.create({
  articleCard: {
    width: width - 40,
    height: height - 240,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  imageContainer: {
    width: '100%',
    height: '48%',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  cardContent: {
    padding: 20,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flex: 1,
  },
  categoryDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardCategory: {
    fontSize: 15,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 22,
    marginBottom: 14,
    lineHeight: 28,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewDetailsButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  viewDetailsText: {
    color: 'white',
    marginRight: 8,
    fontSize: 16,
  },
}) 