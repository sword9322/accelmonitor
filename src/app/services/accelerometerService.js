import { getDatabase, ref, push, query, orderByChild, limitToLast, get, set, onValue, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { app } from '../firebase/config';

// Initialize Firebase Realtime Database
const database = getDatabase(app);

// Constants
const SIMULATOR_USER_ID = "simulator_user";

/**
 * Service for interacting with the Firebase Realtime Database
 */
const accelerometerService = {
  // Add a polling system with subscribers
  _pollingInterval: null,
  _pollingDelay: 5000, // Default: poll every 5 seconds
  _subscribers: [],
  _lastData: [],
  _dataBuffer: [],
  _lastFetchTimestamp: 0,
  _realtimeListeners: {},

  /**
   * Start polling for real-time data updates
   * @param {number} delay - Polling delay in milliseconds
   */
  startPolling: (delay = 5000) => {
    // Don't start if already polling, but if the delay has changed, restart
    if (accelerometerService._pollingInterval) {
      // If delay is different from the current one, restart polling
      if (accelerometerService._pollingDelay !== delay) {
        console.log(`Restarting polling: delay changed from ${accelerometerService._pollingDelay}ms to ${delay}ms`);
        accelerometerService.stopPolling();
      } else {
        console.log(`Already polling with ${delay}ms interval, no change needed`);
        return () => accelerometerService.stopPolling();
      }
    }

    // Ensure minimum polling delay to prevent performance issues
    const safeDelay = Math.max(100, delay); // Minimum 100ms polling interval
    
    console.log(`Starting accelerometer polling with ${safeDelay}ms interval`);
    accelerometerService._pollingDelay = safeDelay;
    
    // Initial fetch
    accelerometerService._fetchAndNotify();
    
    // Set up interval for continuous fetching
    accelerometerService._pollingInterval = setInterval(() => {
      // For high-frequency polling (less than 500ms), use a more concise log
      if (safeDelay < 500) {
        console.log(`Fast poll: ${new Date().toLocaleTimeString()}`);
      } else {
        console.log(`Polling data (interval: ${accelerometerService._pollingDelay}ms) at ${new Date().toLocaleTimeString()}`);
      }
      accelerometerService._fetchAndNotify();
    }, safeDelay);
    
    return () => accelerometerService.stopPolling();
  },
  
  /**
   * Stop polling for data updates
   */
  stopPolling: () => {
    if (accelerometerService._pollingInterval) {
      console.log('Stopping accelerometer polling');
      clearInterval(accelerometerService._pollingInterval);
      accelerometerService._pollingInterval = null;
    }
  },
  
  /**
   * Subscribe to real-time data updates
   * @param {Function} callback - Function to call with new data
   * @returns {Function} - Unsubscribe function
   */
  subscribe: (callback) => {
    if (typeof callback !== 'function') {
      console.error('Subscribe callback must be a function');
      return () => {};
    }
    
    console.log('New subscriber added to accelerometer service');
    accelerometerService._subscribers.push(callback);
    
    // Start polling if this is the first subscriber
    if (accelerometerService._subscribers.length === 1) {
      // Use polling instead of realtime listener to respect the refresh interval
      accelerometerService.startPolling(accelerometerService._pollingDelay);
    }
    
    // If we already have data, notify the new subscriber immediately
    if (accelerometerService._lastData.length > 0) {
      callback(accelerometerService._lastData);
    }
    
    // Return unsubscribe function
    return () => {
      accelerometerService._subscribers = accelerometerService._subscribers.filter(cb => cb !== callback);
      
      // Stop polling or remove listeners if no subscribers left
      if (accelerometerService._subscribers.length === 0) {
        accelerometerService.stopPolling();
        accelerometerService.removeRealtimeListeners();
      }
    };
  },
  
  /**
   * Set up Firebase Realtime Database listener for simulator data
   */
  setupSimulatorListener: () => {
    // Remove any existing listeners
    accelerometerService.removeRealtimeListeners();
    
    // Set up a new listener for simulator data
    const simulatorDataRef = ref(database, `users/${SIMULATOR_USER_ID}/accelerometer_readings`);
    const simulatorDataQuery = query(simulatorDataRef, orderByChild('timestamp'));
    
    console.log(`Setting up realtime listener for simulator data`);
    
    // Create a throttled version of the callback to respect the polling delay
    let lastProcessTime = 0;
    const throttledCallback = (snapshot) => {
      const now = Date.now();
      // Only process data if enough time has passed according to polling delay
      if (now - lastProcessTime >= accelerometerService._pollingDelay) {
        lastProcessTime = now;
        try {
          const readings = [];
          snapshot.forEach((childSnapshot) => {
            readings.push({
              id: childSnapshot.key,
              ...childSnapshot.val()
            });
          });
          
          // Sort by timestamp (descending)
          const sortedReadings = readings.sort((a, b) => b.timestamp - a.timestamp);
          
          // Update data and notify subscribers
          if (sortedReadings.length > 0) {
            accelerometerService._processRealtimeData(sortedReadings);
          }
        } catch (error) {
          console.error('Error processing simulator data:', error);
        }
      }
    };
    
    const unsubscribe = onValue(simulatorDataQuery, throttledCallback);
    
    // Store the unsubscribe function
    accelerometerService._realtimeListeners.simulatorData = unsubscribe;
  },
  
  /**
   * Remove all Firebase Realtime Database listeners
   */
  removeRealtimeListeners: () => {
    Object.values(accelerometerService._realtimeListeners).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
    accelerometerService._realtimeListeners = {};
  },
  
  /**
   * Process data from realtime listener and notify subscribers
   * @param {Array} data - The data from Firebase
   */
  _processRealtimeData: (data) => {
    // Normalize data
    const normalizedData = data.map(reading => ({
      id: reading.id || `reading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: reading.x || 0,
      y: reading.y || 0,
      z: reading.z || 0,
      timestamp: new Date(reading.timestamp * 1000), // Convert to Date object
    }));
    
    // Update last data
    accelerometerService._lastData = normalizedData;
    
    // Notify subscribers
    accelerometerService._subscribers.forEach(callback => {
      try {
        callback(normalizedData);
      } catch (callbackError) {
        console.error('Error in subscriber callback:', callbackError);
      }
    });
  },
  
  /**
   * Internal method to fetch data and notify subscribers
   * @private
   */
  _fetchAndNotify: async () => {
    try {
      // Add a timestamp to track when this fetch started
      const fetchStartTime = Date.now();
      console.log(`Fetching data at ${new Date(fetchStartTime).toLocaleTimeString()} with polling delay: ${accelerometerService._pollingDelay}ms`);
      
      // Always fetch simulator data regardless of login status
      let data = [];
      
      try {
        // Get simulator data
        data = await accelerometerService.getSimulatorData(20);
      } catch (error) {
        console.error('Error fetching from Firebase:', error);
        
        // Don't generate dummy data automatically
        // Instead, return an empty array to indicate the server is down
        data = [];
      }
      
      // Only update and notify if we have data
      if (data && data.length > 0) {
        // Ensure consistent timestamp format for all data
        const normalizedData = data.map(reading => {
          // Create a standardized reading object
          const normalized = {
            id: reading.id || `reading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x: reading.x || 0,
            y: reading.y || 0,
            z: reading.z || 0
          };
          
          // Handle different timestamp formats
          if (reading.timestamp) {
            // If it's a number (seconds since epoch)
            if (typeof reading.timestamp === 'number') {
              normalized.timestamp = new Date(reading.timestamp * 1000);
            }
            // If it's a string (ISO format or similar)
            else if (typeof reading.timestamp === 'string') {
              normalized.timestamp = new Date(reading.timestamp);
            }
            // If it's already a Date object
            else if (reading.timestamp instanceof Date) {
              normalized.timestamp = reading.timestamp;
            }
            else {
              normalized.timestamp = new Date();
            }
          } else {
            normalized.timestamp = new Date();
          }
          
          return normalized;
        });
        
        // Add new data to buffer without refreshing the entire dataset
        // This creates a continuous data stream
        let updatedData;
        
        if (accelerometerService._lastData.length === 0) {
          // First load - use all data
          updatedData = normalizedData;
        } else {
          // Find the newest data we've seen so far
          const mostRecentTimestamp = accelerometerService._lastFetchTimestamp;
          
          // Only add data points that are newer than what we have
          const newReadings = normalizedData.filter(reading => {
            const readingTime = reading.timestamp.getTime();
            return readingTime > mostRecentTimestamp;
          });
          
          if (newReadings.length > 0) {
            // Sort by timestamp (newest first)
            const sortedNewReadings = newReadings.sort((a, b) => 
              b.timestamp.getTime() - a.timestamp.getTime()
            );
            
            // Update the last fetch timestamp
            accelerometerService._lastFetchTimestamp = sortedNewReadings[0].timestamp.getTime();
            
            // Combine with existing data
            updatedData = [...sortedNewReadings, ...accelerometerService._lastData];
          } else {
            // No new readings, keep existing data
            updatedData = accelerometerService._lastData;
          }
        }
        
        // Update last data (use only fresh normalized data)
        accelerometerService._lastData = updatedData;
        
        // Notify all subscribers
        if (accelerometerService._subscribers.length > 0) {
          accelerometerService._subscribers.forEach(callback => {
            try {
              callback(updatedData);
            } catch (callbackError) {
              console.error('Error in subscriber callback:', callbackError);
            }
          });
        }
      } else {
        // No data retrieved, still notify subscribers with empty array or last data
        // This allows components to detect that the server is not providing new data
        accelerometerService._subscribers.forEach(callback => {
          try {
            callback(accelerometerService._lastData);
          } catch (callbackError) {
            console.error('Error in subscriber callback:', callbackError);
          }
        });
      }
    } catch (error) {
      console.error('Error in _fetchAndNotify:', error);
    }
  },
  
  /**
   * Get simulator data from Firebase
   * @param {number} limitCount - Number of readings to retrieve
   * @returns {Promise<Array>} - Array of simulator readings
   */
  getSimulatorData: async (limitCount = 100) => {
    try {
      console.log(`Fetching up to ${limitCount} simulator readings from Firebase`);
      
      // Create reference to simulator readings
      const simulatorRef = ref(database, `users/${SIMULATOR_USER_ID}/accelerometer_readings`);
      
      // Create a query that orders by timestamp and limits results
      const simulatorQuery = query(simulatorRef, orderByChild('timestamp'), limitToLast(limitCount));
      
      // Get the data
      const snapshot = await get(simulatorQuery);
      
      if (!snapshot.exists()) {
        console.log('No simulator readings found in Firebase');
        return [];
      }
      
      // Convert the snapshot to an array
      const readings = [];
      snapshot.forEach((childSnapshot) => {
        readings.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      // Sort by timestamp (descending)
      const sortedReadings = readings.sort((a, b) => b.timestamp - a.timestamp);
      
      console.log(`Successfully fetched ${sortedReadings.length} simulator readings from Firebase`);
      return sortedReadings;
    } catch (error) {
      // Check if this is a permission error
      if (error.message && error.message.includes('Permission denied')) {
        console.error('Permission denied accessing simulator readings. Check Firebase database rules.');
        console.error('Firebase error details:', error.code, error.message);
        // Return an empty array with a special property indicating permission error
        return [];
      } else {
        console.error('Error fetching simulator readings from Firebase:', error);
        console.error('Firebase error details:', error.code, error.message);
        throw error;
      }
    }
  },

  /**
   * Clear all simulator data from Firebase
   * @returns {Promise<boolean>} - True if successful, false otherwise
   */
  clearSimulatorData: async () => {
    try {
      console.log('Clearing all simulator readings from Firebase');
      
      // Create reference to simulator readings
      const simulatorRef = ref(database, `users/${SIMULATOR_USER_ID}/accelerometer_readings`);
      
      // Remove all data at this reference
      await remove(simulatorRef);
      
      console.log('Successfully cleared all simulator readings from Firebase');
      
      // Reset the local data as well
      accelerometerService._lastData = [];
      accelerometerService._dataBuffer = [];
      accelerometerService._lastFetchTimestamp = 0;
      
      // Notify subscribers of empty data
      accelerometerService._subscribers.forEach(callback => {
        try {
          callback([]);
        } catch (callbackError) {
          console.error('Error in subscriber callback:', callbackError);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing simulator readings from Firebase:', error);
      console.error('Firebase error details:', error.code, error.message);
      return false;
    }
  },

  /**
   * Calculate statistics for accelerometer data
   * @param {Array} data - Array of accelerometer readings
   * @returns {Object} - Statistics for each axis
   */
  calculateStatistics: (data) => {
    if (!data || data.length === 0) {
      return null;
    }

    // Extract values for each axis, defaulting to 0 if not present
    const xValues = data.map(item => item.x || 0);
    const yValues = data.map(item => item.y || 0);
    const zValues = data.map(item => item.z || 0);

    // Calculate statistics for a set of values
    const calculateAxisStats = (values) => {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const avg = sum / values.length;
      
      // Calculate standard deviation
      const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
      const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
      const stdDev = Math.sqrt(avgSquaredDiff);
      
      return {
        min: min.toFixed(4),
        max: max.toFixed(4),
        avg: avg.toFixed(4),
        stdDev: stdDev.toFixed(4)
      };
    };

    return {
      x: calculateAxisStats(xValues),
      y: calculateAxisStats(yValues),
      z: calculateAxisStats(zValues),
      sampleCount: data.length
    };
  },
  
  /**
   * Generate a single dummy data point for demo purposes
   * @returns {Object} - A single accelerometer reading with random values
   */
  generateSingleDummyPoint: () => {
    return {
      id: `dummy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: Math.random() * 2 - 1, // Random value between -1 and 1
      y: Math.random() * 2 - 1,
      z: Math.random() * 2 - 1,
      timestamp: Math.floor(Date.now() / 1000) // Unix timestamp in seconds
    };
  },

  /**
   * Generate dummy accelerometer data for testing
   * @param {number} count - Number of dummy readings to generate
   * @returns {Array} - Array of dummy accelerometer readings
   */
  generateDummyData: (count = 10) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `dummy-${i}`,
      x: Number((Math.random() * 2 - 1).toFixed(4)),
      y: Number((Math.random() * 2 - 1).toFixed(4)),
      z: Number((Math.random() * 2 - 1).toFixed(4)),
      timestamp: Math.floor(Date.now() / 1000) - i * 60, // Staggered timestamps
    }));
  }
};

export default accelerometerService;
