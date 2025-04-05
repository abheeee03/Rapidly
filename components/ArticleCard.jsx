import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { useTheme } from '../context/ThemeContext'
import { BlurView } from 'expo-blur'

const { width, height } = Dimensions.get('window')

// Add responsive scaling functions
const scale = (size) => (width / 375) * size
const verticalScale = (size) => (height / 812) * size
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor

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
  const limitDescription = (text, limit = 120) => {
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
        <BlurView intensity={20} style={styles.imageOverlay}>
          <View style={styles.categoryContainer}>
            <Text style={[styles.cardCategory, { color: theme.accent, fontFamily: theme.font }]}>
              {article.category || 'News'}
            </Text>
            <Text style={[styles.cardDate, { color: theme.textSecondary, fontFamily: theme.font }]}>
              {displayDate}
            </Text>
          </View>
        </BlurView>
      </View>
      
      <View style={[styles.cardContent, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.cardHeader}>
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
            <Text style={[styles.viewDetailsText, { color: theme.text, fontFamily: theme.font }]}>
              Read More
            </Text>
            <Ionicons name="arrow-forward" size={20} color={theme.text} style={styles.buttonIcon} />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  )
}

export default ArticleCard

const styles = StyleSheet.create({
  articleCard: {
    width: width - scale(40),
    height: height - scale(180), // Adjusted to avoid tab bar
    borderRadius: scale(32),
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    marginHorizontal: scale(20),
    marginVertical: verticalScale(20),
  },
  imageContainer: {
    width: '100%',
    height: '55%',
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
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: scale(24),
    justifyContent: 'flex-start',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: moderateScale(16),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(20),
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderRadius: scale(24),
    overflow: 'hidden',
  },
  cardDate: {
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  cardContent: {
    padding: scale(28),
    flex: 1,
    justifyContent: 'space-between',
    borderTopLeftRadius: scale(32),
    borderTopRightRadius: scale(32),
    marginTop: verticalScale(-32),
  },
  cardHeader: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: moderateScale(26),
    marginBottom: verticalScale(20),
    lineHeight: moderateScale(34),
  },
  cardDescription: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(26),
    marginBottom: verticalScale(28),
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    borderRadius: scale(24),
    elevation: 2,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
  },
  viewDetailsText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: scale(10),
  }
}) 