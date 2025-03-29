import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Audio } from 'expo-av'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import { BlurView } from 'expo-blur'

const LANGUAGES = [
  { code: 'marathi', label: 'मराठी', fileName: 'latest_news_marathi' },
  { code: 'hindi', label: 'हिंदी', fileName: 'latest_news_hindi' },
  { code: 'english', label: 'English', fileName: 'latest_news_english' }
]

const ListenNews = () => {
  const { theme } = useTheme()
  const [sound, setSound] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [todayDate, setTodayDate] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('marathi')
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const waveAnimation = useRef(new Animated.Value(0)).current
  const [languageFallbackMessage, setLanguageFallbackMessage] = useState('')
  
  // Animation for the waves
  const waveAnimationSequence = useRef()
  
  // Cloudinary configuration
  const cloudName = 'dvd9p28iu' // From your Cloudinary config
  const folderPath = 'top-news-audio'
  
  // Get the current audio file based on language
  const getAudioFile = () => {
    const language = LANGUAGES.find(lang => lang.code === selectedLanguage)
    return language ? language.fileName : 'latest_news_marathi'
  }
  
  // Get the audio URL
  const getAudioUrl = (fileNameWithoutExt) => {
    return `https://res.cloudinary.com/${cloudName}/video/upload/${folderPath}/${fileNameWithoutExt}.mp3`
  }
  
  // Headline for the news based on language
  const getHeadline = () => {
    switch (selectedLanguage) {
      case 'marathi':
        return 'आजच्या टॉप बातम्या'
      case 'hindi':
        return 'आज की प्रमुख खबरें'
      case 'english':
        return 'Today\'s Top Headlines'
      default:
        return 'आजच्या टॉप बातम्या'
    }
  }

  // Format today's date
  useEffect(() => {
    const today = new Date()
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    setTodayDate(today.toLocaleDateString('en-US', options))
  }, [])

  // Cleanup sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync()
      }
      // Clear any animations
      if (waveAnimationSequence.current) {
        waveAnimationSequence.current.stop()
      }
    }
  }, [sound])
  
  // Handle wave animation when playing changes
  useEffect(() => {
    if (playing) {
      // Start animation sequence when playing
      waveAnimationSequence.current = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false
          }),
          Animated.timing(waveAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false
          })
        ])
      )
      waveAnimationSequence.current.start()
    } else {
      // Stop animation when not playing
      if (waveAnimationSequence.current) {
        waveAnimationSequence.current.stop()
      }
      // Reset to initial value
      waveAnimation.setValue(0)
    }
  }, [playing, waveAnimation])

  // Attempt to load audio with fallback to other languages if needed
  const loadAudio = async (languageCode = selectedLanguage, isRetry = false) => {
    try {
      setLoading(true)
      setError(null)
      setLanguageFallbackMessage('')
      
      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync()
      }
      
      // Find language object based on language code
      const selectedLang = LANGUAGES.find(lang => lang.code === languageCode)
      if (!selectedLang) {
        throw new Error(`Language ${languageCode} not found`)
      }
      
      const audioFileName = selectedLang.fileName
      const audioUrl = getAudioUrl(audioFileName)
      
      console.log('Loading audio from:', audioUrl)
      
      try {
        // Pre-load the audio file
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        )
        
        setSound(newSound)
        setLoading(false)
        
        // If we fell back to a different language, inform the user
        if (isRetry && languageCode !== selectedLanguage) {
          const originalLang = LANGUAGES.find(lang => lang.code === selectedLanguage)?.label
          const fallbackLang = selectedLang.label
          setLanguageFallbackMessage(`Audio in ${originalLang} not available. Another Language instead.`)
        }
        
        return true
      } catch (audioError) {
        console.error('Error loading specific audio file:', audioError)
        
        // If this isn't already a retry attempt, try other languages
        if (!isRetry) {
          // Try other languages in sequence (filter out current language)
          const otherLanguages = LANGUAGES.filter(lang => lang.code !== languageCode)
          
          // Try each alternative language
          for (const lang of otherLanguages) {
            console.log(`Trying fallback language: ${lang.code}`)
            const success = await loadAudio(lang.code, true)
            if (success) return true
          }
        }
        
        // If we get here during a retry, just throw to trigger the outer catch
        throw new Error('Could not load audio in any language')
      }
    } catch (error) {
      console.error('Error loading audio:', error)
      setError('Couldn\'t load audio in any language. Please try again later.')
      setLoading(false)
      return false
    }
  }

  const playSound = async () => {
    try {
      if (!sound) {
        // Load audio first if not loaded
        const success = await loadAudio()
        if (!success) return
      }
      
      if (sound) {
        await sound.playFromPositionAsync(0)
        setPlaying(true)
      }
    } catch (error) {
      console.error('Error playing sound:', error)
      setError('Failed to play audio. Please try again.')
    }
  }

  const stopSound = async () => {
    if (!sound) return
    
    try {
      await sound.pauseAsync()
      setPlaying(false)
    } catch (error) {
      console.error('Error stopping sound:', error)
    }
  }

  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      // Restart the audio when it finishes
      sound.replayAsync()
    }
  }

  const togglePlayback = () => {
    if (playing) {
      stopSound()
    } else {
      playSound()
    }
  }

  const handleLanguageChange = async (language) => {
    if (playing) {
      await stopSound()
    }
    
    setSelectedLanguage(language)
    setShowLanguageDropdown(false)
    setLanguageFallbackMessage('')
    
    // Unload current audio
    if (sound) {
      await sound.unloadAsync()
      setSound(null)
    }
  }

  const getWaveBaseHeight = (index) => {
    // Create a pattern where middle bars are taller
    const position = Math.abs(index - 5.5)
    return 40 - position * 4
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={64} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.accent }]} 
            onPress={() => loadAudio()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Date Display */}
        <Text style={[styles.dateText, { color: theme.textSecondary }]}>
          {todayDate}
        </Text>
        
        {/* Language Selector */}
        <View style={styles.languageContainer}>
          <TouchableOpacity 
            style={[styles.languageSelector, { borderColor: theme.border }]}
            onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
          >
            <Text style={[styles.languageText, { color: theme.text }]}>
              {LANGUAGES.find(lang => lang.code === selectedLanguage)?.label}
            </Text>
            <MaterialIcons 
              name={showLanguageDropdown ? "arrow-drop-up" : "arrow-drop-down"} 
              size={24} 
              color={theme.text} 
            />
          </TouchableOpacity>
          
          {showLanguageDropdown && (
            <View style={[styles.dropdown, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              {LANGUAGES.map(language => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.dropdownItem,
                    selectedLanguage === language.code && { backgroundColor: theme.accentLight }
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <Text style={[styles.dropdownText, { color: theme.text }]}>
                    {language.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {/* Fallback Message */}
        {languageFallbackMessage ? (
          <View style={styles.fallbackMessageContainer}>
            <Text style={[styles.fallbackMessageText, { color: theme.text }]}>
              {languageFallbackMessage}
            </Text>
          </View>
        ) : null}
        
        {/* Headline */}
        <Text style={[styles.headline, { color: theme.text }]}>
          {getHeadline()}
        </Text>
        
        {/* Audio Wave Animation */}
        <View style={styles.waveContainer}>
          {[...Array(12)].map((_, index) => {
            const baseHeight = getWaveBaseHeight(index)
            const height = waveAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [baseHeight, baseHeight + 20 + Math.random() * 20]
            })
            
            return (
              <Animated.View 
                key={index} 
                style={[
                  styles.waveLine, 
                  { 
                    height,
                    backgroundColor: playing ? theme.accent : theme.border,
                    marginHorizontal: 3
                  }
                ]} 
              />
            )
          })}
        </View>
        
        {/* Play Button */}
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: playing ? theme.error : theme.accent }]}
          onPress={togglePlayback}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <Ionicons 
              name={playing ? "pause" : "play"} 
              size={64} 
              color="#FFFFFF" 
            />
          )}
        </TouchableOpacity>
        
        {/* Status Text */}
        <Text style={[styles.statusText, { color: theme.textSecondary }]}>
          {loading ? 'Loading audio...' : playing ? 'Now Playing' : 'Press Play to Listen'}
        </Text>
        
      </View>
    </View>
  )
}

export default ListenNews

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 10,
  },
  languageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 10,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    width: 140,
  },
  languageText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  dropdown: {
    position: 'absolute',
    top: 45,
    width: 140,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  dropdownItem: {
    padding: 12,
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  fallbackMessageContainer: {
    marginBottom: 15,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 204, 0, 0.15)',
    borderRadius: 8,
  },
  fallbackMessageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  headline: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 80,
    marginBottom: 40,
  },
  waveLine: {
    width: 6,
    borderRadius: 8,
  },
  playButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 30,
  },
  statusText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    marginBottom: 20,
  },
  infoBlur: {
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  }
})