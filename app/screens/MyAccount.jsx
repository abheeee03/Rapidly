import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Image, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../Utlis/firebase';
import { useAuth } from '../../context/AuthContext';
import CityAutocomplete from '../../components/CityAutocomplete';

const NEWS_CATEGORIES = [
  'Politics', 'Technology', 'Health', 'Business', 
  'Entertainment', 'Sports', 'Science', 'Education',
  'World', 'Environment', 'Finance', 'Lifestyle'
];

const MyAccount = () => {

  const { theme } = useTheme();
  const { user, isLoading: authLoading, updateUserProfile, updateUserPreferences, logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    bio: '',
    preferences: []
  });

  // Load user data when component mounts
  useEffect(() => {
    if (!authLoading && user) {
      setProfile({
        name: user.name || user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        bio: user.bio || '',
        preferences: user.preferences || []
      });
      setIsLoading(false);
    } else if (!authLoading && !user) {
      // Not authenticated, redirect to login
      router.replace('/screens/Auth/Login');
    }
  }, [user, authLoading]);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleCategoryPreference = (category) => {
    setProfile(prev => {
      const currentPreferences = [...prev.preferences];
      
      if (currentPreferences.includes(category)) {
        // Remove category if already selected
        return {
          ...prev,
          preferences: currentPreferences.filter(item => item !== category)
        };
      } else {
        // Add category if not selected
        return {
          ...prev,
          preferences: [...currentPreferences, category]
        };
      }
    });
  };


 


  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update user profile in Firebase
      const userData = {
        name: profile.name,
        city: profile.city,
        bio: profile.bio,
        preferences: profile.preferences
      };
      
      const result = await updateUserProfile(userData);
      
      if (result.success) {
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "An unexpected error occurred while updating your profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logout();
      if (result.success) {
        router.replace('/screens/Auth/Login');
      } else {
        Alert.alert("Error", "Failed to log out. Please try again.");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "An unexpected error occurred while logging out");
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            Alert.alert("Account Deletion", "This feature will be available soon");
          }
        }
      ]
    );
  };

  if (authLoading || isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Account</Text>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profilePictureContainer}>
          <Image 
            source={user.photoURL ? { uri: user.photoURL } : require('../../assets/images/man.png')}
            style={styles.profilePicture}
          />
          <TouchableOpacity style={styles.editPictureButton}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              value={profile.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Your full name"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputDisabled }]}
              value={profile.email}
              editable={false}
              placeholder="Your email"
              placeholderTextColor={theme.textSecondary}
            />
            <Text style={[styles.emailNote, { color: theme.textSecondary }]}>
              Email cannot be changed
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputDisabled }]}
              value={profile.phone}
              editable={false}
              placeholder="Your phone number"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
            />
            <Text style={[styles.emailNote, { color: theme.textSecondary }]}>
              Phone number cannot be changed
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>City</Text>
            <CityAutocomplete
              value={profile.city}
              onSelectCity={(city) => handleInputChange('city', city)}
              style={styles.cityAutocomplete}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Bio</Text>
            <TextInput
              style={[styles.textArea, { borderColor: theme.border, color: theme.text }]}
              value={profile.bio}
              onChangeText={(text) => handleInputChange('bio', text)}
              placeholder="Write something about yourself"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* News Preferences Section */}
        <View style={[styles.section, { borderTopColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>News Preferences</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Select categories you're interested in to personalize your news feed
          </Text>
          
          <View style={styles.categoriesContainer}>
            {NEWS_CATEGORIES.map((category) => (
              <TouchableOpacity 
                key={category}
                style={[
                  styles.categoryChip,
                  profile.preferences.includes(category) 
                    ? { backgroundColor: theme.accent } 
                    : { backgroundColor: theme.cardBackground, borderColor: theme.border }
                ]}
                onPress={() => toggleCategoryPreference(category)}
              >
                <Text 
                  style={[
                    styles.categoryText, 
                    { 
                      color: profile.preferences.includes(category) 
                        ? '#fff' 
                        : theme.text 
                    }
                  ]}
                >
                  {category}
                </Text>
                {profile.preferences.includes(category) && (
                  <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { borderTopColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Settings</Text>
          
          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: theme.border }]}
            onPress={() => Alert.alert("Coming Soon", "This feature will be available soon")}
          >
            <View style={styles.optionContent}>
              <Ionicons name="key-outline" size={20} color={theme.text} style={styles.optionIcon} />
              <Text style={[styles.optionText, { color: theme.text }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: theme.border }]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View style={styles.optionContent}>
              <Ionicons name="log-out-outline" size={20} color="#f44336" style={styles.optionIcon} />
              <Text style={[styles.optionText, { color: "#f44336" }]}>
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Text>
            </View>
            {!isLoggingOut && <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyAccount;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#3D7DFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginTop: 24,
    position: 'relative',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editPictureButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#3D7DFF',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 24,
    zIndex: 1,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    // backgroundColor: theme.cardBackground,
  },
  emailNote: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  cityAutocomplete: {
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    // backgroundColor: theme.cardBackground,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
  },
  deleteButton: {
    marginTop: 40,
    marginHorizontal: 16,
    backgroundColor: '#FF4C54',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 4,
  }
}); 