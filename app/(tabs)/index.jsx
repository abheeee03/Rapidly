import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Image,
  ActivityIndicator 
} from 'react-native';
import { Video } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { createClient } from '@supabase/supabase-js';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import 'react-native-url-polyfill/auto';

// Initialize Supabase client - replace with your own URLs and keys
const supabaseUrl = 'https://wwmppewgyozsmhggokot.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bXBwZXdneW96c21oZ2dva290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTgxODIsImV4cCI6MjA1ODEzNDE4Mn0.WBUZXvOes_H-oC4pm4ZlO4n3A3c0tWBqPrUWYWqldw0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { width, height } = Dimensions.get('window');

export default function ReelsScreen() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      
      // Fetch the list of files from the 'news-shorts' bucket
      const { data, error } = await supabase
        .storage
        .from('news-shorts') // Changed from 'reels' to 'news-shorts'
        .list();
        
      if (error) {
        console.error('Error fetching files:', error);
        return;
      }
      
      // Process the video files
      const videoFiles = data
        .filter(file => file.name.match(/\.(mp4|mov|avi)$/i)) // Filter for video files
        .map(file => {
          // Get public URL for each video
          const videoUrl = supabase.storage
            .from('news-shorts') // Changed from 'reels' to 'news-shorts'
            .getPublicUrl(file.name).data.publicUrl;
            
          return {
            id: file.id,
            url: videoUrl,
            username: file.metadata?.username || 'user_' + Math.floor(Math.random() * 1000),
            likes: Math.floor(Math.random() * 10000),
            description: file.metadata?.description || 'Check out this awesome video! #trending',
            music: file.metadata?.music || 'Original Audio',
            createdAt: file.created_at,
          };
        });
        
      // Sort by most recent
      videoFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setReels(videoFiles);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;
  
  const renderReel = ({ item, index }) => {
    const isActive = index === currentIndex;
    
    return (
      <View style={styles.reelContainer}>
        <StatusBar hidden />
        
        <Video
          source={{ uri: item.url }}
          rate={1.0}
          volume={isMuted ? 0.0 : 1.0}
          isMuted={isMuted}
          resizeMode="cover"
          shouldPlay={isActive}
          isLooping
          style={styles.video}
        />
        
        {/* Video Overlay */}
        <View style={styles.overlay}>
          {/* Right Side Actions */}
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={30} color="white" />
              <Text style={styles.actionText}>{formatNumber(item.likes)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={30} color="white" />
              <Text style={styles.actionText}>Comments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={30} color="white" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="dots-vertical" size={30} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Bottom Info */}
          <View style={styles.bottomInfo}>
            <View style={styles.userInfoContainer}>
              <View style={styles.userInfo}>
                <Image 
                  source={{ uri: `https://i.pravatar.cc/150?u=${item.username}` }} 
                  style={styles.userAvatar} 
                />
                <Text style={styles.username}>@{item.username}</Text>
                <TouchableOpacity style={styles.followButton}>
                  <Text style={styles.followText}>Follow</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.description}>{item.description}</Text>
              
              <View style={styles.musicContainer}>
                <Ionicons name="musical-notes" size={16} color="white" />
                <Text style={styles.musicText}>{item.music}</Text>
              </View>
            </View>
          </View>
          
          {/* Mute Button */}
          <TouchableOpacity 
            style={styles.muteButton}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        initialNumToRender={1}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
        vertical
      />
      
      {/* Header - Fixed at top */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reels</Text>
        <TouchableOpacity>
          <Ionicons name="camera-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelContainer: {
    width,
    height,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  header: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
    fontFamily: 'Inter-Regular',
  },
  bottomInfo: {
    marginBottom: 20,
  },
  userInfoContainer: {
    marginTop: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  followButton: {
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginLeft: 10,
  },
  followText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  description: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 10,
  },
  musicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 5,
    fontFamily: 'Inter-Regular',
  },
  muteButton: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
});