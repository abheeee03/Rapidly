import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity, ActivityIndicator, Platform } from 'react-native'
import React, { useEffect, useState, memo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { useTheme } from '../context/ThemeContext'
import { BlurView } from 'expo-blur'
import Animated from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

// Add responsive scaling functions
const scale = (size) => (width / 375) * size
const verticalScale = (size) => (height / 812) * size
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor

// Optimize ArticleCard with memo to prevent unnecessary re-renders
const ArticleCard = memo(({ 
  article, 
  globalIndex, 
  isLastInPage, 
  onEndReached, 
  style = {},
  cardIndex = 0
}) => {
  const { theme } = useTheme()
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  // Check if this is the last card and we should load more
  useEffect(() => {
    if (isLastInPage && cardIndex === 0) {
      onEndReached?.()
    }
  }, [isLastInPage, onEndReached, cardIndex])
  
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
  
  // Style for stacked cards - each card in the stack gets smaller
  const getCardStackStyle = () => {
    if (cardIndex === 0) return {}; // Top card has no special styling
    
    // For cards 1-3 in the stack, add progressively more scaling and opacity
    return {
      transform: [{ scale: Math.max(0.8, 1 - (cardIndex * 0.06)) }],
      opacity: Math.max(0.5, 1 - (cardIndex * 0.2))
    };
  };
  
  return (
    <Animated.View 
      style={[
        styles.articleCard, 
        { backgroundColor: theme.cardBackground },
        getCardStackStyle(),
        style
      ]}
    >
      {/* Card Content */}
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
        
        {/* Gradient overlay for better text readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
          style={styles.gradientOverlay}
        />
        
        {/* Date badge */}
        <View style={styles.dateBadge}>
          <BlurView intensity={70} style={styles.blurBadge}>
            <Text style={[styles.cardDate, { color: 'white', fontFamily: theme.font }]}>
              {displayDate}
            </Text>
          </BlurView>
        </View>
        
        {/* Category */}
        <View style={styles.categoryBadge}>
          <BlurView intensity={70} style={[styles.blurCategory, { borderColor: theme.accent }]}>
            <Text style={[styles.cardCategory, { color: 'white', fontFamily: theme.font }]}>
              {article.category || 'News'}
            </Text>
          </BlurView>
        </View>
      </View>
      
      <View style={[styles.cardContent, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.cardHeader}>
          <Text 
            style={[styles.cardTitle, { color: theme.text, fontFamily: theme.titleFont }]}
            numberOfLines={2}
          >
            {article.title}
          </Text>
          
          <Text 
            style={[styles.cardDescription, { color: theme.textSecondary, fontFamily: theme.font }]}
            numberOfLines={3}
          >
            {limitDescription(article.description)}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.statText, { color: theme.textSecondary, fontFamily: theme.font }]}>
              {article.views || 0}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.statText, { color: theme.textSecondary, fontFamily: theme.font }]}>
              {article.likes || 0}
            </Text>
          </View>
        </View>

        {cardIndex === 0 && (
          <Link href={{
            pathname: "/screens/ArticleDetail",
            params: linkParams
          }} asChild>
            <TouchableOpacity 
              style={[styles.viewDetailsButton, { backgroundColor: theme.accent }]} 
              activeOpacity={0.8}
            >
              <Text style={[styles.viewDetailsText, { color: 'white', fontFamily: theme.font }]}>
                Read Article
              </Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
            </TouchableOpacity>
          </Link>
        )}
      </View>
    </Animated.View>
  )
});

export default ArticleCard

const styles = StyleSheet.create({
  articleCard: {
    width: width - scale(40),
    height: height - scale(180),
    borderRadius: scale(24),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.2,
    shadowRadius: scale(12),
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
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  dateBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    overflow: 'hidden',
    borderRadius: 12,
  },
  blurBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    overflow: 'hidden',
    borderRadius: 16,
  },
  blurCategory: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  cardCategory: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  cardDate: {
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  cardContent: {
    padding: scale(24),
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  cardTitle: {
    fontSize: moderateScale(24),
    marginBottom: verticalScale(16),
    lineHeight: moderateScale(32),
    fontWeight: '800',
  },
  cardDescription: {
    fontSize: moderateScale(15),
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(12),
    opacity: 0.85,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: verticalScale(16),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scale(24),
  },
  statText: {
    fontSize: moderateScale(14),
    marginLeft: 5,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    borderRadius: scale(16),
    elevation: 2,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
  },
  viewDetailsText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: scale(10),
  }
}) 