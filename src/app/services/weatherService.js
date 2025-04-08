import { getDatabase, ref, push, query, orderByChild, limitToLast, get, set, onValue } from 'firebase/database';
import { app } from '../firebase/config';
import axios from 'axios';

// Initialize Firebase Realtime Database
const database = getDatabase(app);

// Constants
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const weatherService = {
  _pollingInterval: null,
  _pollingDelay: 300000, // Default: poll every 5 minutes
  _subscribers: [],
  _lastData: null,
  _realtimeListeners: {},
  _currentCity: "Lisbon", // Default city

  /**
   * Start polling for weather data
   * @param {number} delay - Polling delay in milliseconds
   */
  startPolling: (delay = 300000) => {
    if (weatherService._pollingInterval) {
      if (weatherService._pollingDelay !== delay) {
        console.log(`Restarting weather polling: delay changed from ${weatherService._pollingDelay}ms to ${delay}ms`);
        weatherService.stopPolling();
      } else {
        console.log(`Already polling weather with ${delay}ms interval, no change needed`);
        return () => weatherService.stopPolling();
      }
    }

    console.log(`Starting weather polling with ${delay}ms interval`);
    weatherService._pollingDelay = delay;
    
    // Set up interval for continuous fetching
    weatherService._pollingInterval = setInterval(() => {
      console.log(`Checking for weather updates (interval: ${weatherService._pollingDelay}ms) at ${new Date().toLocaleTimeString()}`);
    }, delay);
    
    return () => weatherService.stopPolling();
  },

  /**
   * Stop polling for weather data
   */
  stopPolling: () => {
    if (weatherService._pollingInterval) {
      clearInterval(weatherService._pollingInterval);
      weatherService._pollingInterval = null;
      console.log('Stopped weather polling');
    }
  },

  /**
   * Subscribe to weather data updates
   * @param {Function} callback - Callback function to receive weather data
   * @returns {Function} - Unsubscribe function
   */
  subscribe: (callback) => {
    weatherService._subscribers.push(callback);
    // Call with current data if available
    if (weatherService._lastData) {
      callback(weatherService._lastData);
    }
    return () => {
      weatherService._subscribers = weatherService._subscribers.filter(cb => cb !== callback);
    };
  },

  /**
   * Notify all subscribers of new weather data
   * @param {Object} data - Weather data to notify about
   */
  _notifySubscribers: (data) => {
    weatherService._subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in weather subscriber callback:', error);
      }
    });
  },

  /**
   * Set up Firebase Realtime Database listener for weather data
   */
  setupWeatherListener: () => {
    weatherService.removeRealtimeListeners();
    
    const weatherRef = ref(database, 'weather');
    
    console.log('Setting up realtime listener for weather data');
    
    const unsubscribe = onValue(weatherRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Transform data to match our frontend format
          const weatherData = {
            temperature: data.temperature,
            feelsLike: data.feels_like,
            humidity: data.humidity,
            description: data.conditions,
            city: data.city,
            timestamp: data.timestamp * 1000 // Convert to milliseconds for JavaScript
          };
          
          weatherService._lastData = weatherData;
          weatherService._currentCity = data.city;
          weatherService._notifySubscribers(weatherData);
        }
      } catch (error) {
        console.error('Error processing weather data:', error);
      }
    });
    
    weatherService._realtimeListeners.weatherData = unsubscribe;
  },

  /**
   * Change the weather location
   * @param {string} city - New city name
   * @returns {Promise<Object>} - Response from the API
   */
  changeLocation: async (city) => {
    try {
      // Get the authentication token
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Make API request to change location
      const response = await axios.post(
        `${API_URL}/weather/config`,
        { city },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`Location changed to ${city}`, response.data);
      return response.data;
    } catch (error) {
      console.error('Error changing weather location:', error);
      throw error;
    }
  },

  /**
   * Get the current city
   * @returns {string} - Current city name
   */
  getCurrentCity: () => {
    return weatherService._currentCity;
  },

  /**
   * Remove all realtime listeners
   */
  removeRealtimeListeners: () => {
    Object.values(weatherService._realtimeListeners).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    weatherService._realtimeListeners = {};
  }
};

export default weatherService; 