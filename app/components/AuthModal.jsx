import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Modal
} from 'react-native';
import Entypo from '@expo/vector-icons/Entypo';
import { AntDesign, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../Utlis/firebase';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import PreferencesModal from '../../components/PreferencesModal';
import { doc, setDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';

const { height, width } = Dimensions.get('window');

const AuthModal = ({ visible, onClose }) => {
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  // Animation values
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const dropdownScaleAnimation = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      // Reset form when modal becomes visible
      if (!isSignUp) {
        setEmail('');
        setPassword('');
      }
      
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (showGenderDropdown) {
      Animated.parallel([
        Animated.timing(dropdownAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(dropdownScaleAnimation, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(dropdownAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(dropdownScaleAnimation, {
          toValue: 0.95,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showGenderDropdown]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  const handleAuth = async () => {
    if (isSignUp) {
      if (!name || !email || !password || !phone || !gender || !dob) {
        Alert.alert(t('error'), t('errorAllFields'));
        return;
      }
    } else {
      if (!email || !password) {
        Alert.alert(t('error'), t('errorAllFields'));
        return;
      }
    }

    try {
      setLoading(true);
      if (isSignUp) {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { uid } = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, 'users', uid), {
          uid,
          name,
          email,
          phone,
          gender,
          dob,
          createdAt: new Date(),
          preferences: []
        });

        // Show preferences modal
        setShowPreferences(true);
      } else {
        // Sign in
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
        router.replace('/(tabs)');
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert(t('error'), error.message);
    }
  };

  const handlePreferencesSave = async (preferences, city) => {
    try {
      // Update user document with preferences
      const uid = auth.currentUser.uid;
      await setDoc(doc(db, 'users', uid), {
        city,
        preferences,
        updatedAt: new Date()
      }, { merge: true });

      // Close modals and navigate
      setShowPreferences(false);
      onClose();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert(t('error'), 'Failed to save preferences. Please try again.');
    }
  };

  const toggleGenderDropdown = () => {
    setShowGenderDropdown(!showGenderDropdown);
  };

  const selectGender = (selectedGender) => {
    setGender(selectedGender);
    setShowGenderDropdown(false);
  };

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.container}>
        <TouchableWithoutFeedback>
          <Animated.View style={[styles.backdrop, { opacity: modalAnimation }]} />
        </TouchableWithoutFeedback>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View 
              style={[
                styles.modalContent,
                { 
                  backgroundColor: theme.cardBackground,
                  transform: [
                    { translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [height, 0],
                    }) },
                  ]
                }
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.text, fontFamily: theme.titleFont }]}>
                    {isSignUp ? t('createAccount') : t('welcomeBack')}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: theme.font }]}>
                    {isSignUp 
                      ? t('signUpDescription') 
                      : t('signInDescription')}
                  </Text>
                </View>

                <View style={styles.form}>
                  {isSignUp && (
                    <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                      <AntDesign name="user" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: theme.text, fontFamily: theme.font }]}
                        placeholder={t('fullNamePlaceholder')}
                        placeholderTextColor={theme.textSecondary}
                        value={name}
                        onChangeText={setName}
                      />
                    </View>
                  )}

                  <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                    <AntDesign name="mail" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text, fontFamily: theme.font }]}
                      placeholder={t('emailPlaceholder')}
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                    <AntDesign name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text, fontFamily: theme.font }]}
                      placeholder={t('passwordPlaceholder')}
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <AntDesign 
                        name={showPassword ? "eye" : "eyeo"} 
                        size={20} 
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {isSignUp && (
                    <>
                      <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                        <AntDesign name="phone" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { color: theme.text, fontFamily: theme.font }]}
                          placeholder={t('phonePlaceholder')}
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="phone-pad"
                          value={phone}
                          onChangeText={setPhone}
                        />
                      </View>

                      <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                        <Entypo name="man" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                        <TouchableOpacity
                          style={styles.genderSelector}
                          onPress={toggleGenderDropdown}
                        >
                          <Text style={[styles.input, { color: gender ? theme.text : theme.textSecondary }]}>
                            {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : t('genderPlaceholder')}
                          </Text>
                          <Ionicons 
                            name={showGenderDropdown ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color={theme.textSecondary} 
                          />
                        </TouchableOpacity>
                      </View>

                      {showGenderDropdown && (
                        <Modal
                          transparent={true}
                          visible={showGenderDropdown}
                          animationType="none"
                          onRequestClose={toggleGenderDropdown}
                        >
                          <TouchableWithoutFeedback onPress={toggleGenderDropdown}>
                            <View style={styles.modalOverlay}>
                              <TouchableWithoutFeedback>
                                <Animated.View 
                                  style={[
                                    styles.popupDropdown,
                                    { 
                                      backgroundColor: theme.cardBackground,
                                      opacity: dropdownAnimation,
                                      transform: [
                                        { 
                                          translateY: dropdownAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-20, 0]
                                          })
                                        },
                                        { scale: dropdownScaleAnimation }
                                      ]
                                    }
                                  ]}
                                >
                                  <View style={styles.popupHeader}>
                                    <Text style={[styles.popupTitle, { color: theme.text, fontFamily: theme.titleFont }]}>
                                      {t('selectGender')}
                                    </Text>
                                    <TouchableOpacity onPress={toggleGenderDropdown}>
                                      <Ionicons name="close" size={24} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                  </View>
                                  
                                  <View style={styles.popupOptions}>
                                    <TouchableOpacity 
                                      style={[
                                        styles.popupOption, 
                                        gender === 'male' && styles.selectedPopupOption,
                                        { borderBottomColor: theme.border }
                                      ]}
                                      onPress={() => selectGender('male')}
                                    >
                                      <View style={[styles.iconContainer, { backgroundColor: gender === 'male' ? theme.accent + '20' : theme.background }]}>
                                        <FontAwesome5 
                                          name="male" 
                                          size={20} 
                                          color={gender === 'male' ? theme.accent : theme.textSecondary} 
                                        />
                                      </View>
                                      <Text 
                                        style={[
                                          styles.popupOptionText, 
                                          { 
                                            color: gender === 'male' ? theme.accent : theme.text,
                                            fontFamily: theme.font
                                          }
                                        ]}
                                      >
                                        {t('male')}
                                      </Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                      style={[
                                        styles.popupOption, 
                                        gender === 'female' && styles.selectedPopupOption,
                                        { borderBottomColor: theme.border }
                                      ]}
                                      onPress={() => selectGender('female')}
                                    >
                                      <View style={[styles.iconContainer, { backgroundColor: gender === 'female' ? theme.accent + '20' : theme.background }]}>
                                        <FontAwesome5 
                                          name="female" 
                                          size={20} 
                                          color={gender === 'female' ? theme.accent : theme.textSecondary} 
                                        />
                                      </View>
                                      <Text 
                                        style={[
                                          styles.popupOptionText, 
                                          { 
                                            color: gender === 'female' ? theme.accent : theme.text,
                                            fontFamily: theme.font
                                          }
                                        ]}
                                      >
                                        {t('female')}
                                      </Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                      style={[
                                        styles.popupOption, 
                                        gender === 'other' && styles.selectedPopupOption
                                      ]}
                                      onPress={() => selectGender('other')}
                                    >
                                      <View style={[styles.iconContainer, { backgroundColor: gender === 'other' ? theme.accent + '20' : theme.background }]}>
                                        <FontAwesome5 
                                          name="user" 
                                          size={20} 
                                          color={gender === 'other' ? theme.accent : theme.textSecondary} 
                                        />
                                      </View>
                                      <Text 
                                        style={[
                                          styles.popupOptionText, 
                                          { 
                                            color: gender === 'other' ? theme.accent : theme.text,
                                            fontFamily: theme.font
                                          }
                                        ]}
                                      >
                                        {t('other')}
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </Animated.View>
                              </TouchableWithoutFeedback>
                            </View>
                          </TouchableWithoutFeedback>
                        </Modal>
                      )}

                      <TouchableOpacity
                        style={[styles.inputContainer, { backgroundColor: theme.background }]}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <AntDesign name="calendar" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                        <Text style={[styles.input, { color: theme.text, fontFamily: theme.font }]}>
                          {dob.toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>

                      {showDatePicker && (
                        <DateTimePicker
                          value={dob}
                          mode="date"
                          display="default"
                          onChange={handleDateChange}
                          maximumDate={new Date()}
                        />
                      )}
                    </>
                  )}

                  <TouchableOpacity 
                    style={[styles.authButton, { backgroundColor: theme.accent }]}
                    onPress={handleAuth}
                    disabled={loading}
                  >
                    <Text style={[styles.authButtonText, { fontFamily: theme.titleFont }]}>
                      {loading ? t('pleaseWait') : (isSignUp ? t('signUp') : t('signIn'))}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.switchButton}
                    onPress={() => setIsSignUp(!isSignUp)}
                  >
                    <Text style={[styles.switchText, { color: theme.textSecondary, fontFamily: theme.font }]}>
                      {isSignUp 
                        ? t('alreadyHaveAccount')
                        : t('dontHaveAccount')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        <PreferencesModal
          visible={showPreferences}
          onClose={() => setShowPreferences(false)}
          onSave={handlePreferencesSave}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: height * 0.9,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  genderSelector: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupDropdown: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  popupOptions: {
    padding: 8,
  },
  popupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedPopupOption: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  popupOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AuthModal; 