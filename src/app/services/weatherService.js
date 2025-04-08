import { getDatabase, ref, push, query, orderByChild, limitToLast, get, set, onValue } from 'firebase/database';
import { app } from '../firebase/config';

// Initialize Firebase Realtime Database
const database = getDatabase(app);

// Constants
const SIMULATOR_USER_ID = "simulator_user";
const OPENWEATHER_API_KEY = "e206c549180b9c642a66e73683742270";
const LISBON_COORDS = { lat: 38.7223, lon: -9.1393 }; // Lisbon coordinates

const weatherService = {
  _pollingInterval: null,
  _pollingDelay: 300000, // Default: poll every 5 minutes
  _subscribers: [],
  _lastData: null,
  _realtimeListeners: {},

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
    
    // Initial fetch
    weatherService._fetchAndNotify();
    
    // Set up interval for continuous fetching
    weatherService._pollingInterval = setInterval(() => {
      console.log(`Polling weather data (interval: ${weatherService._pollingDelay}ms) at ${new Date().toLocaleTimeString()}`);
      weatherService._fetchAndNotify();
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
    return () => {
      weatherService._subscribers = weatherService._subscribers.filter(cb => cb !== callback);
    };
  },

  /**
   * Fetch weather data from OpenWeather API and notify subscribers
   */
  _fetchAndNotify: async () => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${LISBON_COORDS.lat}&lon=${LISBON_COORDS.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the data to our format
      const weatherData = {
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        timestamp: Date.now()
      };
      
      // Save to Firebase
      await weatherService._saveToFirebase(weatherData);
      
      // Update last data and notify subscribers
      weatherService._lastData = weatherData;
      weatherService._notifySubscribers(weatherData);
      
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  },

  /**
   * Save weather data to Firebase
   * @param {Object} data - Weather data to save
   */
  _saveToFirebase: async (data) => {
    try {
      const weatherRef = ref(database, `users/${SIMULATOR_USER_ID}/weather_readings`);
      await push(weatherRef, data);
    } catch (error) {
      console.error('Error saving weather data to Firebase:', error);
    }
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
    
    const weatherRef = ref(database, `users/${SIMULATOR_USER_ID}/weather_readings`);
    const weatherQuery = query(weatherRef, orderByChild('timestamp'), limitToLast(1));
    
    console.log('Setting up realtime listener for weather data');
    
    const unsubscribe = onValue(weatherQuery, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const lastReading = Object.values(data)[0];
          weatherService._lastData = lastReading;
          weatherService._notifySubscribers(lastReading);
        }
      } catch (error) {
        console.error('Error processing weather data:', error);
      }
    });
    
    weatherService._realtimeListeners.weatherData = unsubscribe;
  },

  /**
   * Remove all realtime listeners
   */
  removeRealtimeListeners: () => {
    Object.values(weatherService._realtimeListeners).forEach(unsubscribe => {
      unsubscribe();
    });
    weatherService._realtimeListeners = {};
  }
};

export default weatherService; 