import { StyleSheet, Text, View, FlatList, ActivityIndicator, Dimensions, TouchableOpacity, Image, SafeAreaView } from 'react-native'
import React, { useEffect, useState, useRef, memo, useCallback } from 'react'
import { useEvent } from 'expo'
import { useVideoPlayer, VideoView } from 'expo-video'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { fetchCloudinaryVideos } from '@/Utlis/cloudinary'

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
  currentlyPlaying
}) => {
  const [isReady, setIsReady] = useState(false)
  const playerRef = useRef(null)
  
  // Initialize video player
  const player = useVideoPlayer(item.url, player => {
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
          if (isCurrentVideo && currentlyPlaying === index) {
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
  }, [isCurrentVideo, currentlyPlaying, isReady, index])
  
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

  return (
    <View style={styles.videoContainer}>
      <StatusBar style="light" />
      
      <View style={styles.videoWrapper}>
        <VideoView 
          style={styles.video} 
          player={player}
          allowsFullscreen
          nativeControls={false}
          
        />
      </View>
      
      {/* User info at bottom */}
      <View style={styles.userInfoContainer}>
        {item.thumbnail && (
          <Image 
            source={{ uri: item.thumbnail }} 
            style={styles.userAvatar} 
            resizeMode="cover" 
          />
        )}
        <View style={styles.userTextContainer}>
          <Text style={styles.userName}>@CameronStewart</Text>
          <Text style={styles.videoTitle}>{item.title || "Title of the News Will Appear Here...."}</Text>
        </View>
      </View>
      
      {/* Bottom action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "#FF4C54" : "white"}
          />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome5 name="comment" size={24} color="white" />
          <Text style={styles.actionText}>{item.comments || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color="white" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={24} color="white" />
          <Text style={styles.actionText}>Save</Text>
        </TouchableOpacity>
      </View>
      
      {/* Mute Button */}
      <TouchableOpacity
        style={styles.muteButton}
        onPress={() => setIsMuted(!isMuted)}
      >
        <Ionicons
          name={isMuted ? "volume-mute" : "volume-high"}
          size={24}
          color="white"
        />
      </TouchableOpacity>
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
  const [currentlyPlaying, setCurrentlyPlaying] = useState(0)
  
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
      console.log('Fetching videos from Cloudinary...')
      const videoData = await fetchCloudinaryVideos()
      console.log(`Loaded ${videoData.length} videos`)
      
      if (videoData.length === 0) {
        setError('No videos found. Please check your configuration.')
      } else {
        setVideos(videoData)
      }
    } catch (err) {
      console.error('Error loading videos:', err)
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
        if (videoPlayers.current[index]) {
          videoPlayers.current[index].play().catch(err => {
            console.log(`Error playing video at index ${index} after scroll:`, err)
          })
        }
        
        // Pause all other videos
        Object.entries(videoPlayers.current).forEach(([idx, player]) => {
          if (parseInt(idx) !== index && player && typeof player.pause === 'function') {
            player.pause().catch(() => {})
          }
        })
      }
    } catch (error) {
      console.log('Error handling viewable items change:', error)
    }
  }, [])

  const handleLike = (videoId) => {
    setLikedVideos(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }))
    
    setLikeCounts(prev => ({
      ...prev,
      [videoId]: prev[videoId] + (likedVideos[videoId] ? -1 : 1)
    }))
  }

  const renderVideo = useCallback(({ item, index }) => {
    const isCurrentVideo = index === currentIndex
    const isLiked = likedVideos[item.id] || false
    const likeCount = likeCounts[item.id] || 0
    
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
      />
    )
  }, [currentIndex, isMuted, likedVideos, likeCounts, currentlyPlaying, handleVideoPlayerReady])

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>Loading videos...</Text>
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
        <Text style={styles.headerTitle}>UptoDate</Text>
      </View>
      
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
  userInfoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#333',
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  videoTitle: {
    color: 'white',
    fontSize: 14,
  },
  actionBar: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  muteButton: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
})