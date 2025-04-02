/**
 * Alarm Service
 * 
 * Handles threshold monitoring and triggers alarms when values exceed set limits
 */

const alarmService = {
  // Default alarm thresholds
  _thresholds: {
    x: { min: -10, max: 10 },
    y: { min: -10, max: 10 },
    z: { min: -10, max: 10 }
  },
  
  // Alarm listeners by ID
  _listeners: {},
  
  // Active alarms
  _activeAlarms: {},
  
  // History of alarms
  _alarmHistory: [],
  
  /**
   * Set threshold for a specific axis
   * 
   * @param {string} axis - Axis name (x, y, z)
   * @param {number} min - Minimum threshold
   * @param {number} max - Maximum threshold
   */
  setThreshold: (axis, min, max) => {
    if (!['x', 'y', 'z'].includes(axis)) {
      console.error(`Invalid axis: ${axis}. Must be one of: x, y, z`);
      return;
    }
    
    alarmService._thresholds[axis] = { min, max };
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('alarmThresholds', JSON.stringify(alarmService._thresholds));
    } catch (e) {
      console.error('Failed to save thresholds to localStorage:', e);
    }
    
    console.log(`Set threshold for ${axis}-axis: min=${min}, max=${max}`);
  },
  
  /**
   * Get current thresholds
   * 
   * @returns {Object} - Current thresholds for all axes
   */
  getThresholds: () => {
    // Try to load from localStorage first
    try {
      const storedThresholds = localStorage.getItem('alarmThresholds');
      if (storedThresholds) {
        alarmService._thresholds = JSON.parse(storedThresholds);
      }
    } catch (e) {
      console.error('Failed to load thresholds from localStorage:', e);
    }
    
    return alarmService._thresholds;
  },
  
  /**
   * Check if data exceeds thresholds and trigger alarms
   * 
   * @param {Array} data - Accelerometer data to check
   * @returns {Array} - Array of triggered alarms
   */
  checkThresholds: (data) => {
    if (!data || data.length === 0) return [];
    
    const triggeredAlarms = [];
    const thresholds = alarmService.getThresholds();
    
    // Check the most recent reading (first in array)
    const latestReading = data[0];
    
    // For each axis, check if value exceeds thresholds
    ['x', 'y', 'z'].forEach(axis => {
      const value = latestReading[axis];
      const { min, max } = thresholds[axis];
      
      if (value < min || value > max) {
        const alarmType = value < min ? 'below_min' : 'above_max';
        const alarm = {
          id: `${axis}-${alarmType}-${Date.now()}`,
          axis,
          type: alarmType,
          value,
          threshold: alarmType === 'below_min' ? min : max,
          timestamp: new Date(),
          reading: { ...latestReading }
        };
        
        // Add to triggered alarms
        triggeredAlarms.push(alarm);
        
        // Add to active alarms if not already active
        if (!alarmService._activeAlarms[`${axis}-${alarmType}`]) {
          alarmService._activeAlarms[`${axis}-${alarmType}`] = alarm;
          
          // Also add to history
          alarmService._alarmHistory.push(alarm);
          
          // Limit history to 100 items
          if (alarmService._alarmHistory.length > 100) {
            alarmService._alarmHistory.shift();
          }
        }
      } else {
        // Clear active alarms for this axis if value is back within limits
        delete alarmService._activeAlarms[`${axis}-below_min`];
        delete alarmService._activeAlarms[`${axis}-above_max`];
      }
    });
    
    // Notify listeners if any alarms were triggered
    if (triggeredAlarms.length > 0) {
      Object.values(alarmService._listeners).forEach(callback => {
        try {
          callback(triggeredAlarms);
        } catch (e) {
          console.error('Error in alarm listener callback:', e);
        }
      });
    }
    
    return triggeredAlarms;
  },
  
  /**
   * Add a listener for alarm events
   * 
   * @param {Function} callback - Function to call when alarms are triggered
   * @returns {string} - Listener ID for removing later
   */
  addListener: (callback) => {
    if (typeof callback !== 'function') {
      console.error('Alarm listener must be a function');
      return null;
    }
    
    const listenerId = `listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    alarmService._listeners[listenerId] = callback;
    
    return listenerId;
  },
  
  /**
   * Remove a listener by ID
   * 
   * @param {string} listenerId - ID of listener to remove
   */
  removeListener: (listenerId) => {
    if (alarmService._listeners[listenerId]) {
      delete alarmService._listeners[listenerId];
    }
  },
  
  /**
   * Get active alarms
   * 
   * @returns {Array} - Array of active alarms
   */
  getActiveAlarms: () => {
    return Object.values(alarmService._activeAlarms);
  },
  
  /**
   * Get alarm history
   * 
   * @returns {Array} - Array of historical alarms
   */
  getAlarmHistory: () => {
    return [...alarmService._alarmHistory];
  },
  
  /**
   * Clear all active alarms
   */
  clearActiveAlarms: () => {
    alarmService._activeAlarms = {};
  },
  
  /**
   * Show browser notification for alarm
   * 
   * @param {Object} alarm - Alarm object
   */
  showNotification: (alarm) => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }
    
    if (Notification.permission === 'granted') {
      new Notification('AccelMonitor Alarm', {
        body: `${alarm.axis.toUpperCase()}-axis value ${alarm.value.toFixed(2)} 
               ${alarm.type === 'below_min' ? 'below' : 'above'} threshold 
               (${alarm.threshold.toFixed(2)})`,
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          alarmService.showNotification(alarm);
        }
      });
    }
  }
};

export default alarmService; 