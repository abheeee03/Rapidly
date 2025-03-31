import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithCredential,
  updateProfile,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../Utlis/firebase';
import { trackEvent, setAnalyticsUserId, setAnalyticsUserProperties, AnalyticsEvents } from '../Utlis/analytics';

// Register for Google auth redirect
WebBrowser.maybeCompleteAuthSession();

// Google Auth configuration
const googleConfig = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
  scopes: ['profile', 'email']
};

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState([]);
  const [googleRequest, setGoogleRequest] = useState(null);
  const [googleResponse, setGoogleResponse] = useState(null);

  // Setup Google request
  useEffect(() => {
    async function prepareGoogleRequest() {
      const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
      const request = new AuthSession.AuthRequest({
        clientId: googleConfig.expoClientId,
        scopes: googleConfig.scopes,
        redirectUri: AuthSession.makeRedirectUri({
          useProxy: true,
        }),
      }, discovery);
      setGoogleRequest(request);
    }
    
    prepareGoogleRequest();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Set analytics user ID
          setAnalyticsUserId(user.uid);
          
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Combine auth user with Firestore data
            setUser({
              ...user,
              ...userData,
            });
            
            // Set preferences separately for easier access
            setUserPreferences(userData?.preferences || []);
            
            // Set analytics user properties
            setAnalyticsUserProperties({
              account_created: userData.createdAt?.toDate?.() || new Date(),
              has_preferences: (userData.preferences?.length > 0) ? 'yes' : 'no',
              preference_count: userData.preferences?.length || 0,
              gender: userData.gender || 'unknown'
            });
          } else {
            // If no Firestore document exists yet, use just auth data
            setUser(user);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(user);
        }
      } else {
        setUser(null);
        setUserPreferences([]);
        // Clear analytics user ID when logged out
        setAnalyticsUserId(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle Google sign-in response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithGoogle(credential);
    }
  }, [googleResponse]);

  // Email & Password Registration
  const registerWithEmail = async (email, password, userData) => {
    try {
      setIsLoading(true);
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;
      
      // Update display name if provided
      if (userData.name) {
        await updateProfile(userCredential.user, {
          displayName: userData.name
        });
      }
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        name: userData.name || '',
        phone: userData.phone || '',
        dob: userData.dob || '',
        gender: userData.gender || '',
        city: userData.city || '',
        bio: userData.bio || '',
        preferences: userData.preferences || [],
        createdAt: new Date(),
      });
      
      // Track signup event
      trackEvent(AnalyticsEvents.SIGN_UP, {
        method: 'email',
        has_profile_data: !!userData.name || !!userData.phone || !!userData.dob || !!userData.gender,
        city: userData.city || 'not_set',
      });
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Failed to register. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      }
      
      // Track signup error
      trackEvent('signup_error', { error_code: error.code, error_message: error.message });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Email & Password Login
  const loginWithEmail = async (email, password) => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      
      // Track login event
      trackEvent(AnalyticsEvents.LOGIN, { method: 'email' });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to login. Please check your credentials.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      }
      
      // Track login error
      trackEvent('login_error', { error_code: error.code, error_message: error.message });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-in
  const signInWithGoogle = async (credential) => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithCredential(auth, credential);
      const { uid, displayName, email, photoURL } = userCredential.user;
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        // Create new user document for first-time Google sign-in
        await setDoc(doc(db, 'users', uid), {
          uid,
          email,
          name: displayName || '',
          photoURL: photoURL || '',
          preferences: [],
          createdAt: new Date(),
        });
        
        // Track new account via Google
        trackEvent(AnalyticsEvents.SIGN_UP, { method: 'google' });
      } else {
        // Track login via Google
        trackEvent(AnalyticsEvents.LOGIN, { method: 'google' });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Google sign in error:', error);
      
      // Track Google sign-in error
      trackEvent('google_signin_error', { error_message: error.message });
      
      return { success: false, error: 'Failed to sign in with Google' };
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Google Sign-in
  const promptGoogleSignIn = async () => {
    try {
      if (!googleRequest) {
        Alert.alert('Error', 'Google authentication is not ready yet. Please try again in a moment.');
        return;
      }
      
      const response = await googleRequest.promptAsync({
        useProxy: true,
      });
      setGoogleResponse(response);
    } catch (error) {
      console.error('Google auth prompt error:', error);
      Alert.alert('Error', 'Failed to start Google authentication');
    }
  };

  // Logout
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Track logout event
      trackEvent(AnalyticsEvents.LOGOUT);
      
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to logout' };
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (userData) => {
    try {
      setIsLoading(true);
      if (!user) {
        throw new Error('No user is logged in');
      }
      
      const userRef = doc(db, 'users', user.uid);
      
      // Update user data in Firestore
      await updateDoc(userRef, {
        ...userData,
        updatedAt: new Date()
      });
      
      // Update display name if provided
      if (userData.name) {
        await updateProfile(auth.currentUser, {
          displayName: userData.name
        });
      }
      
      // Refresh user state with updated data
      const updatedDoc = await getDoc(userRef);
      setUser(prevUser => ({
        ...prevUser,
        ...updatedDoc.data()
      }));
      
      // Update preferences if changed
      if (userData.preferences) {
        setUserPreferences(userData.preferences);
      }
      
      // Update analytics user properties if city is provided
      if (userData.city) {
        setAnalyticsUserProperties({
          city: userData.city,
          last_profile_update: new Date()
        });
      }
      
      // Track profile update
      trackEvent(AnalyticsEvents.PROFILE_UPDATE, {
        fields_updated: Object.keys(userData).join(','),
        updated_city: userData.city ? 'yes' : 'no',
      });
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Failed to update profile' };
    } finally {
      setIsLoading(false);
    }
  };

  // Update user preferences
  const updateUserPreferences = async (preferences) => {
    try {
      if (!user) {
        throw new Error('No user is logged in');
      }
      
      const userRef = doc(db, 'users', user.uid);
      
      // Update preferences in Firestore
      await updateDoc(userRef, {
        preferences,
        updatedAt: new Date()
      });
      
      // Update local state
      setUserPreferences(preferences);
      
      // Track preference update
      trackEvent(AnalyticsEvents.PREFERENCE_UPDATE, {
        preference_count: preferences.length,
        preferences: preferences.join(',')
      });
      
      return { success: true };
    } catch (error) {
      console.error('Preferences update error:', error);
      return { success: false, error: 'Failed to update preferences' };
    }
  };

  // Handle like/unlike article
  const toggleArticleLike = async (articleId) => {
    try {
      if (!user) {
        return { success: false, error: 'Please login to like articles' };
      }
      
      // Get user's likes collection
      const userLikesRef = collection(db, 'users', user.uid, 'likes');
      const articleLikeQuery = query(userLikesRef, where('articleId', '==', articleId));
      const likeSnapshot = await getDocs(articleLikeQuery);
      
      if (likeSnapshot.empty) {
        // Add to likes
        await setDoc(doc(userLikesRef), {
          articleId,
          likedAt: new Date()
        });
        
        // Increment article likes count
        const articleRef = doc(db, 'articles', articleId);
        const articleDoc = await getDoc(articleRef);
        
        if (articleDoc.exists()) {
          await updateDoc(articleRef, {
            likes: (articleDoc.data().likes || 0) + 1
          });
        }
        
        // Track like event
        trackEvent(AnalyticsEvents.ARTICLE_LIKE, { 
          articleId, 
          action: 'like'
        });
        
        return { success: true, liked: true };
      } else {
        // Remove from likes
        const likeDoc = likeSnapshot.docs[0];
        await deleteDoc(doc(userLikesRef, likeDoc.id));
        
        // Decrement article likes count
        const articleRef = doc(db, 'articles', articleId);
        const articleDoc = await getDoc(articleRef);
        
        if (articleDoc.exists() && articleDoc.data().likes > 0) {
          await updateDoc(articleRef, {
            likes: articleDoc.data().likes - 1
          });
        }
        
        // Track unlike event
        trackEvent(AnalyticsEvents.ARTICLE_LIKE, { 
          articleId, 
          action: 'unlike'
        });
        
        return { success: true, liked: false };
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      return { success: false, error: 'Failed to update like status' };
    }
  };

  // Check if user has liked an article
  const checkArticleLiked = async (articleId) => {
    try {
      if (!user) return false;
      
      const userLikesRef = collection(db, 'users', user.uid, 'likes');
      const articleLikeQuery = query(userLikesRef, where('articleId', '==', articleId));
      const likeSnapshot = await getDocs(articleLikeQuery);
      
      return !likeSnapshot.empty;
    } catch (error) {
      console.error('Check like error:', error);
      return false;
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      
      // Track reset password event
      trackEvent('password_reset_requested', { email });
      
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        error: error.code === 'auth/user-not-found' 
          ? 'No account found with this email.' 
          : 'Failed to send password reset email.'
      };
    }
  };

  // Context value
  const authContext = {
    user,
    userPreferences,
    isLoading,
    registerWithEmail,
    loginWithEmail,
    promptGoogleSignIn,
    logout,
    updateUserProfile,
    updateUserPreferences,
    toggleArticleLike,
    checkArticleLiked,
    resetPassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 