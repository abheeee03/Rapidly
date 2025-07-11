import { StyleSheet, Text, View, Dimensions, ActivityIndicator, TouchableOpacity, SafeAreaView, Platform, Modal, ScrollView } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore'
import { StatusBar } from 'expo-status-bar'
import { db } from '../../Utlis/firebase'
import { useLocalSearchParams, router } from 'expo-router'
import ArticleCard from '../../components/ArticleCard'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  runOnJS
} from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import PagerView from 'react-native-pager-view'

const { width, height } = Dimensions.get('window')
const ARTICLES_PER_BATCH = 5 // Increased for better stack experience

// Maximum number of visible cards in the stack
const MAX_VISIBLE_CARDS = 3

const Articles = () => {
  const { theme } = useTheme()
  const [articles, setArticles] = useState([])
  const [allArticles, setAllArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMoreArticles, setHasMoreArticles] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categories, setCategories] = useState([
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
  ])
  
  // Animation values
  const isAnimating = useRef(false)
  
  const pagerRef = useRef(null)
  
  // Fetch initial articles
  useEffect(() => {
    fetchArticles(true)
    
    // Clean up function
    return () => {
      // Cancel any pending operations if component unmounts
    }
  }, [])
  
  // Re-fetch articles when category changes (except for "All")
  useEffect(() => {
    if (!loading && selectedCategory !== 'All') {
      fetchArticlesByCategory();
    } else if (!loading && selectedCategory === 'All') {
      // For "All" category, we can just show all articles we've already loaded
      setArticles(allArticles);
      setHasMoreArticles(true);
      
      // Reset current index
      setCurrentIndex(0);
    }
  }, [selectedCategory]);
  
  // Fetch articles filtered by category
  const fetchArticlesByCategory = async () => {
    try {
      setLoading(true);
      console.log(`Fetching articles for category: ${selectedCategory}`);
      
      const articlesRef = collection(db, 'articles');
      const categoryQuery = query(
        articlesRef,
        where('category', '==', selectedCategory),
        orderBy('createdAt', 'desc'),
        limit(10) // Load more for categories since we're doing a direct query
      );
      
      const querySnapshot = await getDocs(categoryQuery);
      const articlesByCategoryData = [];
      
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          articlesByCategoryData.push({
            id: doc.id,
            title: data.title || 'Untitled Article',
            description: data.description || '',
            content: data.content || '',
            coverImage: data.coverImage || 'https://via.placeholder.com/800x400?text=No+Image',
            category: data.category || 'News',
            createdAt: data.createdAt || new Date(),
            likes: data.likes || 0,
            views: data.views || 0
          });
        });
        
        setArticles(articlesByCategoryData);
      } else {
        // No articles found for this category
        setArticles([]);
      }
      
      // We're not doing pagination for category-specific views
      setHasMoreArticles(false);
      
      // Reset current index
      setCurrentIndex(0);
      setLoading(false);
    } catch (error) {
      console.error(`Error fetching articles for category ${selectedCategory}:`, error);
      setError("Couldn't load articles. Please check your connection.");
      setLoading(false);
    }
  };
  
  // Load more articles
  const loadMoreArticles = () => {
    if (!hasMoreArticles || loadingMore || currentIndex < articles.length - 2) return;
    console.log('Loading more articles...');
    fetchMoreArticles();
  };
  
  // Handle going to the next article
  const goToNextArticle = () => {
    if (isAnimating.current) return;
    
    if (currentIndex >= articles.length - 1) {
      // If we're at the last article, try to load more
      if (hasMoreArticles && !loadingMore) {
        loadMoreArticles();
      }
      return;
    }
    
    isAnimating.current = true;
    
    // Preload more articles if needed
    if (currentIndex >= articles.length - 3 && hasMoreArticles && !loadingMore) {
      loadMoreArticles();
    }
    
    // Move to next article
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      isAnimating.current = false;
    }, 300);
  };
  
  // Handle going to the previous article
  const goToPreviousArticle = () => {
    if (isAnimating.current || currentIndex <= 0) return;
    
    isAnimating.current = true;
    
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1);
      isAnimating.current = false;
    }, 300);
  };
  
  // Fetch articles from Firebase
  const fetchArticles = async (isInitialFetch = false) => {
    try {
      setError(null)
      if (isInitialFetch) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      console.log("Fetching articles from Firebase...")
      
      const articlesRef = collection(db, 'articles')
      let articlesQuery
      
      if (isInitialFetch) {
        articlesQuery = query(
          articlesRef, 
          orderBy('createdAt', 'desc'),
          limit(ARTICLES_PER_BATCH)
        )
      }
      
      const querySnapshot = await getDocs(articlesQuery)
      const articlesData = []
      
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          // Ensure all required fields exist to prevent runtime errors
          articlesData.push({
            id: doc.id,
            title: data.title || 'Untitled Article',
            description: data.description || '',
            content: data.content || '',
            coverImage: data.coverImage || 'https://via.placeholder.com/800x400?text=No+Image',
            category: data.category || 'News',
            createdAt: data.createdAt || new Date(),
            likes: data.likes || 0,
            views: data.views || 0
          })
        })
        
        // Save the last document for pagination
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
        setLastDoc(lastVisible)
      } else {
        console.log("No more articles to load")
        setHasMoreArticles(false)
      }
      
      // If no articles in Firebase, use sample data
      if (articlesData.length === 0 && isInitialFetch) {
        console.log("No articles found in Firestore, using sample data")
        const sampleArticles = [
          {
            id: '1',
            title: "India's 3rd Moon mission Chandrayaan-3 successfully launched",
            description: "The Indian Space Research Organisation (ISRO) successfully launched Chandrayaan-3, India's third Moon mission.",
            content: "The Indian Space Research Organisation (ISRO) on Friday successfully launched Chandrayaan-3, India's third Moon mission. It was launched by LVM3 from the Satish Dhawan Space Centre in Sriharikota. The mission objectives of Chandrayaan-3 are to demonstrate safe and soft landing on lunar surface, to demonstrate rover roving on the moon and to conduct in-situ scientific experiments.",
            coverImage: "https://res.cloudinary.com/dvd9p28iu/image/upload/v1743164658/uptodate-articles/mlr6nex6tdyx8zqxq6hv.png",
            category: "Technology",
            createdAt: new Date(),
            likes: 145,
            views: 1230
          },
          {
            id: '2',
            title: "Global Climate Summit Reaches Historic Agreement",
            description: "World leaders have reached a landmark agreement on reducing carbon emissions at the Global Climate Summit.",
            content: "In a historic move, representatives from over 190 countries have signed a binding agreement to reduce carbon emissions by 50% by 2030 at the Global Climate Summit. The agreement includes financial commitments from developed nations to support renewable energy transitions in developing countries. Environmental experts are calling this 'the most significant climate action since the Paris Agreement' and a crucial step toward limiting global warming to 1.5 degrees Celsius.",
            coverImage: "https://res.cloudinary.com/dvd9p28iu/image/upload/v1743164658/uptodate-articles/climate-summit.jpg",
            category: "Politics",
            createdAt: new Date(),
            likes: 89,
            views: 750
          },
          {
            id: '3',
            title: "New Study Reveals Benefits of Mediterranean Diet",
            description: "Researchers have found additional health benefits from following a Mediterranean diet, including improved brain function.",
            content: "A comprehensive 10-year study published in the Journal of Nutrition has revealed that following a Mediterranean diet not only reduces the risk of heart disease but also significantly improves cognitive function and reduces the risk of Alzheimer's disease. The study, which followed over 4,000 participants aged 65 and older, found that those strictly adhering to the diet rich in olive oil, nuts, fish, fruits, and vegetables showed 28% better cognitive scores than those following other diets. Scientists attribute these benefits to the anti-inflammatory properties of the foods and their positive impact on gut microbiome diversity.",
            coverImage: "https://res.cloudinary.com/dvd9p28iu/image/upload/v1743164658/uptodate-articles/mediterranean-diet.jpg",
            category: "Health",
            createdAt: new Date(),
            likes: 215,
            views: 1875
          }
        ]
        setAllArticles(sampleArticles)
        setArticles(sampleArticles)
        setHasMoreArticles(false)
      } else if (isInitialFetch) {
        console.log(`Successfully loaded ${articlesData.length} articles from Firestore`)
        setAllArticles(articlesData)
        setArticles(articlesData)
      } else {
        console.log(`Loaded ${articlesData.length} more articles from Firestore`)
        setAllArticles(prev => [...prev, ...articlesData])
        // If All is selected, also update the displayed articles
        if (selectedCategory === 'All') {
          setArticles(prev => [...prev, ...articlesData])
        }
      }
      
      if (isInitialFetch) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }

      // Extract unique categories from articles - add to preset categories
      if (articlesData.length > 0) {
        const newCategories = articlesData
          .map(article => article.category)
          .filter(category => category && !categories.includes(category));
          
        if (newCategories.length > 0) {
          setCategories(prev => [...prev, ...newCategories]);
        }
      }
    } catch (error) {
      console.error("Error fetching articles: ", error)
      setError("Couldn't load articles. Please check your connection.")
      
      // Fall back to sample data in case of error during initial load
      if (isInitialFetch) {
        const sampleArticles = [
          {
            id: '1',
            title: "India's 3rd Moon mission Chandrayaan-3 successfully launched",
            description: "The Indian Space Research Organisation (ISRO) successfully launched Chandrayaan-3, India's third Moon mission.",
            content: "The Indian Space Research Organisation (ISRO) on Friday successfully launched Chandrayaan-3, India's third Moon mission. It was launched by LVM3 from the Satish Dhawan Space Centre in Sriharikota. The mission objectives of Chandrayaan-3 are to demonstrate safe and soft landing on lunar surface, to demonstrate rover roving on the moon and to conduct in-situ scientific experiments.",
            coverImage: "https://res.cloudinary.com/dvd9p28iu/image/upload/v1743164658/uptodate-articles/mlr6nex6tdyx8zqxq6hv.png",
            category: "Technology",
            createdAt: new Date(),
            likes: 145,
            views: 1230
          }
        ]
        setAllArticles(sampleArticles)
        setArticles(sampleArticles)
        setHasMoreArticles(false)
      }
      
      if (isInitialFetch) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }
  
  // Fetch more articles for pagination
  const fetchMoreArticles = async () => {
    if (!hasMoreArticles || loadingMore || !lastDoc || selectedCategory !== 'All') return
    
    try {
      setLoadingMore(true)
      
      const articlesRef = collection(db, 'articles')
      const nextQuery = query(
        articlesRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(ARTICLES_PER_BATCH)
      )
      
      const querySnapshot = await getDocs(nextQuery)
      const articlesData = []
      
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          articlesData.push({
            id: doc.id,
            title: data.title || 'Untitled Article',
            description: data.description || '',
            content: data.content || '',
            coverImage: data.coverImage || 'https://via.placeholder.com/800x400?text=No+Image',
            category: data.category || 'News',
            createdAt: data.createdAt || new Date(),
            likes: data.likes || 0,
            views: data.views || 0
          })
        })
        
        // Save the last document for next pagination
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
        setLastDoc(lastVisible)
        
        console.log(`Loaded ${articlesData.length} more articles from Firestore`)
        setAllArticles(prev => [...prev, ...articlesData])
        // Only update displayed articles if All is selected
        if (selectedCategory === 'All') {
          setArticles(prev => [...prev, ...articlesData])
        }
        
        // Extract and add new categories if any
        if (articlesData.length > 0) {
          const newCategories = articlesData
            .map(article => article.category)
            .filter(category => !categories.includes(category));
            
          if (newCategories.length > 0) {
            setCategories(prev => [...prev, ...newCategories]);
          }
        }
      } else {
        console.log("No more articles to load")
        setHasMoreArticles(false)
      }
      
      setLoadingMore(false)
    } catch (error) {
      console.error("Error fetching more articles: ", error)
      setLoadingMore(false)
    }
  }
  
  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
  };
  
  // Handle page change
  const handlePageChange = (event) => {
    const newIndex = event.nativeEvent.position
    setCurrentIndex(newIndex)
    
    // Load more articles when approaching the end
    if (newIndex >= articles.length - 2 && hasMoreArticles && !loadingMore) {
      loadMoreArticles()
    }
  }

  // Go to specific page
  const goToPage = (index) => {
    if (pagerRef.current) {
      pagerRef.current.setPage(index)
    }
  }

  // Render the stacked articles
  const renderArticleStack = () => {
    if (articles.length === 0) {
      return (
        <View style={styles.noArticlesContainer}>
          <Ionicons name="newspaper-outline" size={64} color={theme.accent} />
          <Text style={[styles.noArticlesTitle, { color: theme.text, fontFamily: theme.titleFont }]}>
            No News for Selected Category
          </Text>
          <Text style={[styles.noArticlesMessage, { color: theme.textSecondary, fontFamily: theme.font }]}>
            Try selecting a different category
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.cardsContainer}>
        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={handlePageChange}
          orientation="horizontal"
          overdrag={true}
          overScrollMode="always"
          layout="stack"
          showPageIndicator={true}
          pageMargin={10}
          transitionStyle="scroll"
        >
          {articles.map((article, index) => (
            <View key={`${article.id}-${index}`} style={styles.pageContainer}>
              <ArticleCard
                article={article}
                globalIndex={index}
                cardIndex={0}
                isLastInPage={index === articles.length - 2}
                onEndReached={loadMoreArticles}
              />
            </View>
          ))}
        </PagerView>
      </View>
    )
  }

  // Navigation button row
  

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.text, fontFamily: theme.font }]}>
          Loading articles...
        </Text>
      </View>
    )
  }
  
  if (error) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <Ionicons name="cloud-offline-outline" size={64} color={theme.accent} />
        <Text style={[styles.errorTitle, { color: theme.text, fontFamily: theme.titleFont }]}>
          Connection Error
        </Text>
        <Text style={[styles.errorMessage, { color: theme.textSecondary, fontFamily: theme.font }]}>
          {error}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchArticles(true)}>
          <Text style={[styles.retryText, { fontFamily: theme.font }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: theme.titleFont }]}>
            Latest News
          </Text>
          
          {/* Category Dropdown Button */}
          <TouchableOpacity 
            style={[styles.categoryDropdown, { backgroundColor: theme.secondaryBackground + '20' }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[styles.selectedCategoryText, { color: 'white', fontFamily: theme.font }]}>
              {selectedCategory}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color='white' />
          </TouchableOpacity>
        </View>
        <Text style={[styles.swipeInstruction, { color: theme.textSecondary, fontFamily: theme.font }]}>
          Browse through article cards
        </Text>
      </View>
      
      {/* Category Selection Modal */}
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
                backgroundColor: theme.background,
                top: Platform.OS === 'ios' ? 130 : 150, // Position under header
                right: 20,
                maxHeight: height * 0.6, // Limit height to 60% of screen
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
      
      {/* Stacked Article Cards */}
      {renderArticleStack()}
      
      
      {loadingMore && (
        <Animated.View 
          style={styles.loadingMoreContainer}
          entering={FadeIn.duration(300)}
        >
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={[styles.loadingMoreText, { color: theme.textSecondary, fontFamily: theme.font }]}>
            Loading more articles...
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  )
}

export default Articles

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginTop: Platform.OS === 'ios' ? 50 : 60,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  swipeInstruction: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 5,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  selectedCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  categoryModalContent: {
    position: 'absolute',
    width: 180,
    borderRadius: 12,
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
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagerView: {
    flex: 1,
    width: '100%',
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 0,
    right: 0,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageIndicator: {
    fontSize: 14,
    fontWeight: '600',
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
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
    marginHorizontal: 20,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    marginHorizontal: 30,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noArticlesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noArticlesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  noArticlesMessage: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
})