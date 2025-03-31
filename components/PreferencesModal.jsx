import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import CityAutocomplete from './CityAutocomplete';

const { width, height } = Dimensions.get('window');

// These categories should match the ones in your app
const NEWS_CATEGORIES = [
  'Politics', 'Technology', 'Health', 'Business', 
  'Entertainment', 'Sports', 'Science', 'Education',
  'World', 'Environment', 'Finance', 'Lifestyle'
];

const PreferencesModal = ({ 
  visible, 
  onClose, 
  onSave,
  initialPreferences = [],
  initialCity = ''
}) => {
  const { theme } = useTheme();
  const [selectedCategories, setSelectedCategories] = useState(initialPreferences);
  const [city, setCity] = useState(initialCity);
  const [step, setStep] = useState(1); // 1: Intro, 2: City Selection, 3: Category Selection, 4: Final
  const [saving, setSaving] = useState(false);

  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(item => item !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // If no categories selected, select a few defaults
      const prefsToSave = selectedCategories.length > 0 
        ? selectedCategories 
        : ['Technology', 'World', 'Entertainment'];
      
      // Save both preferences and city
      await onSave(prefsToSave, city);
      setStep(4); // Move to final step
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep(1);
    setSelectedCategories(initialPreferences);
    setCity(initialCity);
    onClose();
  };

  const renderIntroStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="newspaper" size={64} color={theme.accent} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Welcome to UptoDate!</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Let's personalize your news feed by selecting your location and interests.
      </Text>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.accent }]}
        onPress={() => setStep(2)}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.skipButton}
        onPress={handleSave}
      >
        <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCitySelectionStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="location" size={64} color={theme.accent} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Where are you located?</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Your location helps us provide more relevant local news for you.
      </Text>
      
      <View style={styles.cityInputContainer}>
        <CityAutocomplete 
          value={city}
          onSelectCity={setCity}
          style={{ width: '100%', marginBottom: 20 }}
        />
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.secondaryButton, { borderColor: theme.border }]}
          onPress={() => setStep(1)}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.accent }]}
          onPress={() => setStep(3)}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategorySelectionStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: theme.text }]}>Select Your Interests</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Choose categories that interest you to personalize your news feed.
      </Text>
      
      <ScrollView style={styles.categoriesScrollView}>
        <View style={styles.categoriesContainer}>
          {NEWS_CATEGORIES.map((category) => (
            <TouchableOpacity 
              key={category}
              style={[
                styles.categoryChip,
                selectedCategories.includes(category) 
                  ? { backgroundColor: theme.accent } 
                  : { backgroundColor: theme.cardBackground, borderColor: theme.border }
              ]}
              onPress={() => toggleCategory(category)}
            >
              <Text 
                style={[
                  styles.categoryText, 
                  { 
                    color: selectedCategories.includes(category) 
                      ? '#fff' 
                      : theme.text 
                  }
                ]}
              >
                {category}
              </Text>
              {selectedCategories.includes(category) && (
                <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.secondaryButton, { borderColor: theme.border }]}
          onPress={() => setStep(2)}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.accent }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFinalStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={64} color={theme.accent} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>You're All Set!</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        Your preferences have been saved. You can always change these later in your account settings.
      </Text>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.accent }]}
        onPress={handleClose}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          {/* Only show close button in steps 1, 2 and 3 */}
          {step !== 4 && (
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          )}
          
          {/* Progress indicators */}
          {step !== 4 && (
            <View style={styles.progressContainer}>
              <View 
                style={[
                  styles.progressDot, 
                  { backgroundColor: step >= 1 ? theme.accent : theme.border }
                ]} 
              />
              <View style={[styles.progressLine, { backgroundColor: theme.border }]} />
              <View 
                style={[
                  styles.progressDot, 
                  { backgroundColor: step >= 2 ? theme.accent : theme.border }
                ]} 
              />
              <View style={[styles.progressLine, { backgroundColor: theme.border }]} />
              <View 
                style={[
                  styles.progressDot, 
                  { backgroundColor: step >= 3 ? theme.accent : theme.border }
                ]} 
              />
            </View>
          )}
          
          {/* Step content */}
          {step === 1 && renderIntroStep()}
          {step === 2 && renderCitySelectionStep()}
          {step === 3 && renderCategorySelectionStep()}
          {step === 4 && renderFinalStep()}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  cityInputContainer: {
    width: '100%',
    marginBottom: 32,
    zIndex: 100,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 16,
    padding: 8,
  },
  skipButtonText: {
    fontSize: 14,
  },
  categoriesScrollView: {
    maxHeight: height * 0.3,
    width: '100%',
    marginBottom: 24,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 6,
    borderWidth: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: '40%',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PreferencesModal; 