import { StyleSheet, Text, View, FlatList, ActivityIndicator, Dimensions, TouchableOpacity, Image, TextInput } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Video } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { fetchCloudinaryVideos } from '@/Utlis/cloudinary';

const { width, height } = Dimensions.get('window');

// Video sort options
const SORT_OPTIONS = {
  RANDOM: 'random',
  LATEST: 'latest',
  OLDEST: 'oldest'
};

const HomeScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const [videos, setVideos] = useState([]);
  const [originalVideos, setOriginalVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const [folderPath, setFolderPath] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.RANDOM);

  useEffect(() => {
    loadVideos();
  }, []);

  // Apply sorting to videos whenever sort option changes
  useEffect(() => {
    if (originalVideos.length > 0) {
      sortVideos(sortOption);
    }
  }, [sortOption, originalVideos]);

  const loadVideos = async (folder = folderPath) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching videos from folder: "${folder}"`);
      
      // Fetch videos from Cloudinary
      const videoData = await fetchCloudinaryVideos(folder);
      console.log(`Found ${videoData.length} videos from Cloudinary`);
      
      // Store original videos for sorting
      setOriginalVideos(videoData);
      
      // Sort videos based on current sort option
      sortVideos(sortOption, videoData);
      
      if (videoData.length === 0) {
        setError(`No videos found in folder "${folder || 'root'}"`);
      }
    } catch (err) {
      console.error('Error loading Cloudinary videos:', err);
      setError('Failed to load videos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortVideos = (option, videosToSort = originalVideos) => {
    if (!videosToSort || videosToSort.length === 0) return;
    
    let sortedVideos = [...videosToSort];
    
    switch (option) {
      case SORT_OPTIONS.RANDOM:
        // Fisher-Yates shuffle algorithm
        for (let i = sortedVideos.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [sortedVideos[i], sortedVideos[j]] = [sortedVideos[j], sortedVideos[i]];
        }
        break;
      case SORT_OPTIONS.LATEST:
        // Sort by created_at date, newest first
        sortedVideos.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
          const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
          return dateB - dateA;
        });
        break;
      case SORT_OPTIONS.OLDEST:
        // Sort by created_at date, oldest first
        sortedVideos.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
          const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
          return dateA - dateB;
        });
        break;
    }
    
    setVideos(sortedVideos);
    setCurrentIndex(0); // Reset to first video after sorting
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const formatBytes = (bytes) => {
    if (!bytes) return 'Unknown size';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };
  
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderVideo = ({ item, index }) => {
    const isCurrentVideo = index === currentIndex;
    
    return (
      <View style={styles.videoContainer}>
        <StatusBar hidden />
        <Video
          source={{ uri: item.url }}
          posterSource={{ uri: item.thumbnail }}
          usePoster={true}
          rate={1.0}
          volume={isMuted ? 0 : 1}
          muted={isMuted}
          resizeMode="cover"
          shouldPlay={isCurrentVideo}
          isLooping
          style={styles.video}
        />
        
        {/* Video Overlay */}
        <View style={styles.overlay}>
          {/* Right Side Actions */}
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={30} color="white" />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={30} color="white" />
              <Text style={styles.actionText}>{item.comments}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-social-outline" size={30} color="white" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="cloud-download" size={30} color="white" />
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          {/* Video Info */}
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>{item.title}</Text>
            <Text style={styles.videoDescription}>{item.description}</Text>
            
            {/* Video Details */}
            <View style={styles.videoDetails}>
              {item.duration && (
                <View style={styles.videoDetailItem}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.videoDetailText}>{formatDuration(item.duration)}</Text>
                </View>
              )}
              
              {item.bytes && (
                <View style={styles.videoDetailItem}>
                  <Ionicons name="document-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.videoDetailText}>{formatBytes(item.bytes)}</Text>
                </View>
              )}
              
              {item.format && (
                <View style={styles.videoDetailItem}>
                  <FontAwesome name="file-video-o" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.videoDetailText}>{item.format}</Text>
                </View>
              )}
              
              {item.created_at && (
                <View style={styles.videoDetailItem}>
                  <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.videoDetailText}>{formatDate(item.created_at)}</Text>
                </View>
              )}
            </View>
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
      </View>
    );
  };

  // Search Header
  const renderSearchHeader = () => {
    if (!searchVisible) return null;
    
    return (
      <View style={[styles.searchHeader, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: isDarkMode ? '#333' : '#f5f5f5', color: theme.text }]}
          placeholder="Enter folder path... (e.g. videos/)"
          placeholderTextColor="#999"
          value={folderPath}
          onChangeText={setFolderPath}
          returnKeyType="search"
          onSubmitEditing={() => loadVideos(folderPath)}
        />
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: theme.accent }]}
          onPress={() => loadVideos(folderPath)}
        >
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // Sort Button
  const renderSortButton = () => {
    return (
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => {
          // Cycle through sort options
          const nextSortOption = 
            sortOption === SORT_OPTIONS.RANDOM ? SORT_OPTIONS.LATEST :
            sortOption === SORT_OPTIONS.LATEST ? SORT_OPTIONS.OLDEST : 
            SORT_OPTIONS.RANDOM;
          setSortOption(nextSortOption);
        }}
      >
        <Ionicons 
          name={
            sortOption === SORT_OPTIONS.RANDOM ? "shuffle" : 
            sortOption === SORT_OPTIONS.LATEST ? "time" : 
            "time-outline"
          } 
          size={24} 
          color="white" 
        />
        <Text style={styles.sortButtonText}>
          {sortOption === SORT_OPTIONS.RANDOM ? "Random" : 
           sortOption === SORT_OPTIONS.LATEST ? "Latest" : "Oldest"}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading videos from Cloudinary...
        </Text>
      </View>
    );
  }

  if (error || videos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
          {error ? 'Error Loading Videos' : 'No Videos Found'}
        </Text>
        
        {error && (
          <Text style={{ color: 'red', textAlign: 'center', marginHorizontal: 20, marginBottom: 20 }}>
            {error}
          </Text>
        )}
        
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.folderInput, { backgroundColor: isDarkMode ? '#333' : '#f5f5f5', color: theme.text }]}
            placeholder="Enter folder path (e.g. videos/)"
            placeholderTextColor="#999"
            value={folderPath}
            onChangeText={setFolderPath}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.pathButton, { backgroundColor: theme.accent }]}
              onPress={() => {
                setFolderPath('');
                loadVideos('');
              }}
            >
              <Text style={styles.buttonText}>Root Folder</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.pathButton, { backgroundColor: theme.accent }]}
              onPress={() => loadVideos(folderPath)}
            >
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: '#4CAF50', marginTop: 20 }]}
          onPress={() => loadVideos(folderPath)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Search Toggle Button */}
      <TouchableOpacity
        style={styles.searchToggle}
        onPress={() => setSearchVisible(!searchVisible)}
      >
        <Ionicons name={searchVisible ? "close" : "search"} size={24} color="white" />
      </TouchableOpacity>
      
      {/* Sort Button */}
      {renderSortButton()}
      
      {renderSearchHeader()}
      
      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50
        }}
        initialNumToRender={1}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  videoContainer: {
    width,
    height,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
  },
  rightActions: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 15,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
    fontFamily: 'Inter-Regular',
  },
  videoInfo: {
    marginBottom: 50,
  },
  videoTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  videoDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  videoDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  videoDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  videoDetailText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 5,
    fontFamily: 'Inter-Regular',
  },
  muteButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  refreshButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
  },
  placeholderImage: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 10,
    marginVertical: 20,
  },
  searchContainer: {
    width: '90%',
    marginVertical: 20,
  },
  folderInput: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pathButton: {
    flex: 0.48,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  searchToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  searchHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9,
    flexDirection: 'row',
    padding: 10,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 14,
    marginRight: 10,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});