import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity, ActivityIndicator, Platform } from 'react-native'
import React, { useEffect, useState, memo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
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
  const { language } = useLanguage()
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
  
  // Get content based on selected language
  const getLocalizedContent = () => {
    switch (language) {
      case 'hindi':
        return {
          title: article.title_hi || article.title,
          content: article.content_hi || article.content
        };
      case 'marathi':
        return {
          title: article.title_mr || article.title,
          content: article.content_mr || article.content
        };
      default:
        return {
          title: article.title,
          content: article.content
        };
    }
  };
  
  const localizedContent = getLocalizedContent();
  
  // Limit description length for optimal display
  const limitDescription = (text, limit = 700) => {
    if (!text) return 'No description available';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
  
  // Limit title length
  const limitTitle = (text, limit = 90) => {
    if (!text) return 'No title available';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
  
  // Get image source with fallback
  const getImageSource = () => {
    if (imageError) {
      return require('../assets/images/cover-img.png');
    }
    
    if (article.thumbnailUrl) {
      return { uri: article.thumbnailUrl };
    }
    
    if (article.coverImage) {
      return { uri: article.coverImage };
    }
    
    return require('../assets/images/cover-img.png');
  }
  
  // Get card stack style based on index
  const getCardStackStyle = () => {
    if (cardIndex === 0) {
      return {
        transform: [{ scale: 1 }],
        zIndex: 3,
      };
    } else if (cardIndex === 1) {
      return {
        transform: [{ scale: 0.95 }],
        zIndex: 2,
      };
    } else {
      return {
        transform: [{ scale: 0.9 }],
        zIndex: 1,
      };
    }
  }
  
  return (
    <Animated.View 
      style={[
        styles.cardContainer, 
        getCardStackStyle(),
        style
      ]}
    >
      <Link href={{
        pathname: '/screens/ArticleDetail',
        params: {
          id: article.id,
          title: localizedContent.title,
          description: limitDescription(localizedContent.content, 100),
          content: localizedContent.content,
          coverImage: article.thumbnailUrl || article.coverImage,
          category: article.category,
          createdAt: article.createdAt,
          likes: article.likes,
          views: article.views,
          sourceIndex: globalIndex
        }
      }} asChild>
        <TouchableOpacity activeOpacity={0.9}>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            {/* Image Container */}
            <View style={styles.imageContainer}>
              {imageLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              )}
              <Image
                source={getImageSource()}
                style={styles.image}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                resizeMode="cover"
              />
              
              {/* Category Badge */}
              <View style={[styles.categoryBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.categoryText}>{article.category || 'News'}</Text>
              </View>
              
              {/* Date Badge */}
              <View style={[styles.dateBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.dateText}>{displayDate}</Text>
              </View>
            </View>
            
            {/* Content Container */}
            <View style={styles.contentContainer}>
              <Text style={[styles.title, { color: theme.text, fontFamily: theme.titleFont }]}>
                {limitTitle(localizedContent.title)}
              </Text>
              
              <Text style={[styles.description, { color: theme.textSecondary, fontFamily: theme.font }]}>
                {limitDescription(localizedContent.content)}
              </Text>
              
              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="eye-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.statText, { color: theme.textSecondary, fontFamily: theme.font }]}>
                    {article.views || 0}
                  </Text>
                </View>
                
                <View style={styles.stat}>
                  <Ionicons name="heart-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.statText, { color: theme.textSecondary, fontFamily: theme.font }]}>
                    {article.likes || 0}
                  </Text>
                </View>
                
                <View style={styles.stat}>
                  <Ionicons name="chatbubble-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.statText, { color: theme.textSecondary, fontFamily: theme.font }]}>
                    {article.comments || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    </Animated.View>
  )
})

export default ArticleCard

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 2,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 2,
  },
  dateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 5,
    fontSize: 12,
  },
}) 