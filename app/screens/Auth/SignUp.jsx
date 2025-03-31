import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator, Animated, Easing } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import PreferencesModal from '../../../components/PreferencesModal';
import { useAuth } from '../../../context/AuthContext';

export default function SignUp() {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [city, setCity] = useState('');
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [userPreferences, setUserPreferences] = useState([]);
  const [error, setError] = useState('');
  
  // Animation values
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  const router = useRouter();
  const { registerWithEmail, promptGoogleSignIn, updateUserProfile } = useAuth();

  const genderOptions = ['Male', 'Female', 'Other'];
  
  const toggleGenderDropdown = () => {
    if (showGenderDropdown) {
      // Animate closing
      Animated.parallel([
        Animated.timing(dropdownAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowGenderDropdown(false);
      });
    } else {
      // Open dropdown first then animate
      setShowGenderDropdown(true);
      Animated.parallel([
        Animated.timing(dropdownAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };
  
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  const scaleInterpolate = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });
  
  const opacityInterpolate = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  const translateYInterpolate = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });
  
  const backdropInterpolate = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });
  
  const selectGender = (option) => {
    setGender(option.toLowerCase());
    toggleGenderDropdown();
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!password) {
      setError('Please enter a password');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    // Show loading state
    setIsCreatingAccount(true);
    
    try {
      // Register with Firebase
      const userData = {
        name,
        dob,
        phone,
        gender,
        city,
        // Don't set preferences yet, will be set after modal
      };
      
      const result = await registerWithEmail(email, password, userData);
      
      if (result.success) {
        // Account created successfully, now show preferences modal
        setIsCreatingAccount(false);
        setShowPreferencesModal(true);
      } else {
        // Show error
        setIsCreatingAccount(false);
        setError(result.error);
      }
    } catch (error) {
      console.error('Error creating account:', error);
      setIsCreatingAccount(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await promptGoogleSignIn();
      // If successful, the auth state will change and redirect happens in AuthContext
    } catch (error) {
      console.error('Google sign-up error:', error);
      setError('Failed to sign up with Google. Please try again.');
    }
  };

  const handlePreferencesSave = async (selectedPreferences, selectedCity) => {
    try {
      setUserPreferences(selectedPreferences);
      
      // Save preferences and city to user profile
      await updateUserProfile({
        preferences: selectedPreferences,
        city: selectedCity
      });
      
      // Close modal and navigate to tabs instead of landing screen
      setShowPreferencesModal(false);
      router.push('/(tabs)');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences, but your account has been created.');
      router.push('/(tabs)');
    }
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || dob;
    setShowDatePicker(false);
    setDob(currentDate.toDateString());
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.mainContent}>
          <Text style={styles.title}>Welcome 👋</Text>
          <Text style={styles.subtitle}>Start by Creating your Account</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          {/* Input Fields */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter Your Full Name"
            autoCapitalize='words'
          />
          
          <View style={styles.rowContainer}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>DOB</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <TextInput
                  style={styles.input}
                  value={dob}
                  placeholder="Enter Date of Birth"
                  editable={false}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dob ? new Date(dob) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onChange}
                />
              )}
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity 
                  style={[
                    styles.genderSelector,
                    gender ? styles.genderSelectorFilled : null
                  ]}
                  onPress={toggleGenderDropdown}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.genderText,
                    !gender && styles.genderPlaceholder
                  ]}>
                    {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'Select Gender'}
                  </Text>
                  <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                    <Ionicons name="chevron-down" size={22} color={gender ? "#007AFF" : "#999"} />
                  </Animated.View>
                </TouchableOpacity>

                {showGenderDropdown && (
                  <>
                    <Animated.View 
                      style={[
                        styles.backdrop,
                        { opacity: backdropInterpolate }
                      ]}
                    >
                      <TouchableOpacity 
                        style={styles.backdropTouchable}
                        activeOpacity={1}
                        onPress={toggleGenderDropdown}
                      />
                    </Animated.View>
                    
                    <Animated.View 
                      style={[
                        styles.dropdownContainer,
                        {
                          opacity: opacityInterpolate,
                          transform: [
                            { scale: scaleInterpolate },
                            { translateY: translateYInterpolate }
                          ]
                        }
                      ]}
                    >
                      {genderOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.dropdownOption,
                            gender === option.toLowerCase() && styles.selectedOption
                          ]}
                          onPress={() => selectGender(option)}
                        >
                          <Text style={[
                            styles.dropdownOptionText,
                            gender === option.toLowerCase() && styles.selectedOptionText
                          ]}>
                            {option}
                          </Text>
                          {gender === option.toLowerCase() && (
                            <Ionicons name="checkmark" size={18} color="#007AFF" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </Animated.View>
                  </>
                )}
              </View>
            </View>
          </View>
          
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <Text style={styles.label}>Phone Number</Text>
          <View style={{width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <Text style={{marginBottom: 20, fontSize: 16, fontWeight: '500', textAlign: 'center', width: '10%'}}>+91</Text>
            <TextInput
              style={[styles.input, { width: '80%'}]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              autoCapitalize="none"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.passwordContainer}>
            <Text style={styles.label}>Password</Text>
          </View>
          
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter your password"
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialCommunityIcons 
                name={showPassword ? "eye-off" : "eye"} 
                size={24} 
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions Checkbox */}
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <MaterialCommunityIcons 
                name={agreeToTerms ? "checkbox-marked" : "checkbox-blank-outline"} 
                size={24} 
                color="#007AFF"
              />
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to the <Link href='https://uptodate-app.vercel.app/TermsConditions'>
              <Text style={styles.termsLink}>Terms and Conditions</Text></Link>
            </Text>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[
              styles.loginButton, 
              (!agreeToTerms || isCreatingAccount) && styles.loginButtonDisabled
            ]} 
            onPress={handleSignUp}
            disabled={!agreeToTerms || isCreatingAccount}
          >
            {isCreatingAccount ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Social Login */}
          <View style={styles.OrContainer}>
            <View style={styles.OrLine}></View>
            <Text style={styles.orText}>or</Text>
            <View style={styles.OrLine}></View>
          </View>
          
          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={handleGoogleSignUp}
              disabled={isCreatingAccount}
            >
              <Image 
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>Sign up with Google</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Sign Up Link - Fixed at bottom */}
      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/screens/Auth/Login')}>
          <Text style={styles.signUpLink}>Login</Text>
        </TouchableOpacity>
      </View>
      
      {/* Preferences Modal - Shows after successful account creation */}
      <PreferencesModal
        visible={showPreferencesModal}
        onClose={() => {
          setShowPreferencesModal(false);
          router.push('/(tabs)');
        }}
        onSave={handlePreferencesSave}
        initialPreferences={userPreferences}
        initialCity={city}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  halfWidth: {
    width: '48%',
    position: 'relative',
  },
  genderContainer: {
    position: 'relative',
    zIndex: 5,
    marginBottom: 20,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  orText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    color: '#007AFF',
    fontSize: 14,
  },
  passwordInputContainer: {
    position: 'relative',
    marginBottom: 25,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 13,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
  },
  termsLink: {
    color: '#007AFF',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    height: 50,
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  signUpText: {
    fontSize: 14,
    color: '#666',
  },
  signUpLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  OrContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  OrLine: {
    width: '40%',
    height: 1,
    backgroundColor: '#eee'
  },
  genderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    zIndex: 1,
  },
  genderSelectorFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
  },
  genderPlaceholder: {
    color: '#999',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    // backgroundColor: '#000',
    zIndex: 4,
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 4,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
}); 