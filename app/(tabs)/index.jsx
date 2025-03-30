import { StyleSheet, Text, View, FlatList, ActivityIndicator, Dimensions, TouchableOpacity, Image, SafeAreaView, Animated, TouchableWithoutFeedback } from 'react-native'
import React, { useEffect, useState, useRef, memo, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, FontAwesome5, MaterialCommunityIcons, AntDesign, MaterialIcons } from '@expo/vector-icons'
import { db } from '../../Utlis/firebase'
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { BlurView } from 'expo-blur'

const { width, height } = Dimensions.get('window')

// Individual video component
const VideoItem = memo(({ 
  item, 
  index, 
  isCurrentVideo, 
  isMuted, 
  setIsMuted, 
  isLiked, 
  likeCount, 
  handleLike,
  onVideoPlayerReady,
  currentlyPlaying,
  togglePlayPause,
  handleSave,
  isSaved
}) => {
  const [isReady, setIsReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const playerRef = useRef(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const pauseIconAnim = useRef(new Animated.Value(0)).current
  
  // Fade in animation when video is current
  useEffect(() => {
    if (isCurrentVideo) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start()
    } else {
      fadeAnim.setValue(0)
    }
  }, [isCurrentVideo, fadeAnim])
  
  // Initialize video player
  const player = useVideoPlayer(item.videoUrl, player => {
    if (player) {
      try {
        player.loop = true
        player.muted = isMuted
        setIsReady(true)
        playerRef.current = player
        
        // Notify parent component that player is ready
        onVideoPlayerReady(index, player)
        
        // Play immediately if this is the current video
        if (isCurrentVideo && currentlyPlaying === index) {
          player.play().catch(err => console.log('Error playing video:', err))
        }
      } catch (error) {
        console.log('Error initializing player:', error)
      }
    }
  })

  // Control video playback based on visibility
  useEffect(() => {
    const controlPlayback = async () => {
      if (isReady && playerRef.current) {
        try {
          if (isCurrentVideo && currentlyPlaying === index && !isPaused) {
            await playerRef.current.play().catch(err => {
              console.log(`Error playing video at index ${index}:`, err)
            })
          } else {
            await playerRef.current.pause().catch(err => {
              console.log(`Error pausing video at index ${index}:`, err)
            })
          }
        } catch (error) {
          console.log('Error controlling playback:', error)
        }
      }
    }
    
    controlPlayback()
  }, [isCurrentVideo, currentlyPlaying, isReady, index, isPaused])
  
  // Update player mute state when global mute changes
  useEffect(() => {
    if (isReady && playerRef.current) {
      try {
        playerRef.current.muted = isMuted
      } catch (error) {
        console.log('Error updating mute state:', error)
      }
    }
  }, [isMuted, isReady])

  // Update paused state when toggle is called from parent
  useEffect(() => {
    if (isCurrentVideo && index === currentlyPlaying) {
      setIsPaused(prevState => {
        // Show pause icon animation when going from playing to paused
        if (!prevState) {
          showPauseIcon()
        }
        return !prevState
      })
    }
  }, [togglePlayPause])
  
  // Show large pause icon when video is paused
  const showPauseIcon = () => {
    pauseIconAnim.setValue(1)
    Animated.timing(pauseIconAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }

  // Handle tap on video area
  const handleVideoPress = () => {
    setIsPaused(prevState => {
      const newPausedState = !prevState
      
      // Show pause icon animation when going from playing to paused
      if (newPausedState) {
        showPauseIcon()
      }
      
      // Update playback state
      if (newPausedState) {
        playerRef.current?.pause().catch(err => {})
      } else {
        playerRef.current?.play().catch(err => {})
      }
      
      return newPausedState
    })
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause()
          playerRef.current = null
        } catch (error) {
          console.log('Error cleaning up player:', error)
        }
      }
    }
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }
  
  // Format date if available
  const formattedDate = item?.createdAt ? formatDate(item.createdAt) : ''

  return (
    <View style={styles.videoContainer}>
      <StatusBar style="light" />
      
      {/* Video Player with tap gesture */}
      <TouchableWithoutFeedback onPress={handleVideoPress}>
        <View style={styles.videoWrapper}>
          <VideoView 
            style={styles.video} 
            player={player}
            allowsFullscreen
            nativeControls={false}
          />
          
          {/* Large Pause Icon (fades in/out) */}
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
      
      {/* YouTube Shorts style action buttons on right side */}
      <View style={styles.actionButtonsBar}>
        <TouchableOpacity 
          style={styles.actionButtonColumn} 
          onPress={() => handleLike(item.id)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <AntDesign
            name={isLiked ? "heart" : "hearto"}
            size={28}
            color={isLiked ? "red" : "white"}
          />
          <Text style={styles.actionButtonText}>{likeCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButtonColumn}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Ionicons name="chatbubble-outline" size={26} color="white" />
          <Text style={styles.actionButtonText}>{item.comments || 0}</Text>
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
      
      {/* Video Author and Info at bottom */}
      <View style={styles.videoInfoArea}>
        <View style={styles.authorRow}>
          <Text style={styles.authorName}>@{item?.uploadedBy || 'UptoDate'}</Text>
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
    </View>
  )
})

const HomeScreen = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [likedVideos, setLikedVideos] = useState({})
  const [likeCounts, setLikeCounts] = useState({})
  const [savedVideos, setSavedVideos] = useState({})
  const [currentlyPlaying, setCurrentlyPlaying] = useState(0)
  const [togglePlayPause, setTogglePlayPause] = useState(false)
  const [appIsActive, setAppIsActive] = useState(true)
  
  // Video players ref
  const videoPlayers = useRef({})
  const flatListRef = useRef(null)
  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 300
  })

  useEffect(() => {
    loadVideos()
    
    // Cleanup players on unmount
    return () => {
      try {
        Object.values(videoPlayers.current).forEach(player => {
          if (player && typeof player.pause === 'function') {
            player.pause().catch(() => {})
          }
        })
        videoPlayers.current = {}
      } catch (error) {
        console.log('Error cleaning video players:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Initialize like counts when videos load
    if (videos.length > 0) {
      const initialLikeCounts = {}
      videos.forEach(video => {
        initialLikeCounts[video.id] = video.likes || 0
      })
      setLikeCounts(initialLikeCounts)
      
      // Set initial playing index
      setCurrentlyPlaying(0)
    }
  }, [videos])

  const loadVideos = async () => {
    try {
      setLoading(true)
      console.log('Fetching videos from Firebase shorts collection...')
      
      const shortsRef = collection(db, 'shorts')
      const q = query(shortsRef, orderBy('createdAt', 'desc'), limit(20))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        setError('No videos found in the shorts collection. Please add some content.')
        setLoading(false)
        return
      }
      
      const shortsData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          videoUrl: data.videoUrl,
          title: data.title || 'Untitled Video',
          description: data.description || '',
          uploadedBy: data.uploadedBy || 'UptoDate',
          tags: data.tags || [],
          likes: data.likes || 0,
          comments: data.comments || 0,
          createdAt: data.createdAt?.toDate() || new Date()
        }
      })
      
      console.log(`Loaded ${shortsData.length} videos from shorts collection`)
      setVideos(shortsData)
    } catch (err) {
      console.error('Error loading videos from Firebase:', err)
      setError('Failed to load videos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoPlayerReady = useCallback((index, player) => {
    try {
      if (player && typeof player === 'object') {
        videoPlayers.current[index] = player
        
        // If this is the current video, make sure it plays
        if (index === currentIndex) {
          player.play().catch(err => console.log('Error playing video on ready:', err))
        }
      }
    } catch (error) {
      console.log('Error handling player ready:', error)
    }
  }, [currentIndex])

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    try {
      if (viewableItems && viewableItems.length > 0) {
        const index = viewableItems[0].index
        
        setCurrentIndex(index)
        setCurrentlyPlaying(index)
        
        // Force play the current video
        const currentPlayer = videoPlayers.current[index];
        if (currentPlayer && typeof currentPlayer.play === 'function') {
          currentPlayer.play().catch(err => {
            console.log(`Error playing video at index ${index} after scroll:`, err)
          })
        }
        
        // Pause all other videos
        Object.entries(videoPlayers.current).forEach(([idx, player]) => {
          if (parseInt(idx) !== index && player && typeof player.pause === 'function') {
            player.pause().catch(err => {
              console.log(`Error pausing other video at index ${idx}:`, err);
            });
          }
        })
      }
    } catch (error) {
      console.log('Error handling viewable items change:', error)
    }
  }, [])

  const handleLike = (videoId) => {
    const isCurrentlyLiked = likedVideos[videoId] || false;
    const newLikeState = !isCurrentlyLiked;
    
    // Update local state
    setLikedVideos(prev => ({
      ...prev,
      [videoId]: newLikeState
    }))
    
    setLikeCounts(prev => ({
      ...prev,
      [videoId]: prev[videoId] + (isCurrentlyLiked ? -1 : 1)
    }))
    
    // Update like count in Firebase
    try {
      const videoRef = doc(db, 'shorts', videoId);
      const incrementValue = newLikeState ? 1 : -1;
      
      // Use Firebase's increment function to atomically update the likes field
      const updateData = {
        likes: increment(incrementValue)
      };
      
      updateDoc(videoRef, updateData)
        .catch(error => {
          console.error('Error updating like count in Firebase:', error);
          // Revert local state if Firebase update fails
          setLikedVideos(prev => ({
            ...prev,
            [videoId]: isCurrentlyLiked
          }));
          setLikeCounts(prev => ({
            ...prev,
            [videoId]: prev[videoId] + (isCurrentlyLiked ? 1 : -1)
          }));
        });
    } catch (error) {
      console.error('Error preparing Firebase like update:', error);
    }
  }

  // Handle video save
  const handleSave = (videoId) => {
    setSavedVideos(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
    
    // In a real app, you would save this to a user's Firebase profile
    console.log(`Video ${savedVideos[videoId] ? 'unsaved' : 'saved'}: ${videoId}`);
  };

  // Handle app focus changes
  useFocusEffect(
    useCallback(() => {
      // When screen comes into focus
      setAppIsActive(true)
      
      // Play the current video if it was paused due to tab change
      if (videoPlayers.current[currentlyPlaying]) {
        try {
          const player = videoPlayers.current[currentlyPlaying];
          if (player && typeof player.play === 'function' && !togglePlayPause) {
            player.play().catch(err => console.log('Error resuming video after focus:', err));
          }
        } catch (error) {
          console.log('Error handling focus play:', error);
        }
      }
      
      return () => {
        // When screen goes out of focus (user navigates away)
        setAppIsActive(false)
        
        // Pause all videos
        try {
          Object.entries(videoPlayers.current).forEach(([idx, player]) => {
            if (player && typeof player.pause === 'function') {
              player.pause().catch(err => console.log(`Error pausing video ${idx} on blur:`, err));
            }
          });
        } catch (error) {
          console.log('Error pausing videos on blur:', error);
        }
      }
    }, [currentlyPlaying, togglePlayPause])
  )
  
  // Toggle play/pause
  const handleTogglePlayPause = () => {
    setTogglePlayPause(prev => !prev)
  }

  const renderVideo = useCallback(({ item, index }) => {
    const isCurrentVideo = index === currentIndex
    const isLiked = likedVideos[item.id] || false
    const likeCount = likeCounts[item.id] || 0
    const isSaved = savedVideos[item.id] || false
    
    return (
      <VideoItem
        key={item.id}
        item={item}
        index={index}
        isCurrentVideo={isCurrentVideo}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isLiked={isLiked}
        likeCount={likeCount}
        handleLike={handleLike}
        onVideoPlayerReady={handleVideoPlayerReady}
        currentlyPlaying={currentlyPlaying}
        togglePlayPause={togglePlayPause}
        handleSave={handleSave}
        isSaved={isSaved}
      />
    )
  }, [currentIndex, isMuted, likedVideos, likeCounts, savedVideos, currentlyPlaying, handleVideoPlayerReady, togglePlayPause])

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>Loading News...</Text>
      </View>
    )
  }

  if (error || videos.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <StatusBar style="light" />
        <Ionicons name="cloud-offline" size={64} color="#FF4C54" />
        <Text style={styles.errorTitle}>{videos.length === 0 ? "No Videos Found" : "Error"}</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadVideos}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* App Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UptoDate Shorts</Text>
      </View>
      
      <TouchableWithoutFeedback onPress={handleTogglePlayPause}>
        <View style={styles.touchableOverlay} />
      </TouchableWithoutFeedback>
      
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="center"
        decelerationRate="normal"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfigRef.current}
        initialNumToRender={2}
        maxToRenderPerBatch={1}
        windowSize={3}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />
    </SafeAreaView>
  )
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    zIndex: 10,
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
})