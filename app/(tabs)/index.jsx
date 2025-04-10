import { StyleSheet, Text, View, FlatList, ActivityIndicator, Dimensions, TouchableOpacity, Image, SafeAreaView, Animated as RNAnimated, TouchableWithoutFeedback, Alert, Modal, ScrollView, Platform } from 'react-native'
import React, { useEffect, useState, useRef, memo, useCallback, useMemo } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, FontAwesome5, MaterialCommunityIcons, AntDesign, MaterialIcons } from '@expo/vector-icons'
import { db, auth } from '../../Utlis/firebase'
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, updateDoc, increment, addDoc, deleteDoc, serverTimestamp, startAfter } from 'firebase/firestore'
import { BlurView } from 'expo-blur'
import CommentsModal from '../components/CommentsModal'
import {useTheme} from '../../context/ThemeContext'
import { router } from 'expo-router'
import { scale, verticalScale, moderateScale } from 'react-native-size-matters'
import Animated, { FadeIn, SlideInRight, runOnJS } from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { Video } from 'expo-av'

const { width, height } = Dimensions.get('window')

// Categories for video filtering
const CATEGORIES = [
  "Regional",
  "All",
  "Politics",
  "Sports",
  "Entertainment",
  "Technology",
  "Business",
  "Health",
  "Science",
  "World"
]

// Number of videos to load in each batch
const VIDEOS_PER_BATCH = 5

// Completely rewritten VideoItem component with improved functionality
const VideoItem = memo(({ 
  item, 
  index, 
  isCurrentVideo, 
  isMuted, 
  setIsMuted, 
  isLiked, 
  likeCount, 
  handleLike,
  handleSave,
  isSaved,
  onCommentAdded,
}) => {
  const { theme } = useTheme()
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const controlsTimeout = useRef(null)

  useEffect(() => {
    if (isCurrentVideo) {
      setIsPlaying(true)
      if (videoRef.current) {
        videoRef.current.playAsync().catch(err => console.log('Error playing video:', err))
      }
    } else {
      setIsPlaying(false)
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(err => console.log('Error pausing video:', err))
      }
    }

    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current)
      }
    }
  }, [isCurrentVideo])

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsLoading(false)
      if (status.didJustFinish) {
        // Video finished playing
        setIsPlaying(false)
        setProgress(0)
        if (videoRef.current) {
          videoRef.current.replayAsync().catch(err => console.log('Error replaying video:', err))
        }
      } else {
        // Update progress
        const newProgress = status.positionMillis / status.durationMillis
        setProgress(newProgress)
      }
    }
  }

  const handleVideoPress = () => {
    setIsPlaying(!isPlaying)
    
    if (isPlaying) {
      videoRef.current?.pauseAsync()
    } else {
      videoRef.current?.playAsync()
    }
    
    showControlsTemporarily()
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current)
    }
    
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp.seconds * 1000)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  return (
    <View style={styles.videoItemContainer}>
      <TouchableOpacity 
        activeOpacity={1}
        onPress={handleVideoPress}
        style={styles.videoWrapper}
      >
        <Video
          ref={videoRef}
          source={{ uri: item.videoUrl }}
          style={styles.video}
          resizeMode="contain"
          shouldPlay={isCurrentVideo}
          isLooping={true}
          isMuted={isMuted}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onLoad={(status) => {
            setDuration(status.durationMillis)
            setIsLoading(false)
          }}
          onError={(error) => {
            console.log('Video error:', error)
            setIsLoading(false)
          }}
        />
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}
        
        {/* Video info - simplified to just title */}
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={1}>
            {item.title || 'Untitled Video'}
          </Text>
        </View>
        
        {/* Progress bar - moved to bottom */}
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progress * 100}%`, backgroundColor: theme.accent }
            ]} 
          />
        </View>
        
        {showControls && (
          <View style={styles.controls}>
            {isPlaying ? (
              <Ionicons name="pause-circle" size={80} color="rgba(255,255,255,0.8)" />
            ) : (
              <Ionicons name="play-circle" size={80} color="rgba(255,255,255,0.8)" />
            )}
          </View>
        )}
        
        {/* Category badge */}
        {item.category && (
          <View style={[styles.categoryBadge, { backgroundColor: theme.accent + 'AA' }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
        
        {/* Action buttons - with added share button */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={26} 
              color={isLiked ? "red" : "white"} 
            />
            <Text style={styles.actionText}>{likeCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowComments(true)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="white" />
            <Text style={styles.actionText}>{item.comments || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleSave(item.id)}
          >
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isSaved ? theme.accent : "white"} 
            />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              const shareOptions = {
                message: `Check out this video: ${item.title}`,
                url: item.videoUrl
              };
              try {
                Alert.alert('Share', 'Sharing feature will be implemented soon!');
              } catch (error) {
                console.error('Error sharing video:', error);
              }
            }}
          >
            <Ionicons 
              name="share-social-outline" 
              size={24} 
              color="white" 
            />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons 
              name={isMuted ? "volume-mute" : "volume-high"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.actionText}>
              {isMuted ? "Unmute" : "Mute"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      
      {/* Comments Modal */}
      <CommentsModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        videoId={item.id}
        commentsCount={item.comments || 0}
        onCommentAdded={onCommentAdded}
      />
    </View>
  )
})

// Category selector component
const CategorySelector = ({ selectedCategory, onSelectCategory }) => {
  const [modalVisible, setModalVisible] = useState(false)
  const scaleAnim = useRef(new RNAnimated.Value(0)).current
  const {theme} = useTheme()

  useEffect(() => {
    if (modalVisible) {
      RNAnimated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true
      }).start()
    } else {
      scaleAnim.setValue(0)
    }
  }, [modalVisible])
  
  return (
    <>
      <TouchableOpacity 
        style={[styles.categoryButton, { backgroundColor: theme.cardBackground + '80' }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.categoryButtonText, { color: theme.text, fontFamily: theme.font }]}>{selectedCategory}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.text} />
      </TouchableOpacity>
        
      <Modal
        transparent
        visible={modalVisible}
        animationType="none"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <TouchableWithoutFeedback>
              <RNAnimated.View 
                style={[
                  styles.categoriesContainer,
                  {
                    transform: [{ scale: scaleAnim }],
                    opacity: scaleAnim,
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  }
                ]}
              >
                <View style={styles.categoriesHeader}>
                  <Text style={[styles.categoriesTitle, { color: theme.text, fontFamily: theme.titleFont }]}>Categories</Text>
                  <TouchableOpacity 
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={styles.categoriesScrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesScrollContent}
                >
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryItem,
                        selectedCategory === category && styles.selectedCategoryItem,
                        { borderBottomColor: theme.border }
                      ]}
                      onPress={() => {
                        onSelectCategory(category)
                        setModalVisible(false)
                      }}
                    >
                      <Text 
                        style={[
                          styles.categoryItemText,
                          { color: theme.text, fontFamily: theme.font },
                          selectedCategory === category && styles.selectedCategoryItemText
                        ]}
                      >
                        {category}
                      </Text>
                      {selectedCategory === category && (
                        <Ionicons name="checkmark" size={18} color={theme.accent} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </RNAnimated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  )
}

const EndScreen = ({ onRetry, theme, navigation }) => (
  <Animated.View 
    entering={FadeIn}
    style={[
      styles.endScreenContainer, 
      { backgroundColor: theme.cardBackground }
    ]}
  >
    <Ionicons
      name="videocam-outline"
      size={80}
      color={theme.accent}
      style={{ marginBottom: 20 }}
    />
    <Text style={[
      styles.endScreenTitle, 
      { color: theme.text, fontFamily: theme.titleFont }
    ]}>
      No More Shorts
    </Text>
    <Text style={[
      styles.endScreenText, 
      { color: theme.textSecondary, fontFamily: theme.font }
    ]}>
      You've watched all available shorts in this category
    </Text>
    
    <View style={styles.endScreenButtonContainer}>
      <TouchableOpacity
        style={[styles.endScreenButton, { backgroundColor: theme.accent }]}
        onPress={onRetry}
      >
        <Ionicons name="refresh-outline" size={24} color="white" style={styles.buttonIcon} />
        <Text style={[styles.endScreenButtonText, { color: 'white', fontFamily: theme.font }]}>
          Watch Again
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.endScreenButton, { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.accent }]}
        onPress={() => navigation.navigate('Articles')}
      >
        <Ionicons name="newspaper-outline" size={24} color={theme.accent} style={styles.buttonIcon} />
        <Text style={[styles.endScreenButtonText, { color: theme.accent, fontFamily: theme.font }]}>
          Explore Articles
        </Text>
      </TouchableOpacity>
    </View>
  </Animated.View>
);

// Main Component
const HomeScreen = () => {
  const { theme } = useTheme()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMoreVideos, setHasMoreVideos] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [likedVideos, setLikedVideos] = useState({})
  const [savedVideos, setSavedVideos] = useState({})
  const [likeCounts, setLikeCounts] = useState({})
  
  const flatListRef = useRef(null)
  
  const categories = [
    'All', 
    'Politics', 
    'Technology', 
    'Health', 
    'Business', 
    'Entertainment', 
    'Sports',
    'Science',
    'Education',
    'World',
    'Environment',
    'Finance'
  ]

  // Load liked and saved videos
  useEffect(() => {
    const loadUserInteractions = async () => {
      const user = auth.currentUser
      if (user) {
        try {
          // Load liked videos
          const likedRef = collection(db, 'users', user.uid, 'likedShorts')
          const likedSnapshot = await getDocs(likedRef)
          const likedMap = {}
          
          likedSnapshot.docs.forEach(doc => {
            const data = doc.data()
            likedMap[data.shortId] = true
          })
          
          setLikedVideos(likedMap)
          
          // Load saved videos
          const savedRef = collection(db, 'users', user.uid, 'savedShorts')
          const savedSnapshot = await getDocs(savedRef)
          const savedMap = {}
          
          savedSnapshot.docs.forEach(doc => {
            const data = doc.data()
            savedMap[data.shortId] = true
          })
          
          setSavedVideos(savedMap)
        } catch (error) {
          console.error('Error loading user interactions:', error)
        }
      }
    }
    
    loadUserInteractions()
  }, [])

  // Fetch initial videos
  useEffect(() => {
    fetchVideos(true)
  }, [])

  // Re-fetch videos when category changes
  useEffect(() => {
    if (selectedCategory !== 'All') {
      fetchVideosByCategory(true)
    } else {
      fetchVideos(true)
    }
  }, [selectedCategory])

  // Fetch all videos
  const fetchVideos = async (reset = false) => {
    if (loading && !reset) return
    
    try {
      if (reset) {
        setLoading(true)
        setVideos([])
        setLastDoc(null)
        setHasMoreVideos(true)
        setCurrentIndex(0)
      } else {
        setLoadingMore(true)
      }

      let q
      
      if (reset || !lastDoc) {
        q = query(
          collection(db, 'shorts'),
          orderBy('createdAt', 'desc'),
          limit(VIDEOS_PER_BATCH)
        )
      } else {
        q = query(
          collection(db, 'shorts'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(VIDEOS_PER_BATCH)
        )
      }

      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        setHasMoreVideos(false)
        setLoading(false)
        setLoadingMore(false)
        return
      }
      
      const videosData = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        videosData.push({
          id: doc.id,
          ...data
        })
        
        // Initialize like counts
        setLikeCounts(prev => ({
          ...prev,
          [doc.id]: data.likes || 0
        }))
      })

      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1])
      
      if (reset) {
        setVideos(videosData)
      } else {
        setVideos(prev => [...prev, ...videosData])
      }
      
      setHasMoreVideos(videosData.length === VIDEOS_PER_BATCH)
      setLoading(false)
      setLoadingMore(false)
      setError(null)
    } catch (error) {
      console.error("Error fetching videos: ", error)
      setError("Couldn't load videos. Please check your connection.")
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Fetch videos by category
  const fetchVideosByCategory = async (reset = false) => {
    if (loading && !reset) return
    
    try {
      if (reset) {
        setLoading(true)
        setVideos([])
        setLastDoc(null)
        setHasMoreVideos(true)
        setCurrentIndex(0)
      } else {
        setLoadingMore(true)
      }
      
      let q
      
      if (reset || !lastDoc) {
        q = query(
          collection(db, 'shorts'),
          where('category', '==', selectedCategory),
          orderBy('createdAt', 'desc'),
          limit(VIDEOS_PER_BATCH)
        )
      } else {
        q = query(
          collection(db, 'shorts'),
          where('category', '==', selectedCategory),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(VIDEOS_PER_BATCH)
        )
      }
      
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        setHasMoreVideos(false)
        setLoading(false)
        setLoadingMore(false)
        return
      }
      
      const videosData = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        videosData.push({
          id: doc.id,
          ...data
        })
        
        // Initialize like counts
        setLikeCounts(prev => ({
          ...prev,
          [doc.id]: data.likes || 0
        }))
      })
      
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1])
      
      if (reset) {
        setVideos(videosData)
      } else {
        setVideos(prev => [...prev, ...videosData])
      }
      
      setHasMoreVideos(videosData.length === VIDEOS_PER_BATCH)
      setLoading(false)
      setLoadingMore(false)
    } catch (error) {
      console.error(`Error fetching videos for category ${selectedCategory}:`, error)
      setError("Couldn't load videos. Please check your connection.")
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true)
    if (selectedCategory === 'All') {
      fetchVideos(true).then(() => setRefreshing(false))
    } else {
      fetchVideosByCategory(true).then(() => setRefreshing(false))
    }
  }

  // Handle like video
  const handleLike = async (videoId) => {
    const user = auth.currentUser
    if (!user) {
      Alert.alert('Login Required', 'Please login to like videos')
      return
    }

    try {
      const isCurrentlyLiked = likedVideos[videoId] || false
      const newLikeState = !isCurrentlyLiked
      
      // Optimistic update
      setLikedVideos(prev => ({
        ...prev,
        [videoId]: newLikeState
      }))
      
      setLikeCounts(prev => ({
        ...prev,
        [videoId]: (prev[videoId] || 0) + (newLikeState ? 1 : -1)
      }))
      
      // Update in Firestore
      const videoRef = doc(db, 'shorts', videoId)
      await updateDoc(videoRef, {
        likes: increment(newLikeState ? 1 : -1)
      })
      
      // Update user's liked videos collection
      const userLikedRef = collection(db, 'users', user.uid, 'likedShorts')
      
      if (newLikeState) {
        await addDoc(userLikedRef, {
          shortId: videoId,
          likedAt: serverTimestamp()
        })
      } else {
        const q = query(userLikedRef, where('shortId', '==', videoId))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          await deleteDoc(querySnapshot.docs[0].ref)
        }
      }
    } catch (error) {
      console.error('Error liking video:', error)
      
      // Revert optimistic update
      setLikedVideos(prev => ({
        ...prev,
        [videoId]: !prev[videoId]
      }))
      
      setLikeCounts(prev => ({
        ...prev,
        [videoId]: (prev[videoId] || 0) + (prev[videoId] ? -1 : 1)
      }))
      
      Alert.alert('Error', 'Failed to like video. Please try again.')
    }
  }

  // Handle save video
  const handleSave = async (videoId) => {
    const user = auth.currentUser
    if (!user) {
      Alert.alert('Login Required', 'Please login to save videos')
      return
    }

    try {
      const isCurrentlySaved = savedVideos[videoId] || false
      const newSaveState = !isCurrentlySaved
      
      // Optimistic update
      setSavedVideos(prev => ({
        ...prev,
        [videoId]: newSaveState
      }))
      
      // Update in Firestore
      const userSavedRef = collection(db, 'users', user.uid, 'savedShorts')
      
      if (newSaveState) {
        await addDoc(userSavedRef, {
          shortId: videoId,
          savedAt: serverTimestamp()
        })
      } else {
        const q = query(userSavedRef, where('shortId', '==', videoId))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          await deleteDoc(querySnapshot.docs[0].ref)
        }
      }
    } catch (error) {
      console.error('Error saving video:', error)
      
      // Revert optimistic update
      setSavedVideos(prev => ({
        ...prev,
        [videoId]: !prev[videoId]
      }))
      
      Alert.alert('Error', 'Failed to save video. Please try again.')
    }
  }

  // Handle comment added
  const handleCommentAdded = (videoId) => {
    const videoIndex = videos.findIndex(v => v.id === videoId)
    if (videoIndex !== -1) {
      const updatedVideos = [...videos]
      updatedVideos[videoIndex] = {
        ...updatedVideos[videoIndex],
        comments: (updatedVideos[videoIndex].comments || 0) + 1
      }
      setVideos(updatedVideos)
    }
  }

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setShowCategoryModal(false)
  }

  // Handle view changes
  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visible = viewableItems[0]
      setCurrentIndex(visible.index)
    }
  }, [])

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  }

  // Render loading state
  if (loading && !videos.length) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text, fontFamily: theme.font }]}>
          Loading Latest News...
        </Text>
      </View>
    )
  }

  // Render empty state
  if (!loading && videos.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: theme.titleFont }]}>
              News Rapidly
            </Text>
            
            <TouchableOpacity 
              style={[styles.categoryDropdown, { backgroundColor: theme.accent + '20' }]}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.selectedCategoryText, { color: theme.text, fontFamily: theme.font }]}>
                {selectedCategory}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={64} color={theme.accent} />
          <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: theme.titleFont }]}>
            No Videos Available
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.textSecondary, fontFamily: theme.font }]}>
            {selectedCategory !== 'All' 
              ? `No videos found in the ${selectedCategory} category.`
              : 'No videos have been uploaded yet.'}
          </Text>
          {selectedCategory !== 'All' && (
            <TouchableOpacity 
              style={[styles.viewAllButton, { backgroundColor: theme.accent }]}
              onPress={() => setSelectedCategory('All')}
            >
              <Text style={[styles.viewAllButtonText, { color: 'white', fontFamily: theme.font }]}>
                View All Videos
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCategoryModal(false)}
          >
            <View 
              style={[
                styles.categoryModalContent, 
                { 
                  backgroundColor: theme.cardBackground,
                  top: Platform.OS === 'ios' ? 130 : 150,
                  right: 20,
                  maxHeight: height * 0.6,
                }
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category && { backgroundColor: theme.accent + '20' }
                    ]}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        { 
                          fontFamily: theme.font,
                          color: selectedCategory === category ? theme.accent : theme.text
                        }
                      ]}
                    >
                      {category}
                    </Text>
                    {selectedCategory === category && (
                      <Ionicons name="checkmark" size={18} color={theme.accent} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    )
  }

  // Render main content
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: theme.titleFont }]}>
          News Rapidly
          </Text>
          
          <TouchableOpacity 
            style={[styles.categoryDropdown, { backgroundColor: theme.accent + '20' }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[styles.selectedCategoryText, { color: theme.text, fontFamily: theme.font }]}>
              {selectedCategory}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={videos}
        keyExtractor={(item, index) => `video-${item.id}-${index}`}
        renderItem={({ item, index }) => (
          <VideoItem
            item={item}
            index={index}
            isCurrentVideo={index === currentIndex}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            isLiked={likedVideos[item.id] || false}
            likeCount={likeCounts[item.id] || 0}
            handleLike={handleLike}
            handleSave={handleSave}
            isSaved={savedVideos[item.id] || false}
            onCommentAdded={handleCommentAdded}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.8}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.y / height);
          if (index !== currentIndex) {
            setCurrentIndex(index);
          }
        }}
        snapToAlignment="start"
        disableIntervalMomentum={true}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 80,
          minimumViewTime: 300,
        }}
        onEndReached={() => {
          if (hasMoreVideos && !loadingMore) {
            if (selectedCategory === 'All') {
              fetchVideos(false)
            } else {
              fetchVideosByCategory(false)
            }
          }
        }}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListFooterComponent={loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[styles.loadingMoreText, { color: theme.textSecondary, fontFamily: theme.font }]}>
              Loading more videos...
            </Text>
          </View>
        )}
      />
      
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View 
            style={[
              styles.categoryModalContent, 
              { 
                backgroundColor: theme.cardBackground,
                top: Platform.OS === 'ios' ? 130 : 150,
                right: 20,
                maxHeight: height * 0.6,
              }
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    selectedCategory === category && { backgroundColor: theme.accent + '20' }
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      { 
                        fontFamily: theme.font,
                        color: selectedCategory === category ? theme.accent : theme.text
                      }
                    ]}
                  >
                    {category}
                  </Text>
                  {selectedCategory === category && (
                    <Ionicons name="checkmark" size={18} color={theme.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  videoItemContainer: {
    top: 20,
    width,
    height,
    backgroundColor: '#000',
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 70, // Moved to bottom
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  progressBarFill: {
    height: '100%',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  categoryBadge: {
    position: 'absolute',
    top: 90,
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    zIndex: 10,
  },
  categoryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 75, // Just above progress bar
    left: 16,
    right: 70,
    zIndex: 10,
  },
  videoTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  actionButtons: {
    position: 'absolute',
    right: 16,
    bottom: 80, // Above progress bar
    alignItems: 'center',
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  loadingMoreContainer: {
    height: 80,
    width,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  categoryModalContent: {
    position: 'absolute',
    width: 180,
    borderRadius:.12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  categoryOptionText: {
    fontSize: 15,
  },
})