import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Image, SafeAreaView, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../Utlis/firebase';
import { useAuth } from '../../context/AuthContext';

const NEWS_CATEGORIES = [
  'Politics', 'Technology', 'Health', 'Business', 
  'Entertainment', 'Sports', 'Science', 'Education',
  'World', 'Environment', 'Finance', 'Lifestyle'
];

// Sample city data - Indian cities only
const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
  'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
  'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
  'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar',
  'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore',
  'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai',
  'Raipur', 'Kochi', 'Chandigarh', 'Mysore', 'Guwahati',
  'Puducherry', 'Thiruvananthapuram', 'Surat', 'Shimla', 'Dehradun'
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

  // City selection modal states
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState(CITIES);

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

  // Filter cities based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCities(CITIES);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = CITIES.filter(city => 
        city.toLowerCase().includes(query)
      );
      setFilteredCities(filtered);
    }
  }, [searchQuery]);

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

  // Open city selection modal
  const openCityModal = () => {
    setSearchQuery('');
    setFilteredCities(CITIES);
    setCityModalVisible(true);
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    handleInputChange('city', city);
    setCityModalVisible(false);
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

  // Render city modal
  const renderCityModal = () => (
    <Modal
      visible={cityModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setCityModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text, fontFamily: theme.titleFont }]}>
              Select City
            </Text>
            <TouchableOpacity 
              onPress={() => setCityModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text, fontFamily: theme.font }]}
              placeholder="Search for a city..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          {filteredCities.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="location-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.noResultsText, { color: theme.textSecondary, fontFamily: theme.font }]}>
                No cities found matching "{searchQuery}"
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cityItem, 
                    { borderBottomColor: theme.border },
                    profile.city === item && { backgroundColor: theme.accent + '15' }
                  ]}
                  onPress={() => handleCitySelect(item)}
                >
                  <View style={styles.cityItemContent}>
                    <Ionicons 
                      name="location-outline" 
                      size={20} 
                      color={profile.city === item ? theme.accent : theme.textSecondary} 
                      style={styles.cityIcon}
                    />
                    <Text style={[
                      styles.cityName, 
                      { 
                        color: profile.city === item ? theme.accent : theme.text,
                        fontFamily: theme.font 
                      }
                    ]}>
                      {item}
                    </Text>
                  </View>
                  {profile.city === item && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  if (authLoading || isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text, fontFamily: theme.font }]}>Loading profile...</Text>
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
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: theme.titleFont }]}>My Account</Text>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveButtonText, { fontFamily: theme.font }]}>Save</Text>
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
            <Text style={[styles.inputLabel, { color: theme.textSecondary, fontFamily: theme.font }]}>Name</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, fontFamily: theme.font }]}
              value={profile.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Your full name"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary, fontFamily: theme.font }]}>Email</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputDisabled, fontFamily: theme.font }]}
              value={profile.email}
              editable={false}
              placeholder="Your email"
              placeholderTextColor={theme.textSecondary}
            />
            <Text style={[styles.emailNote, { color: theme.textSecondary, fontFamily: theme.font }]}>
              Email cannot be changed
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary, fontFamily: theme.font }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.inputDisabled, fontFamily: theme.font }]}
              value={profile.phone}
              editable={false}
              placeholder="Your phone number"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
            />
            <Text style={[styles.emailNote, { color: theme.textSecondary, fontFamily: theme.font }]}>
              Phone number cannot be changed
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary, fontFamily: theme.font }]}>City</Text>
            <TouchableOpacity 
              style={[styles.citySelector, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}
              onPress={openCityModal}
            >
              <View style={styles.citySelectorContent}>
                <Ionicons name="location-outline" size={20} color={theme.textSecondary} style={styles.cityIcon} />
                <Text 
                  style={[
                    styles.cityText, 
                    { 
                      color: profile.city ? theme.text : theme.textSecondary,
                      fontFamily: theme.font 
                    }
                  ]}
                >
                  {profile.city || "Select your city"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary, fontFamily: theme.font }]}>Bio</Text>
            <TextInput
              style={[styles.textArea, { borderColor: theme.border, color: theme.text, fontFamily: theme.font }]}
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
          <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: theme.titleFont }]}>News Preferences</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary, fontFamily: theme.font }]}>
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
                        : theme.text,
                      fontFamily: theme.font 
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
          <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: theme.titleFont }]}>Account Settings</Text>
          
          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: theme.border }]}
            onPress={() => Alert.alert("Coming Soon", "This feature will be available soon")}
          >
              <Link href='https://uptodate-app.vercel.app/ResetPassword'>
            <View style={styles.optionContent}>
              <Ionicons name="key-outline" size={20} color={theme.text} style={styles.optionIcon} />
              <Text style={[styles.optionText, { color: theme.text, fontFamily: theme.font }]}>Change Password</Text>
            </View>
              </Link>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: theme.border }]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View style={styles.optionContent}>
              <Ionicons name="log-out-outline" size={20} color="#f44336" style={styles.optionIcon} />
              <Text style={[styles.optionText, { color: "#f44336", fontFamily: theme.font }]}>
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
          <Text style={[styles.deleteButtonText, { fontFamily: theme.font }]}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {renderCityModal()}
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
  },
  emailNote: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  citySelector: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  citySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityIcon: {
    marginRight: 12,
  },
  cityText: {
    fontSize: 16,
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // Bottom sheet style
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    height: '80%', // Takes up 80% of the screen
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  cityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityName: {
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  }
}); 