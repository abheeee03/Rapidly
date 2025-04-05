import { StyleSheet, Text, View, FlatList, ActivityIndicator, Dimensions, TouchableOpacity, Image, SafeAreaView, Animated, TouchableWithoutFeedback, Alert, Modal, ScrollView } from 'react-native'
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
import PagerView from 'react-native-pager-view'

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

// Completely rewritten VideoItem component with simplified approach
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
  togglePlayPause,
}) => {
  const [isReady, setIsReady] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const playerRef = useRef(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const pauseIconAnim = useRef(new Animated.Value(0)).current
  const heartAnimation = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(isCurrentVideo ? 1 : 0.95)).current
  const {theme} = useTheme()

  // Add focus effect to handle video pausing
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (playerRef.current) {
          try {
            playerRef.current.pause();
            setIsPaused(true);
          } catch (error) {
            console.log(`Error pausing video ${index}:`, error);
          }
        }
      };
    }, [])
  );

  // Console log video details for debugging
  useEffect(() => {
    if (item) {
      console.log(`Video ${index} details:`, {
        id: item.id,
        url: item.videoUrl,
        isCurrentVideo,
        isPaused
      });
    }
  }, [item, index, isCurrentVideo, isPaused]);

  // Simple URL validation - don't use URL format validation
  const videoUrl = useMemo(() => {
    if (!item || !item.videoUrl) return '';
    return item.videoUrl;
  }, [item]);
  
  // Initialize player with validated URL - ensure immediate autoplay
  const player = useVideoPlayer(videoUrl, playerInstance => {
    if (!playerInstance) {
      console.log(`Failed to initialize player for video ${index}`);
      return;
    }
    
    try {
      console.log(`Player successfully initialized for video ${index}`);
      // Set basic properties
      playerInstance.loop = true;
      playerInstance.muted = isMuted;
      
      // Store reference and update state
      playerRef.current = playerInstance;
      setIsReady(true);
      setLoadError(false); // Important: reset load error flag
      setIsPaused(false);
      
      // Auto-play if this is the current video
      if (isCurrentVideo) {
        console.log(`Current video ${index} detected, forcing play`);
        playerInstance.play()
          .then(() => console.log(`Video ${index} playing successfully`))
          .catch(err => console.log(`Error playing video ${index}:`, err));
        }
      } catch (error) {
      console.log('Error initializing player:', error);
      }
  });

  // Restore smooth animation effect when videos become current with faster timing
  useEffect(() => {
    if (isCurrentVideo) {
      console.log(`Video ${index} became current, animating in`);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 50,
          useNativeDriver: true
        })
      ]).start();
      
      // Force play when video becomes current
      if (playerRef.current) {
        try {
          console.log(`Forcing play for video ${index} as it became current`);
          playerRef.current.play().catch(err => console.log('Error playing when current:', err));
          setIsPaused(false); // Ensure state is synced
        } catch (error) {
          console.log('Error in current video play effect:', error);
        }
      }
          } else {
      console.log(`Video ${index} is no longer current, animating out`);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          friction: 5,
          tension: 50,
          useNativeDriver: true
        })
      ]).start();
      
      // Ensure non-current videos are paused to save resources
      if (playerRef.current) {
        try {
          playerRef.current.pause().catch(err => console.log('Error pausing when not current:', err));
        } catch (error) {
          console.log('Error in non-current video pause effect:', error);
        }
      }
    }
  }, [isCurrentVideo, index, fadeAnim, scaleAnim]);
  
  // Handle video tap - toggle pause state (make sure this works correctly)
  const handleVideoPress = () => {
    if (!isCurrentVideo || !playerRef.current) return;
    
    console.log(`Video ${index} pressed, toggling pause state`);
    setIsPaused(prev => {
      const newPaused = !prev;
      
      if (newPaused) {
        showPauseIcon();
      }
      
      // Force video to play/pause immediately
      try {
        if (newPaused) {
          console.log(`Pausing video ${index} on user tap`);
          playerRef.current.pause()
            .catch(err => console.log(`Error pausing video ${index}:`, err));
        } else {
          console.log(`Playing video ${index} on user tap`);
          playerRef.current.play()
            .catch(err => console.log(`Error playing video ${index}:`, err));
        }
      } catch (error) {
        console.log('Error in handleVideoPress:', error);
      }
      
      return newPaused;
    });
  };
  
  // Fixed mute button handler with direct player access
  const handleMuteToggle = () => {
    console.log(`Toggling mute from ${isMuted} to ${!isMuted}`);
    
    // Update global mute state
    setIsMuted(!isMuted);
    
    // Also directly update the player for immediate effect
      if (playerRef.current) {
        try {
        playerRef.current.muted = !isMuted;
        console.log(`Player mute set to ${!isMuted} for video ${index}`);
        } catch (error) {
        console.log('Error toggling mute state:', error);
      }
    }
  };
  
  // Show pause icon animation with faster timing
  const showPauseIcon = () => {
    pauseIconAnim.setValue(1);
    Animated.timing(pauseIconAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };
  
  // Handle like animation with faster timing
  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartAnimation, {
        toValue: 1.3,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnimation, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Handle like button press
  const handleLikePress = () => {
    animateHeart();
    handleLike(item.id);
  };
  
  // Format date function...
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };
  
  const formattedDate = item?.createdAt ? formatDate(item.createdAt) : '';
  
  // Render the component with theme
  return (
    <Animated.View style={[
      styles.videoContainer,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        backgroundColor: theme.background === '#FFFFFF' ? '#000' : theme.background,
      }
    ]}>
      <StatusBar style={theme.background === '#FFFFFF' ? "dark" : "light"} />
      
      {/* Video Player with tap gesture */}
      <TouchableWithoutFeedback onPress={handleVideoPress}>
      <View style={styles.videoWrapper}>
          {videoUrl ? (
        <VideoView 
          style={styles.video} 
          player={player}
              allowsFullscreen={false}
          nativeControls={false}
            resizeMode="cover" 
        />
          ) : (
            <View style={[styles.video, {backgroundColor: theme.cardBackground, justifyContent: 'center', alignItems: 'center'}]}>
              <Text style={{color: theme.text, fontFamily: theme.font}}>Video not available</Text>
      </View>
          )}
          
          {/* Large Pause Icon */}
          <Animated.View 
            style={[
              styles.pauseIconContainer,
              { opacity: pauseIconAnim }
            ]}
          >
            <Ionicons name="pause" size={80} color='white' />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
      
      {/* Category Tag */}
      {item?.category && item.category !== "All" && (
        <View style={[styles.categoryTag, { backgroundColor: theme.accent + 'CC' }]}>
          <Text style={[styles.categoryTagText, { fontFamily: theme.font }]}>{item.category}</Text>
      </View>
      )}
      
      {/* Action buttons */}
      <View style={styles.actionButtonsBar}>
        <TouchableOpacity 
          style={styles.actionButtonColumn} 
          onPress={handleLikePress}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Animated.View style={{ transform: [{ scale: heartAnimation }] }}>
            <AntDesign
              name={isLiked ? "heart" : "hearto"}
              size={28}
              color={isLiked ? "red" : 'white'}
            />
          </Animated.View>
          <Text style={[
            styles.actionButtonText,
            { fontFamily: theme.font },
            isLiked && { color: 'red' }
          ]}>{likeCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButtonColumn}
          onPress={() => setShowComments(true)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Ionicons name="chatbubble-outline" size={26} color='white' />
          <Text style={[styles.actionButtonText, { fontFamily: theme.font }]}>{item?.comments || 0}</Text>
        </TouchableOpacity>
        
        
        
        <TouchableOpacity 
          style={styles.actionButtonColumn}
          onPress={() => handleSave(item.id)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <MaterialIcons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={28}
            color={isSaved ? theme.accent : 'white'}
          />
          <Text style={[styles.actionButtonText, { fontFamily: theme.font }]}>Save</Text>
        </TouchableOpacity>
      </View>
      
      {/* Video Info */}
      <View style={styles.videoInfoArea}>
        <View style={styles.authorRow}>
          <Text style={[styles.authorName, { color: 'white', fontFamily: theme.titleFont }]}>@{item?.uploadedBy || 'UptoDate'}</Text>
          {formattedDate && (
            <>
              <Text style={[styles.authorSeparator, { color: 'white' }]}>•</Text>
              <Text style={[styles.videoDate, { color: 'white', fontFamily: theme.font }]}>{formattedDate}</Text>
            </>
          )}
        </View>
        
        <Text style={[styles.videoTitle, { color: 'white', fontFamily: theme.titleFont }]} numberOfLines={2}>
          {item?.title || "Latest News Update"}
        </Text>
        
        {item?.description && (
          <Text style={[styles.videoDescription, { color: 'white', fontFamily: theme.font }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      
      {/* Enhanced Mute Button with better tap area */}
      <TouchableOpacity
        style={[styles.muteButton, { backgroundColor: theme.cardBackground + '80' }]}
        onPress={handleMuteToggle}
        hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
      >
          <Ionicons
          name={isMuted ? "volume-mute" : "volume-high"}
            size={24}
          color='white'
          />
        </TouchableOpacity>
        
      {/* Comments Modal */}
      <CommentsModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        videoId={item?.id}
        commentsCount={item?.comments || 0}
        onCommentAdded={onCommentAdded}
      />
    </Animated.View>
  );
});

// Category selector component
const CategorySelector = ({ selectedCategory, onSelectCategory }) => {
  const [modalVisible, setModalVisible] = useState(false)
  const scaleAnim = useRef(new Animated.Value(0)).current
  const {theme} = useTheme()

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(scaleAnim, {
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
              <Animated.View 
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
              </Animated.View>
            </TouchableWithoutFeedback>
      </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  )
}

// End of content screen
const EndOfContentScreen = ({ onExploreArticles }) => {
  const {theme} = useTheme()
  
  return (
    <View style={[styles.endOfContentContainer, { backgroundColor: theme.background === '#FFFFFF' ? '#000' : theme.background }]}>
      <Ionicons name="newspaper-outline" size={64} color={theme.accent} />
      <Text style={[styles.endOfContentTitle, { color: theme.text, fontFamily: theme.titleFont }]}>You've Reached the End</Text>
      <Text style={[styles.endOfContentText, { color: theme.textSecondary, fontFamily: theme.font }]}>
        That's all the shorts available in this category.
      </Text>
      <TouchableOpacity
        style={[styles.exploreArticlesButton, { backgroundColor: theme.accent }]}
        onPress={()=>router.push('/(tabs)/Articles')}
      >
        <Text style={[styles.exploreArticlesButtonText, { color: theme.background, fontFamily: theme.titleFont }]}>
          Explore Articles
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const HomeScreen = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [likedVideos, setLikedVideos] = useState({})
  const [likeCounts, setLikeCounts] = useState({})
  const [savedVideos, setSavedVideos] = useState({})
  const [togglePlayPause, setTogglePlayPause] = useState(false)
  const [commentCounts, setCommentCounts] = useState({})
  const [selectedCategory, setSelectedCategory] = useState("Regional")
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMoreVideos, setHasMoreVideos] = useState(true)
  const [userCity, setUserCity] = useState(null)
  const [isUserCityLoaded, setIsUserCityLoaded] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isCityLoading, setIsCityLoading] = useState(true)
  const [isVideosLoading, setIsVideosLoading] = useState(false)
  const {theme} = useTheme()
  // References
  const scrollTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 500,
    waitForInteraction: true
  });
  const pagerRef = useRef(null);

  // Load user's city on mount
  useEffect(() => {
    const loadUserCity = async () => {
      setIsCityLoading(true);
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const city = userDoc.data().city;
            setUserCity(city);
            setIsUserCityLoaded(true);
            // Only load videos if we're in Regional category
            if (selectedCategory === "Regional") {
              loadVideos(true);
            }
          } else {
            setIsUserCityLoaded(true);
            if (selectedCategory === "Regional") {
              setError("Please set your city in profile to view regional content");
            }
          }
      } catch (error) {
          console.error('Error loading user city:', error);
          setIsUserCityLoaded(true);
          if (selectedCategory === "Regional") {
            setError("Failed to load user profile. Please try again.");
          }
        }
      } else {
        setIsUserCityLoaded(true);
        if (selectedCategory === "Regional") {
          setError("Please login to view regional content");
        }
      }
      setIsCityLoading(false);
    };
    loadUserCity();
  }, []);
  
  // Effect to load videos when category changes
  useEffect(() => {
    if (selectedCategory === "Regional" && !isUserCityLoaded) {
      return; // Don't load videos if we haven't loaded the user's city yet
    }
    loadVideos(true);
  }, [selectedCategory, isUserCityLoaded]);
  
  // Effect to initialize like counts
  useEffect(() => {
    if (videos.length > 0) {
      const initialLikeCounts = {}
      videos.forEach(video => {
        initialLikeCounts[video.id] = video.likes || 0
      })
      setLikeCounts(initialLikeCounts)
    }
  }, [videos])

  // Load saved videos on mount
  useEffect(() => {
    const user = auth.currentUser
    if (user) {
      loadSavedVideos(user.uid)
    }
  }, [])
  
  // Load user's saved videos
  const loadSavedVideos = async (userId) => {
    try {
      const savedShortsRef = collection(db, 'users', userId, 'savedShorts')
      const querySnapshot = await getDocs(savedShortsRef)
      
      if (!querySnapshot.empty) {
        const savedVideosMap = {}
        querySnapshot.docs.forEach(doc => {
          const data = doc.data()
          savedVideosMap[data.shortId] = true
        })
        setSavedVideos(savedVideosMap)
      }
    } catch (error) {
      console.error('Error loading saved videos:', error)
    }
  }
  
  // Load videos from Firebase
  const loadVideos = async (reset = false) => {
    if (!reset && !hasMoreVideos) return;
    
    try {
      setIsVideosLoading(true);
      if (reset) {
        setLastVisible(null);
        setVideos([]); // Clear videos when resetting
      } else {
        setLoadingMore(true);
      }
      
      console.log(`Fetching ${reset ? 'initial' : 'more'} videos for category: ${selectedCategory}`);
      
      // Base query
      const shortsRef = collection(db, 'shorts');
      
      // Build query based on category
      let q;
      
      if (selectedCategory === "Regional") {
        if (!userCity) {
          setError("Please set your city in profile to view regional content");
          setVideos([]);
          setHasMoreVideos(false);
          return;
        }
        
        // Filter by user's city
        q = query(
          shortsRef, 
          where('location', '==', userCity),
          orderBy('createdAt', 'desc'), 
          limit(VIDEOS_PER_BATCH)
        );
      } else if (selectedCategory === "All") {
        // No category filter
        q = query(
          shortsRef, 
          orderBy('createdAt', 'desc'), 
          limit(VIDEOS_PER_BATCH)
        );
      } else {
        // With category filter
        q = query(
          shortsRef, 
          where('category', '==', selectedCategory),
          orderBy('createdAt', 'desc'), 
          limit(VIDEOS_PER_BATCH)
        );
      }
      
      // Add pagination if not resetting
      if (!reset && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        if (reset) {
          setError(selectedCategory === "Regional" && !userCity 
            ? "Please set your city in profile to view regional content" 
            : `No videos found in the ${selectedCategory} category.`);
          setVideos([]);
        }
        setHasMoreVideos(false);
        return;
      }
      
      // Get last document for pagination
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastDoc);
      
      // Parse videos data
      const shortsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          videoUrl: data.videoUrl,
          title: data.title || 'Untitled Video',
          description: data.description || '',
          uploadedBy: data.uploadedBy || 'UptoDate',
          category: data.category || 'Uncategorized',
          tags: data.tags || [],
          likes: data.likes || 0,
          comments: data.comments || 0,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      
      console.log(`Loaded ${shortsData.length} videos`);
      
      // Update videos state
      if (reset) {
        setVideos(shortsData);
      } else {
        setVideos(prev => [...prev, ...shortsData]);
      }
      
      // Check if we have more videos to load
      setHasMoreVideos(shortsData.length >= VIDEOS_PER_BATCH);
      setError(null);
    } catch (err) {
      console.error('Error loading videos:', err);
      setError('Failed to load videos: ' + err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsVideosLoading(false);
    }
  };
  
  // Load more videos when reaching the end
  const handleLoadMore = () => {
    if (!loadingMore && hasMoreVideos && videos.length > 0) {
      loadVideos(false)
    }
  }
  
  // Handle category selection
  const handleCategoryChange = (category) => {
    console.log('Category changed to:', category);
    setSelectedCategory(category);
    setCurrentIndex(0);
    setLastVisible(null);
    setHasMoreVideos(true);
    setError(null);
    setLoading(true); // Set loading state immediately
    
    // Reset videos and load new ones
    setVideos([]);
    loadVideos(true);
  };
  
  // Handle scroll event
  const handleScroll = (event) => {
    if (!event || !event.nativeEvent) return;
    
    try {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      
      // Calculate current index with rounding to ensure single item changes
      const scrollPosition = contentOffset.y;
      const currentIdx = Math.round(scrollPosition / height);
      
      // Only update if the index is valid and different from current
      if (currentIdx !== currentIndex && currentIdx >= 0 && currentIdx < videos.length) {
        // Add debounce to prevent rapid changes
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          setCurrentIndex(currentIdx);
        }, 100); // Small delay to ensure smooth transitions
      }
      
      // Check if close to bottom to load more
      if (contentSize && contentSize.height && layoutMeasurement && layoutMeasurement.height) {
        const scrollOffset = contentOffset.y;
        const isCloseToBottom = contentSize.height - (scrollOffset + layoutMeasurement.height) < height * 0.5;
        
        if (isCloseToBottom && !loadingMore && hasMoreVideos) {
          handleLoadMore();
        }
      }
    } catch (error) {
      console.log('Error handling scroll:', error);
    }
  };
  
  // Handle like function
  const handleLike = async (videoId) => {
    const user = auth.currentUser
    if (!user) {
      Alert.alert('Login Required', 'Please login to like shorts');
      return;
    }

    try {
      const isCurrentlyLiked = likedVideos[videoId] || false;
      const newLikeState = !isCurrentlyLiked;
      
      // Update local state
    setLikedVideos(prev => ({
      ...prev,
        [videoId]: newLikeState
      }));
    
    setLikeCounts(prev => ({
      ...prev,
        [videoId]: (prev[videoId] || 0) + (isCurrentlyLiked ? -1 : 1)
      }));
      
      // Update Firebase
      const videoRef = doc(db, 'shorts', videoId);
      await updateDoc(videoRef, {
        likes: increment(newLikeState ? 1 : -1)
      });

      // Show feedback
      
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert local state
      setLikedVideos(prev => ({
        ...prev,
        [videoId]: !prev[videoId]
      }));
      setLikeCounts(prev => ({
        ...prev,
        [videoId]: (prev[videoId] || 0) + (prev[videoId] > 0 ? -1 : 1)
      }));
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };
  
  // Handle save function
  const handleSave = async (videoId) => {
    const user = auth.currentUser
    if (!user) {
      Alert.alert('Login Required', 'Please login to save shorts');
      return;
    }

    try {
      const isCurrentlySaved = savedVideos[videoId] || false;
      const newSaveState = !isCurrentlySaved;

      // Update local state
      setSavedVideos(prev => ({
        ...prev,
        [videoId]: newSaveState
      }));

      if (newSaveState) {
        // Save to Firebase
        const savedShortsRef = collection(db, 'users', user.uid, 'savedShorts');
        await addDoc(savedShortsRef, {
          shortId: videoId,
          savedAt: serverTimestamp()
        });
      } else {
        // Remove from Firebase
        const savedShortsRef = collection(db, 'users', user.uid, 'savedShorts');
        const q = query(savedShortsRef, where('shortId', '==', videoId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          await deleteDoc(doc(db, 'users', user.uid, 'savedShorts', querySnapshot.docs[0].id));
        }
      }

      // Show feedback
      Alert.alert(
        newSaveState ? 'Saved' : 'Unsaved',
        newSaveState ? 'Short has been saved to your collection' : 'Short has been removed from your collection'
      );
    } catch (error) {
      console.error('Error saving/unsaving short:', error);
      Alert.alert('Error', 'Failed to save short. Please try again.');
      // Revert local state
      setSavedVideos(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
      }));
    }
  };
    
  // Handle comment added
  const handleCommentAdded = (videoId) => {
    setCommentCounts(prev => ({
      ...prev,
      [videoId]: (prev[videoId] || 0) + 1
    }));
  };
  
  // Navigate to articles
  const navigateToArticles = () => {
    Alert.alert('Navigate', 'Navigating to Articles tab');
  };
  
  // Toggle play/pause
  const handleTogglePlayPause = () => {
    setTogglePlayPause(prev => !prev);
  };
  
  // Handle page change
  const handlePageChange = (event) => {
    const newIndex = event.nativeEvent.position;
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };
  
  // Render video item
  const renderVideo = useCallback(({ item, index }) => {
    if (!item || !item.id) return null;
    
    const isCurrentVideo = index === currentIndex;
    const isLiked = likedVideos[item.id] || false;
    const likeCount = likeCounts[item.id] || 0;
    const isSaved = savedVideos[item.id] || false;
    const commentCount = commentCounts[item.id] || item.comments || 0;
    
    return (
      <VideoItem
        key={item.id}
        item={{...item, comments: commentCount}}
        index={index}
        isCurrentVideo={isCurrentVideo}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isLiked={isLiked}
        likeCount={likeCount}
        handleLike={handleLike}
        handleSave={handleSave}
        isSaved={isSaved}
        onCommentAdded={handleCommentAdded}
        togglePlayPause={togglePlayPause}
      />
    );
  }, [currentIndex, isMuted, likedVideos, likeCounts, savedVideos, commentCounts, togglePlayPause]);
  
  // Handle viewable items changed
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (!viewableItems || !viewableItems.length) return;
    
    const visibleItem = viewableItems[0];
    if (visibleItem && typeof visibleItem.index === 'number') {
      console.log(`Item at index ${visibleItem.index} is now viewable`);
      
      // If different from current, update with animation
      if (visibleItem.index !== currentIndex) {
        // Update current index
        setCurrentIndex(visibleItem.index);
        
        // Add subtle haptic feedback for better UX (if available in your setup)
        // ReactNativeHapticFeedback.trigger('impactLight');
      }
    }
  }, [currentIndex]);
  
  // Force first video to play when app loads or refocuses
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, handling video state');
      
      return () => {
        console.log('Screen unfocused, pausing current video');
        // Pause the current video when leaving the tab
        if (videos[currentIndex]?.playerRef) {
          try {
            videos[currentIndex].playerRef.pause();
            // Set isPaused to true for the current video
            setTogglePlayPause(true);
          } catch (error) {
            console.log(`Error pausing current video:`, error);
          }
        }
      };
    }, [videos, currentIndex])
  );
  // Render loading state with theme
  if (isCityLoading || (selectedCategory === "Regional" && !userCity)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background === '#FFFFFF' ? '#000' : theme.background }]}>
        <StatusBar style={theme.background === 'white' ? "dark" : "light"} />
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: 'white', fontFamily: theme.titleFont }]}>UptoDate News</Text>
          <CategorySelector 
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
      </View>
        <View style={[styles.centeredContainer, { backgroundColor: theme.background === '#FFFFFF' ? '#000' : theme.background }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text, fontFamily: theme.font }]}>Loading News...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error or empty state with theme
  if ((error || !videos.length) && !isCityLoading && selectedCategory !== "Regional") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background === '#FFFFFF' ? '#000' : theme.background }]}>
        <StatusBar style={theme.background === '#FFFFFF' ? "dark" : "light"} />
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: 'white', fontFamily: theme.titleFont }]}>UptoDate News</Text>
          <CategorySelector 
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </View>
        <View style={[styles.centeredContainer, { backgroundColor: theme.background === '#FFFFFF' ? '#000' : theme.background }]}>
          <Ionicons name="cloud-offline" size={64} color={theme.accent} />
          <Text style={[styles.errorTitle, { color: theme.text, fontFamily: theme.titleFont }]}>{!videos.length ? "No Videos Found" : "Error"}</Text>
          <Text style={[styles.errorText, { color: theme.textSecondary, fontFamily: theme.font }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.accent }]} onPress={() => loadVideos(true)}>
            <Text style={[styles.retryButtonText, { color: theme.background, fontFamily: theme.titleFont }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    );
  }

  // Main render with theme
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background === '#FFFFFF' ? '#000' : theme.background }]}>
      <StatusBar style={theme.background === 'white' ? "dark" : "light"} />
      
      {/* Header with category selector */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: 'white', fontFamily: theme.titleFont }]}>UptoDate News</Text>
        <CategorySelector 
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategoryChange}
        />
      </View>
      
      {/* Main content */}
      {loading ? (
        // Show loading state while fetching initial videos
        <View style={[styles.centeredContainer, { backgroundColor: theme.background === '#FFFFFF' ? '#000' : theme.background }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text, fontFamily: theme.font }]}>Loading News...</Text>
        </View>
      ) : videos.length > 0 ? (
        <>
          <PagerView
            ref={pagerRef}
            style={styles.pagerView}
            initialPage={0}
            orientation="vertical"
            onPageSelected={handlePageChange}
            overdrag={false}
            overScrollMode="never"
            pageMargin={0}
            transitionStyle="scroll"
          >
            {videos.map((item, index) => (
              <View key={item.id} style={styles.pageContainer}>
                <VideoItem
                  item={{...item, comments: commentCounts[item.id] || item.comments || 0}}
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
                  togglePlayPause={togglePlayPause}
                />
              </View>
            ))}
          </PagerView>

          {/* Loading more indicator */}
          {loadingMore && (
            <View style={[styles.loadingMoreContainer, { backgroundColor: theme.background === '#FFFFFF' ? '#000' : theme.background }]}>
              <ActivityIndicator color={theme.accent} />
              <Text style={[styles.loadingMoreText, { color: theme.text, fontFamily: theme.font }]}>Loading more...</Text>
            </View>
          )}
          
          {/* End of content screen */}
          {!hasMoreVideos && currentIndex === videos.length - 1 && (
            <View style={[styles.endOfContentContainer, { backgroundColor: theme.background === '#FFFFFF' ? '#000' : theme.background }]}>
              <EndOfContentScreen onExploreArticles={navigateToArticles} />
            </View>
          )}
        </>
      ) : (
        // Show error or empty state
        <View style={[styles.centeredContainer, { backgroundColor: theme.background === '#FFFFFF' ? '#000' : theme.background }]}>
          {error ? (
            <>
              <Ionicons name="cloud-offline" size={64} color={theme.accent} />
              <Text style={[styles.errorTitle, { color: theme.text, fontFamily: theme.titleFont }]}>Error</Text>
              <Text style={[styles.errorText, { color: theme.textSecondary, fontFamily: theme.font }]}>{error}</Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.accent }]} onPress={() => loadVideos(true)}>
                <Text style={[styles.retryButtonText, { color: theme.background, fontFamily: theme.titleFont }]}>Try Again</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.text, fontFamily: theme.font }]}>Loading News...</Text>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    zIndex: 100,
    top: 45,
    left: 0,
    right: 0,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  videoContainer: {
    width,
    height,
    backgroundColor: '#000',
  },
  videoWrapper: {
    flex: 1,
  },
  video: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  // YouTube Shorts style action buttons
  actionButtonsBar: {
    zIndex: 100,
    position: 'absolute',
    right: 10,
    bottom: 100,
    alignItems: 'center',
    width: 55, // Ensure enough width for the buttons
  },
  actionButtonColumn: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 5, // Add some padding for easier tapping
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  
  // Video info area (at bottom)
  videoInfoArea: {
    position: 'absolute',
    left: 15,
    right: 70, // Leave space for action buttons
    bottom: 30,
    zIndex: 90, // Ensure it's below the mute button
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  videoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  videoDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 10,
  },
  
  // Enhanced mute button
  muteButton: {
    position: 'absolute',
    right: 15,
    bottom: 75,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 24,
    zIndex: 95, // Ensure it's above the video info area
  },
  pauseIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  errorTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF4C54',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  touchableOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 100, // Leave space for action buttons
    bottom: 200,
    zIndex: 5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginRight: scale(4),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    width: width * 0.85,
    maxHeight: height * 0.7,
    borderRadius: scale(16),
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  categoriesTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  closeButton: {
    padding: scale(4),
  },
  categoriesScrollView: {
    maxHeight: height * 0.6,
  },
  categoriesScrollContent: {
    paddingBottom: verticalScale(16),
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
  },
  selectedCategoryItem: {
    backgroundColor: 'rgba(109, 76, 255, 0.1)',
  },
  categoryItemText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  selectedCategoryItemText: {
    color: '#0A84FF',
    fontWeight: '700',
  },
  
  // End of content screen
  endOfContentContainer: {
    height,
    width,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  endOfContentTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  endOfContentText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  exploreArticlesButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  exploreArticlesButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Loading more
  loadingMoreContainer: {
    height: 100,
    width,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#000',
  },
  loadingMoreText: {
    color: '#FFF',
    marginLeft: 10,
    fontSize: 14,
  },
  categoryTag: {
    position: 'absolute',
    top: 100,
    left: 16,
    backgroundColor: 'rgba(255, 76, 84, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  categoryTagText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  authorSeparator: {
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 5,
  },
  videoDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  pagerView: {
    flex: 1,
    width: '100%',
  },
  pageContainer: {
    flex: 1,
    width: '100%',
  },
})