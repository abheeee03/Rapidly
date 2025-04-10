import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, Image, FlatList, Dimensions, SafeAreaView, Platform, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Audio } from 'expo-av'
import { Ionicons, MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
import { db } from '../../Utlis/firebase'
import { useRouter } from 'expo-router'
import Slider from '@react-native-community/slider'

const { width, height } = Dimensions.get('window')

const LANGUAGES = [
  { code: 'marathi', label: 'मराठी', fileName: 'latest_news_marathi' },
  { code: 'hindi', label: 'हिंदी', fileName: 'latest_news_hindi' },
  { code: 'english', label: 'English', fileName: 'latest_news_english' }
]

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dvd9p28iu',
  folderPaths: {
    audio: 'top-news-audio',
    banners: 'banners'
  }
}

// Banner images from Cloudinary - using 5 random image indices
const BANNER_IMAGES = [1, 2].map(index => 
  `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/v1/${CLOUDINARY_CONFIG.folderPaths.banners}/top-news-banner-${index}.jpg`
)

// Function to get a random banner image
const getRandomBannerImage = () => {
  const randomIndex = Math.floor(Math.random() * BANNER_IMAGES.length)
  return BANNER_IMAGES[randomIndex]
}

const ListenNews = () => {
  const { theme } = useTheme()
  const router = useRouter()
  const [sound, setSound] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [error, setError] = useState(null)
  const [todayDate, setTodayDate] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('marathi')
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [languageFallbackMessage, setLanguageFallbackMessage] = useState('')
  const [topArticles, setTopArticles] = useState([])
  const [currentArticle, setCurrentArticle] = useState({
    title: 'Two Pune Cops Face Dismissal Over Negligence in Fatal Porsche Crash Probe',
    image: getRandomBannerImage(),
    views: 0,
  })
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const progressBarRef = useRef(new Animated.Value(0)).current
  
  const dropdownAnimation = useRef(new Animated.Value(0)).current
  
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
    }
  }, [sound])
  
  // Get the audio URL
  const getAudioUrl = (fileNameWithoutExt) => {
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/video/upload/${CLOUDINARY_CONFIG.folderPaths.audio}/${fileNameWithoutExt}.mp3`
  }
  
  // Fetch top articles from Firebase
  useEffect(() => {
    fetchTopArticles()
  }, [])
  useEffect(() => {
    getAudioUrl(selectedLanguage)
  }, [])
  
  const fetchTopArticles = async () => {
    try {
      setLoadingArticles(true)
      setError(null)
      
      const articlesRef = collection(db, 'articles')
      const topArticlesQuery = query(
        articlesRef,
        orderBy('views', 'desc'),
        limit(5)
      )
      
      const querySnapshot = await getDocs(topArticlesQuery)
      const articlesData = []
      
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          articlesData.push({
            id: doc.id,
            title: data.title || 'Untitled Article',
            image: getRandomBannerImage(), // Use random banner image
            views: data.views || 0,
            content: data.content || '',
            author: data.author || 'Unknown',
            category: data.category || 'General'
          })
        })
        
        setTopArticles(articlesData)
        
        // Set the first article as current if we have results
        if (articlesData.length > 0) {
          setCurrentArticle(articlesData[0])
        }
      } else {
        // If no articles, use sample data
        const sampleArticles = [
          {
            id: '1',
            title: "Two Pune Cops Face Dismissal Over Negligence in Fatal Porsche Crash Probe",
            image: getRandomBannerImage(),
            views: 245,
            content: "Two police officers in Pune face dismissal following an investigation into their handling of a fatal Porsche crash case.",
            author: "Rahul Sharma",
            category: "Local News"
          },
          {
            id: '2',
            title: "Csk vs rcb",
            image: getRandomBannerImage(),
            views: 145,
            content: "Chennai Super Kings faced Royal Challengers Bangalore in an exciting IPL match.",
            author: "Vikram Singh",
            category: "Sports"
          },
          {
            id: '3',
            title: "Chennai Super Kings vs Royal Challengers",
            image: getRandomBannerImage(),
            views: 95,
            content: "The clash between Chennai Super Kings and Royal Challengers delivered excitement and drama.",
            author: "Anand Kumar",
            category: "Sports"
          },
          {
            id: '4',
            title: "Test News Number One",
            image: getRandomBannerImage(),
            views: 45,
            content: "This is a test article to demonstrate the functionality of the news application.",
            author: "Test Author",
            category: "Technology"
          }
        ]
        setTopArticles(sampleArticles)
        setCurrentArticle(sampleArticles[0])
      }
      
      setLoadingArticles(false)
    } catch (error) {
      console.error("Error fetching top articles:", error)
      setError("Couldn't load articles. Please check your connection.")
      setLoadingArticles(false)
      
      // Fallback to sample data
      const sampleArticles = [
        {
          id: '1',
          title: "Two Pune Cops Face Dismissal Over Negligence in Fatal Porsche Crash Probe",
          image: getRandomBannerImage(),
          views: 245,
          content: "Two police officers in Pune face dismissal following an investigation.",
          author: "Rahul Sharma",
          category: "Local News"
        },
        {
          id: '2',
          title: "Csk vs rcb",
          image: getRandomBannerImage(),
          views: 145,
          content: "Chennai Super Kings faced Royal Challengers Bangalore in an IPL match.",
          author: "Vikram Singh",
          category: "Sports"
        }
      ]
      setTopArticles(sampleArticles)
      setCurrentArticle(sampleArticles[0])
    }
  }

  // Load audio when component mounts or language changes
  useEffect(() => {
    loadAudio()
  }, [selectedLanguage])

  // Update progress bar animation
  useEffect(() => {
    if (playing && duration > 0) {
      Animated.timing(progressBarRef, {
        toValue: position / duration,
        duration: 1000,
        useNativeDriver: false,
      }).start()
    }
  }, [position, duration, playing])

  // Format time helper function
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Update loadAudio function
  const loadAudio = async (languageCode = selectedLanguage, isRetry = false) => {
    try {
      setIsLoading(true)
      setError(null)
      setLanguageFallbackMessage('')
      
      if (sound) {
        await sound.unloadAsync()
      }
      
      const selectedLang = LANGUAGES.find(lang => lang.code === languageCode)
      if (!selectedLang) {
        throw new Error(`Language ${languageCode} not found`)
      }
      
      const audioFileName = selectedLang.fileName
      const audioUrl = getAudioUrl(audioFileName)
      
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        )
        
        setSound(newSound)
        setIsLoading(false)
        
        if (isRetry && languageCode !== selectedLanguage) {
          const originalLang = LANGUAGES.find(lang => lang.code === selectedLanguage)?.label
          const fallbackLang = selectedLang.label
          setLanguageFallbackMessage(`Audio in ${originalLang} not available. Using ${fallbackLang} instead.`)
        }
        
        return true
      } catch (audioError) {
        console.error('Error loading specific audio file:', audioError)
        
        if (!isRetry) {
          const otherLanguages = LANGUAGES.filter(lang => lang.code !== languageCode)
          for (const lang of otherLanguages) {
            const success = await loadAudio(lang.code, true)
            if (success) return true
          }
        }
        throw new Error('Could not load audio in any language')
      }
    } catch (error) {
      console.error('Error loading audio:', error)
      setError('Couldn\'t load audio in any language. Please try again later.')
      setIsLoading(false)
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

  // Update onPlaybackStatusUpdate function
  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      sound?.replayAsync()
    } else {
      setPosition(status.positionMillis)
      setDuration(status.durationMillis)
    }
  }

  const togglePlayback = () => {
    if (playing) {
      stopSound()
    } else {
      playSound()
    }
  }

  // Toggle language dropdown with animation
  const toggleLanguageDropdown = () => {
    const toValue = showLanguageDropdown ? 0 : 1
    
    Animated.spring(dropdownAnimation, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 40
    }).start()
    
    setShowLanguageDropdown(!showLanguageDropdown)
  }

  // Handle language selection
  const handleLanguageChange = async (language) => {
    if (playing) {
      await stopSound()
    }
    
    setSelectedLanguage(language)
    toggleLanguageDropdown()
    setLanguageFallbackMessage('')
    
    // Unload current audio
    if (sound) {
      await sound.unloadAsync()
      setSound(null)
    }
  }
  
  const selectArticle = async (article) => {
    // Stop audio playback if currently playing
    if (playing) {
      await stopSound()
    }
    
    // Update current article
    setCurrentArticle(article)
    setPlaying(false)
    
    // Unload current audio
    if (sound) {
      await sound.unloadAsync()
      setSound(null)
    }
    
    // Navigate to ArticleDetail page with article data
    router.push({
      pathname: "/screens/ArticleDetail",
      params: {
        id: article.id,
        title: article.title,
        content: article.content || "",
        image: article.image,
        author: article.author || "Unknown",
        views: article.views || 0,
        category: article.category || "General",
        date: article.createdAt ? new Date(article.createdAt).toISOString() : new Date().toISOString()
      }
    })
  }

  if (error) {
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="light" />
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: theme.text}]}>Listen to Top News</Text>
        <Text style={[styles.headerSubtitle, {color: theme.text}]}>All Top News Of The Day</Text>
      </View>
      
      {/* Main Content */}

      {/* Language Selector */}
      <View style={styles.languageContainer}>
        <View style={styles.languageSelectorRow}>
          <Text style={[styles.languageLabel, {color: theme.text}]}>Audio Language</Text>
          <TouchableOpacity 
            style={[styles.languageSelector, { backgroundColor: showLanguageDropdown ? 'rgba(0, 122, 255, 0.1)' : 'transparent', borderColor: showLanguageDropdown ? theme.accent : theme.border }]}
            onPress={toggleLanguageDropdown}
            activeOpacity={0.7}
          >
            <View style={styles.languageRow}>
              <MaterialCommunityIcons name="translate" size={18} color={theme.accent} style={{marginRight: 8}} />
              <Text style={[styles.languageText, {color: theme.text}]}>
                {LANGUAGES.find(lang => lang.code === selectedLanguage)?.label}
              </Text>
            </View>
            <MaterialIcons 
              name={showLanguageDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={22} 
              color={theme.text} 
            />
          </TouchableOpacity>
        </View>
        
        <Animated.View style={[
          styles.dropdownContainer,
          {
            opacity: dropdownAnimation,
            transform: [{ 
              scaleY: dropdownAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            }],
            display: showLanguageDropdown ? 'flex' : 'none'
          }
        ]}>
          <View style={[styles.dropdown, {
            backgroundColor: theme.cardBackground || '#1E1E1E',
            borderColor: theme.border || '#333333'
          }]}>
            {LANGUAGES.map(language => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.dropdownItem,
                  { borderBottomColor: theme.border || '#333333' },
                  selectedLanguage === language.code && [styles.selectedDropdownItem, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]
                ]}
                onPress={() => handleLanguageChange(language.code)}
                activeOpacity={0.7}
              >
                <View style={styles.languageOptionRow}>
                  {selectedLanguage === language.code && (
                    <View style={[styles.activeDot, { backgroundColor: theme.accent || '#007AFF' }]} />
                  )}
                  <Text style={[
                    styles.dropdownText, 
                    {color: theme.text},
                    selectedLanguage === language.code && styles.selectedLanguageText
                  ]}>
                    {language.label}
                  </Text>
                </View>
                {selectedLanguage === language.code && (
                  <Ionicons name="checkmark" size={18} color={theme.accent || '#007AFF'} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Article Card */}
        <View style={[styles.currentArticleCard, {backgroundColor: theme.cardBackground}]}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: currentArticle.image }} 
              style={[styles.articleImage, {backgroundColor: theme.background}]}
              resizeMode="cover"
            />
          </View>
          
          {/* Audio Controls Container */}
          <View style={[styles.audioControlsContainer, { backgroundColor: theme.cardBackground }]}>
            {/* Play Button */}
            <TouchableOpacity
              style={[styles.playButton, {backgroundColor: theme.accent}]}
              onPress={togglePlayback}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color={theme.text} />
              ) : (
                <Ionicons 
                  name={playing ? "pause" : "play"} 
                  size={32} 
                  color='white'
                />
              )}
            </TouchableOpacity>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: theme.accent,
                    width: progressBarRef.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]} 
              />
              <View style={[styles.progressBackground, { backgroundColor: theme.border }]} />
            </View>
            
            {/* Time Display */}
            <View style={styles.timeContainer}>
              <Text style={[styles.timeText, { color: theme.text }]}>{formatTime(position)}</Text>
              <Text style={[styles.timeText, { color: theme.text }]}>{formatTime(duration)}</Text>
            </View>
          </View>
        </View>
        
        {/* Status Message */}
        {languageFallbackMessage ? (
          <View style={[styles.fallbackMessageContainer, {backgroundColor: theme.background}]}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.text} style={{marginRight: 8}} />
            <Text style={[styles.fallbackMessageText, {color: theme.text}]}>
              {languageFallbackMessage}
            </Text>
          </View>
        ) : null}
        
        {/* Top Articles Section */}
        <View style={styles.topArticlesSection}>
          <Text style={[styles.topArticlesTitle, {color: theme.text}]}>Other Top Articles:</Text>
          
          {loadingArticles ? (
            <View style={styles.loadingArticles}>
              <ActivityIndicator size="small" color={theme.text} />
              <Text style={[styles.loadingArticlesText, {color: theme.text}]}>Loading articles...</Text>
            </View>
          ) : (
            <View style={[styles.articlesList, {backgroundColor: theme.background}]}>
              {topArticles.map((article, index) => (
                <TouchableOpacity 
                  key={article.id} 
                  style={[
                    styles.articleItem
                  ]}
                  onPress={() => selectArticle(article)}
                >
                  <Text style={[styles.articleTitle, {color: theme.text}]}>{article.title}</Text>
                  <Text style={[styles.articleViews, {color: theme.text}]}>{article.views} views</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ListenNews

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999999',
    marginTop: 5,
    fontFamily: 'Inter-Regular',
  },
  scrollView: {
    flex: 1,
  },
  currentArticleCard: {
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
  },
  articleImage: {
    width: '100%',
    height: 200,
  },
  audioControlsContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  progressBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  playButton: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  languageContainer: {
    marginHorizontal: 20,
    marginVertical: 15,
    zIndex: 10,
  },
  languageSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 130,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 45,
    right: 0,
    zIndex: 20,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdown: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  languageOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  selectedDropdownItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  selectedLanguageText: {
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  fallbackMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderRadius: 8,
  },
  fallbackMessageText: {
    fontSize: 14,
    color: '#FFC107',
    fontFamily: 'Inter-Regular',
  },
  topArticlesSection: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 30,
  },
  topArticlesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    fontFamily: 'Inter-Bold',
  },
  articlesList: {
    // borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  articleItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  selectedArticleItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  articleTitle: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'Inter-Regular',
  },
  articleViews: {
    fontSize: 14,
    color: '#999999',
    marginTop: 5,
    fontFamily: 'Inter-Regular',
  },
  loadingArticles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingArticlesText: {
    fontSize: 14,
    color: '#999999',
    marginLeft: 10,
    fontFamily: 'Inter-Regular',
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
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 3,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  }
})