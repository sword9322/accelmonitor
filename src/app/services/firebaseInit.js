import { collection, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Get a reference to a user-specific collection
 * @param {string} userId - The user ID
 * @param {string} collectionName - The name of the collection
 * @returns {Object} - Firestore collection reference
 */
export const getUserCollection = (userId, collectionName) => {
  if (!userId) {
    throw new Error('User ID is required to get a user collection');
  }
  
  // Create a reference to the user's document first
  const userDoc = doc(db, 'users', userId);
  
  // Then create a reference to the subcollection
  return collection(userDoc, collectionName);
};

/**
 * Get a reference to a global collection (not user-specific)
 * @param {string} collectionName - The name of the collection
 * @returns {Object} - Firestore collection reference
 */
export const getGlobalCollection = (collectionName) => {
  return collection(db, collectionName);
};

/**
 * Initialize and get reference to accelerometer readings collection
 * @param {string} userId - Optional user ID for user-specific data
 * @returns {Object} - Firestore collection reference
 */
export const getAccelerometerReadingsCollection = (userId = null) => {
  const collectionName = 'accelerometer_readings';
  
  // If userId is provided, get user-specific collection
  if (userId) {
    return getUserCollection(userId, collectionName);
  }
  
  // Otherwise get the global collection
  return getGlobalCollection(collectionName);
}; 