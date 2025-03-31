import { analytics } from './firebase';
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';

// Analytics utility functions

/**
 * Track a screen view
 * @param {string} screenName - The name of the screen viewed
 * @param {object} screenParams - Additional parameters
 */
export const trackScreenView = (screenName, screenParams = {}) => {
  try {
    if (analytics) {
      logEvent(analytics, 'screen_view', {
        firebase_screen: screenName,
        ...screenParams
      });
      console.log(`Screen tracked: ${screenName}`);
    }
  } catch (error) {
    console.error('Error tracking screen view:', error);
  }
};

/**
 * Track a custom event
 * @param {string} eventName - Name of the event to track
 * @param {object} eventParams - Event parameters
 */
export const trackEvent = (eventName, eventParams = {}) => {
  try {
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
      console.log(`Event tracked: ${eventName}`, eventParams);
    }
  } catch (error) {
    console.error(`Error tracking event ${eventName}:`, error);
  }
};

/**
 * Set the user ID for analytics
 * @param {string} uid - User ID
 */
export const setAnalyticsUserId = (uid) => {
  try {
    if (analytics && uid) {
      setUserId(analytics, uid);
      console.log(`Analytics user ID set: ${uid}`);
    }
  } catch (error) {
    console.error('Error setting analytics user ID:', error);
  }
};

/**
 * Set user properties for analytics
 * @param {object} properties - User properties object
 */
export const setAnalyticsUserProperties = (properties) => {
  try {
    if (analytics && properties) {
      setUserProperties(analytics, properties);
      console.log('Analytics user properties set', properties);
    }
  } catch (error) {
    console.error('Error setting analytics user properties:', error);
  }
};

// Common events for easy reference
export const AnalyticsEvents = {
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  LOGOUT: 'logout',
  ARTICLE_VIEW: 'article_view',
  ARTICLE_LIKE: 'article_like',
  ARTICLE_SHARE: 'article_share',
  ARTICLE_SAVE: 'article_save',
  PROFILE_UPDATE: 'profile_update',
  PREFERENCE_UPDATE: 'preference_update',
  SEARCH: 'search'
}; 