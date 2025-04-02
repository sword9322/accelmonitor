import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

/**
 * Service for managing authentication with Firebase
 */
const authService = {
  /**
   * Register a new user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} displayName - User's display name
   * @returns {Promise<Object>} - The user object
   */
  register: async (email, password, displayName) => {
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update the user's profile with display name
      await updateProfile(user, { displayName });
      
      // Create a user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        createdAt: new Date(),
        lastLogin: new Date(),
        role: 'user'
      });
      
      return user;
    } catch (error) {
      console.error('Error in registration:', error);
      throw error;
    }
  },
  
  /**
   * Login an existing user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} - The user object
   */
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  },
  
  /**
   * Logout the current user
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  },
  
  /**
   * Send password reset email
   * @param {string} email - User's email
   * @returns {Promise<void>}
   */
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error in password reset:', error);
      throw error;
    }
  },
  
  /**
   * Update user profile
   * @param {string} displayName - New display name
   * @returns {Promise<void>}
   */
  updateProfile: async (displayName) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user is signed in');
      
      await updateProfile(user, { displayName });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  
  /**
   * Update user email
   * @param {string} newEmail - New email address
   * @returns {Promise<void>}
   */
  updateEmail: async (newEmail) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user is signed in');
      
      await updateEmail(user, newEmail);
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  },
  
  /**
   * Update user password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  updatePassword: async (newPassword) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user is signed in');
      
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  },
  
  /**
   * Get current user
   * @returns {Object|null} - The current user or null if not signed in
   */
  getCurrentUser: () => {
    return auth.currentUser;
  }
};

export default authService;
