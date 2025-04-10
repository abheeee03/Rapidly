import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { Video } from 'expo-av'
import { useTheme } from '../context/ThemeContext'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  FadeIn,
  SlideInRight,
  runOnJS
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'

const { width, height } = Dimensions.get('window')

const VideoItem = ({
  video,
  isCurrentVideo,
  isMuted,
  setIsMuted,
  isLiked,
  likeCount,
  handleLike,
  handleSave,
  isSaved,
  onCommentAdded
}) => {
  const { theme } = useTheme()
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const controlsTimeout = useRef(null)
  const progressBarWidth = useSharedValue(0)

  useEffect(() => {
    if (isCurrentVideo) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
      setProgress(0)
      progressBarWidth.value = 0
    }
  }, [isCurrentVideo])

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current)
      }
    }
  }, [])

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        setIsPlaying(false)
        setProgress(0)
        progressBarWidth.value = 0
      } else {
        const newProgress = status.positionMillis / status.durationMillis
        setProgress(newProgress)
        progressBarWidth.value = newProgress
      }
    }
  }

  const handleVideoPress = () => {
    setIsPlaying(!isPlaying)
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

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progressBarWidth.value * 100}%`,
    }
  })

  const controlsStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showControls ? 1 : 0, { duration: 300 }),
    }
  })

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleVideoPress}
        style={styles.videoWrapper}
      >
        <Video
          ref={videoRef}
          source={{ uri: video.videoUrl }}
          style={styles.video}
          resizeMode="cover"
          shouldPlay={isPlaying}
          isLooping={false}
          isMuted={isMuted}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onLoad={(status) => {
            setDuration(status.durationMillis)
          }}
        />
        
        <Animated.View style={[styles.progressBarContainer, controlsStyle]}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressBarFill,
                progressBarStyle,
                { backgroundColor: theme.accent }
              ]} 
            />
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.controls, controlsStyle]}>
          <View style={styles.topControls}>
            <View style={styles.userInfo}>
              <Text style={[styles.username, { color: 'white', fontFamily: theme.font }]}>
                {video.username}
              </Text>
              <Text style={[styles.caption, { color: 'white', fontFamily: theme.font }]}>
                {video.caption}
              </Text>
            </View>
          </View>
          
          <View style={styles.rightControls}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                handleLike(video.id)
                showControlsTemporarily()
              }}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={28}
                color={isLiked ? theme.accent : 'white'}
              />
              <Text style={[styles.actionText, { color: 'white', fontFamily: theme.font }]}>
                {likeCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setIsMuted(!isMuted)
                showControlsTemporarily()
              }}
            >
              <Ionicons
                name={isMuted ? "volume-mute" : "volume-high"}
                size={28}
                color="white"
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                handleSave(video.id)
                showControlsTemporarily()
              }}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={28}
                color={isSaved ? theme.accent : 'white'}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  )
}

export default VideoItem

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBarFill: {
    height: '100%',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
    marginRight: 20,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    opacity: 0.9,
  },
  rightControls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    fontSize: 12,
    marginTop: 4,
  },
}) 