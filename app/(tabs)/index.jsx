import { StyleSheet, Text, View, FlatList, ActivityIndicator, Dimensions, TouchableOpacity, Image, SafeAreaView, Animated, TouchableWithoutFeedback, Alert, Modal } from 'react-native'
import React, { useEffect, useState, useRef, memo, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, FontAwesome5, MaterialCommunityIcons, AntDesign, MaterialIcons } from '@expo/vector-icons'
import { db, auth } from '../../Utlis/firebase'
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, updateDoc, increment, addDoc, deleteDoc, serverTimestamp, startAfter } from 'firebase/firestore'
import { BlurView } from 'expo-blur'
import CommentsModal from '../components/CommentsModal'


const { width, height } = Dimensions.get('window')

// Categories for video filtering
const CATEGORIES = [
  "All",
  "Politics",
  "Sports",
  "Entertainment",
  "Technology",
  "Business",
  "Health",
  "Science",
  "World",
  "Local"
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
}) => {
  const [isReady, setIsReady] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const playerRef = useRef(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const pauseIconAnim = useRef(new Animated.Value(0)).current
  const heartAnimation = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(isCurrentVideo ? 1 : 0.95)).current

  
  // Handle animations when video becomes current
  useEffect(() => {
    if (isCurrentVideo) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        })
      ]).start()
    }
  }, [isCurrentVideo, fadeAnim, scaleAnim])
  
  // Simple player initialization
  const player = useVideoPlayer(item?.videoUrl || '', playerInstance => {
    if (!playerInstance || !item) return;
    
    try {
      playerInstance.loop = true;
      playerInstance.muted = isMuted;
      setIsReady(true);
      playerRef.current = playerInstance;
    } catch (error) {
      console.log('Error initializing player:', error);
    }
  });
  
  // Control video playback based on visibility
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isReady) return;
    
    const playVideo = async () => {
      try {
        if (isCurrentVideo && !isPaused) {
          if (typeof player.play === 'function') {
            await player.play().catch(() => {});
          }
        } else {
          if (typeof player.pause === 'function') {
            await player.pause().catch(() => {});
          }
        }
      } catch (error) {
        console.log('Error controlling playback:', error);
      }
    };
    
    playVideo();
  }, [isCurrentVideo, isPaused, isReady]);
  
  // Handle mute state changes
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isReady) return;
    
    try {
      if (typeof player.setMuted === 'function') {
        player.setMuted(isMuted);
      }
    } catch (error) {
      console.log('Error setting mute state:', error);
    }
  }, [isMuted, isReady]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const player = playerRef.current;
      if (!player) return;
      
      try {
        if (typeof player.pause === 'function') {
          player.pause().catch(() => {});
        }
        playerRef.current = null;
      } catch (error) {
        console.log('Error cleaning up player:', error);
      }
    };
  }, []);
  
  // Show pause icon animation
  const showPauseIcon = () => {
    pauseIconAnim.setValue(1);
    Animated.timing(pauseIconAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };
  
  // Handle video tap to play/pause
  const handleVideoPress = () => {
    setIsPaused(prev => {
      const newPaused = !prev;
      if (newPaused) showPauseIcon();
      return newPaused;
    });
  };
  
  // Handle like animation
  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartAnimation, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnimation, {
        toValue: 1,
        duration: 100,
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
  
  // Render the component
  return (
    <Animated.View style={[
      styles.videoContainer,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }
    ]}>
      <StatusBar style="light" />
      
      {/* Video Player with tap gesture */}
      <TouchableWithoutFeedback onPress={handleVideoPress}>
        <View style={styles.videoWrapper}>
          {item?.videoUrl ? (
            <VideoView 
              style={styles.video} 
              player={player}
              allowsFullscreen
              nativeControls={false}
            />
          ) : (
            <View style={[styles.video, {backgroundColor: '#000', justifyContent: 'center', alignItems: 'center'}]}>
              <Text style={{color: '#fff'}}>Video not available</Text>
            </View>
          )}
          
          {/* Large Pause Icon */}
          <Animated.View 
            style={[
              styles.pauseIconContainer,
              { opacity: pauseIconAnim }
            ]}
          >
            <Ionicons name="pause" size={80} color="white" />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
      
      {/* Category Tag */}
      {item?.category && item.category !== "All" && (
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{item.category}</Text>
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
              color={isLiked ? "red" : "white"}
            />
          </Animated.View>
          <Text style={[
            styles.actionButtonText,
            isLiked && { color: 'red' }
          ]}>{likeCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButtonColumn}
          onPress={() => setShowComments(true)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Ionicons name="chatbubble-outline" size={26} color="white" />
          <Text style={styles.actionButtonText}>{item?.comments || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButtonColumn}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Ionicons name="arrow-redo-outline" size={26} color="white" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButtonColumn}
          onPress={() => handleSave(item.id)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <MaterialIcons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={28}
            color={isSaved ? "#FFF" : "white"}
          />
          <Text style={styles.actionButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      
      {/* Video Info */}
      <View style={styles.videoInfoArea}>
        <View style={styles.authorRow}>
          <Text style={styles.authorName}>@{item?.uploadedBy || 'UptoDate'}</Text>
          {formattedDate && (
            <>
              <Text style={styles.authorSeparator}>•</Text>
              <Text style={styles.videoDate}>{formattedDate}</Text>
            </>
          )}
        </View>
        
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item?.title || "Latest News Update"}
        </Text>
        
        {item?.description && (
          <Text style={styles.videoDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <TouchableOpacity
          style={styles.muteButton}
          onPress={() => setIsMuted(!isMuted)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Ionicons
            name={isMuted ? "volume-mute" : "volume-high"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

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
        style={styles.categoryButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.categoryButtonText}>{selectedCategory}</Text>
        <Ionicons name="chevron-down" size={16} color="#FFF" />
      </TouchableOpacity>
      
      <Modal
        transparent
        visible={modalVisible}
        animationType="none"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.categoriesContainer,
                  {
                    transform: [
                      { scale: scaleAnim }
                    ],
                    opacity: scaleAnim
                  }
                ]}
              >
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryItem,
                      selectedCategory === category && styles.selectedCategoryItem
                    ]}
                    onPress={() => {
                      onSelectCategory(category)
                      setModalVisible(false)
                    }}
                  >
                    <Text 
                      style={[
                        styles.categoryItemText,
                        selectedCategory === category && styles.selectedCategoryItemText
                      ]}
                    >
                      {category}
                    </Text>
                    {selectedCategory === category && (
                      <Ionicons name="checkmark" size={18} color="#FF4C54" />
                    )}
                  </TouchableOpacity>
                ))}
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
  return (
    <View style={styles.endOfContentContainer}>
      <Ionicons name="newspaper-outline" size={64} color='#0A84FF' />
      <Text style={styles.endOfContentTitle}>You've Reached the End</Text>
      <Text style={styles.endOfContentText}>
        That's all the shorts available in this category.
      </Text>
      <TouchableOpacity 
        style={styles.exploreArticlesButton}
        onPress={onExploreArticles}
      >
        <Text style={styles.exploreArticlesButtonText}>
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
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMoreVideos, setHasMoreVideos] = useState(true)
  
  // References
  const flatListRef = useRef(null)
  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 300,
  })
  
  // Effect to load videos when category changes
  useEffect(() => {
    loadVideos(true)
  }, [selectedCategory])
  
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
      if (reset) {
        setLoading(true)
        setLastVisible(null)
      } else {
        setLoadingMore(true)
      }
      
      console.log(`Fetching ${reset ? 'initial' : 'more'} videos...`)
      
      // Base query
      const shortsRef = collection(db, 'shorts')
      
      // Build query based on category and pagination
      let q
      
      if (selectedCategory === "All") {
        // No category filter
        if (lastVisible && !reset) {
          q = query(
            shortsRef, 
            orderBy('createdAt', 'desc'), 
            startAfter(lastVisible),
            limit(VIDEOS_PER_BATCH)
          )
        } else {
          q = query(
            shortsRef, 
            orderBy('createdAt', 'desc'), 
            limit(VIDEOS_PER_BATCH)
          )
        }
      } else {
        // With category filter
        if (lastVisible && !reset) {
          q = query(
            shortsRef, 
            where('category', '==', selectedCategory),
            orderBy('createdAt', 'desc'), 
            startAfter(lastVisible),
            limit(VIDEOS_PER_BATCH)
          )
        } else {
          q = query(
            shortsRef, 
            where('category', '==', selectedCategory),
            orderBy('createdAt', 'desc'), 
            limit(VIDEOS_PER_BATCH)
          )
        }
      }
      
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        if (reset) {
          setError(`No videos found in the ${selectedCategory} category.`)
          setVideos([])
        }
        setHasMoreVideos(false)
        return
      }
      
      // Get last document for pagination
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
      setLastVisible(lastDoc)
      
      // Parse videos data
      const shortsData = querySnapshot.docs.map(doc => {
        const data = doc.data()
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
        }
      })
      
      console.log(`Loaded ${shortsData.length} videos`)
      
      // Update videos state
      if (reset) {
        setVideos(shortsData)
      } else {
        setVideos(prev => [...prev, ...shortsData])
      }
      
      // Check if we have more videos to load
      setHasMoreVideos(shortsData.length >= VIDEOS_PER_BATCH)
      setError(null)
    } catch (err) {
      console.error('Error loading videos:', err)
      setError('Failed to load videos: ' + err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }
  
  // Load more videos when reaching the end
  const handleLoadMore = () => {
    if (!loadingMore && hasMoreVideos && videos.length > 0) {
      loadVideos(false)
    }
  }
  
  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setVideos([])
    setLastVisible(null)
    setHasMoreVideos(true)
    setCurrentIndex(0)
  }
  
  // Handle scroll event
  const handleScroll = (event) => {
    if (!event || !event.nativeEvent) return;
    
    try {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      
      // Calculate current index
      const scrollPosition = contentOffset.y;
      const currentIdx = Math.floor(scrollPosition / height);
      
      // Update current index if changed
      if (currentIdx !== currentIndex && currentIdx >= 0 && currentIdx < videos.length) {
        setCurrentIndex(currentIdx);
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
      Alert.alert(
        newLikeState ? 'Liked' : 'Unliked',
        newLikeState ? 'Short has been added to your likes' : 'Short has been removed from your likes'
      );
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
      />
    );
  }, [currentIndex, isMuted, likedVideos, likeCounts, savedVideos, commentCounts]);
  
  // Handle viewable items changed
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (!viewableItems || !viewableItems.length) return;
    
    const visibleItem = viewableItems[0];
    if (visibleItem && typeof visibleItem.index === 'number') {
      setCurrentIndex(visibleItem.index);
    }
  }, []);
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>Loading News...</Text>
      </View>
    );
  }
  
  // Render error or empty state
  if (error || !videos.length) {
    return (
      <View style={styles.centeredContainer}>
        <StatusBar style="light" />
        <Ionicons name="cloud-offline" size={64} color="#FF4C54" />
        <Text style={styles.errorTitle}>{!videos.length ? "No Videos Found" : "Error"}</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadVideos(true)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with category selector */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UptoDate Shorts</Text>
        <CategorySelector 
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategoryChange}
        />
      </View>
      
      {/* Touchable overlay for play/pause */}
      <TouchableWithoutFeedback onPress={handleTogglePlayPause}>
        <View style={styles.touchableOverlay} />
      </TouchableWithoutFeedback>
      
      {/* Video list */}
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => String(item?.id || Math.random())}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfigRef.current}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListFooterComponent={() => (
          <>
            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator color="#FFF" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            )}
            
            {!hasMoreVideos && videos.length > 0 && (
              <EndOfContentScreen onExploreArticles={navigateToArticles} />
            )}
          </>
        )}
      />
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
  muteButton: {
    position: 'absolute',
    right: -55,
    bottom: 38,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    width: width * 0.8,
    maxHeight: height * 0.6,
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  selectedCategoryItem: {
    backgroundColor: 'rgba(255,76,84,0.1)',
  },
  categoryItemText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedCategoryItemText: {
    color: '#FF4C54',
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
})