import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../Utlis/firebase';
import { collection, query, orderBy, limit, addDoc, getDocs, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const CommentsModal = ({ visible, onClose, videoId, commentsCount, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      loadComments();
    }
  }, [visible]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsRef = collection(db, 'shorts', videoId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      
      const commentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      setSubmitting(true);
      const commentsRef = collection(db, 'shorts', videoId, 'comments');
      
      // First add the comment
      await addDoc(commentsRef, {
        text: newComment.trim(),
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });

      // Then update the shorts document
      const shortsRef = doc(db, 'shorts', videoId);
      await updateDoc(shortsRef, {
        comments: increment(1)
      });

      setNewComment('');
      loadComments();
      onCommentAdded?.();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };
  
  const renderComment = ({ item, index }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).springify()} 
      style={styles.commentContainer}
    >
      <Image
        source={{ uri: item.userPhoto || 'https://via.placeholder.com/40' }}
        style={styles.userAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.userName, { color: theme.text, fontFamily: theme.titleFont }]}>
            {item.userName}
          </Text>
          <Text style={[styles.commentDate, { color: theme.textSecondary, fontFamily: theme.font }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: theme.text, fontFamily: theme.font }]}>
          {item.text}
        </Text>
      </View>
    </Animated.View>
  );

  const EmptyCommentsComponent = () => (
    <Animated.View 
      entering={FadeIn.duration(400)} 
      style={styles.emptyCommentsContainer}
    >
      <Ionicons name="chatbubble-outline" size={40} color={theme.textSecondary} />
      <Text style={[styles.emptyCommentsText, { color: theme.textSecondary, fontFamily: theme.font }]}>
        No comments yet. Be the first to comment!
      </Text>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <BlurView intensity={Platform.OS === 'ios' ? 25 : 40} style={styles.modalContainer}>
          <TouchableWithoutFeedback>
            <Animated.View 
              entering={FadeInUp.springify()}
              style={[
                styles.modalContent, 
                { 
                  backgroundColor: theme.background,
                  maxHeight: height * 0.85,
                  width: width > 600 ? '85%' : '100%',
                  alignSelf: 'center',
                  borderRadius: width > 600 ? moderateScale(20) : 0,
                }
              ]}
            >
              <View style={[
                styles.modalHeader, 
                { borderBottomColor: theme.border }
              ]}>
                <View style={styles.headerHandle} />
                <Text style={[
                  styles.modalTitle, 
                  { color: theme.text, fontFamily: theme.titleFont }
                ]}>
                  Comments ({commentsCount})
                </Text>
                <TouchableOpacity 
                  onPress={onClose} 
                  style={styles.closeButton}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons name="close" size={moderateScale(24)} color={theme.text} />
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.accent} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary, fontFamily: theme.font }]}>
                    Loading comments...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={comments}
                  renderItem={renderComment}
                  keyExtractor={(item, index) => `comment-${item.id}-${index}`}
                  contentContainerStyle={[
                    styles.commentsList,
                    comments.length === 0 && styles.emptyList
                  ]}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={EmptyCommentsComponent}
                />
              )}

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : null}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                style={[styles.inputContainer, { borderTopColor: theme.border }]}
              >
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      color: theme.text, 
                      backgroundColor: theme.cardBackground,
                      fontFamily: theme.font,
                    }
                  ]}
                  placeholder="Add a comment..."
                  placeholderTextColor={theme.textSecondary}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  onPress={handleSubmitComment}
                  disabled={!newComment.trim() || submitting || !user}
                  style={[
                    styles.submitButton,
                    { backgroundColor: theme.accent },
                    (!newComment.trim() || submitting || !user) && { opacity: 0.6 }
                  ]}
                  activeOpacity={0.7}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="send" size={moderateScale(20)} color="white" />
                  )}
                </TouchableOpacity>
              </KeyboardAvoidingView>
              
              {!user && (
                <View style={[styles.loginPrompt, { backgroundColor: theme.cardBackground }]}>
                  <Text style={[styles.loginPromptText, { color: theme.text, fontFamily: theme.font }]}>
                    Login to comment
                  </Text>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </BlurView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#000',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    position: 'relative',
  },
  headerHandle: {
    width: moderateScale(40),
    height: moderateScale(5),
    backgroundColor: '#555',
    borderRadius: moderateScale(3),
    marginBottom: moderateScale(10),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: moderateScale(15),
    top: moderateScale(15),
    padding: moderateScale(5),
  },
  commentsList: {
    padding: moderateScale(15),
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    padding: moderateScale(20),
  },
  emptyCommentsText: {
    marginTop: moderateScale(10),
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: moderateScale(15),
    paddingBottom: moderateScale(15),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  userAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(10),
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  userName: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  commentDate: {
    fontSize: moderateScale(12),
  },
  commentText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  inputContainer: {
    flexDirection: 'row',
    padding: moderateScale(15),
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(8),
    paddingTop: moderateScale(10),
    marginRight: moderateScale(10),
    maxHeight: moderateScale(100),
    minHeight: moderateScale(40),
  },
  submitButton: {
    borderRadius: 50,
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(30),
  },
  loadingText: {
    marginTop: moderateScale(10),
    fontSize: moderateScale(16),
  },
  loginPrompt: {
    padding: moderateScale(10),
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  loginPromptText: {
    fontSize: moderateScale(14),
  },
});

export default CommentsModal; 