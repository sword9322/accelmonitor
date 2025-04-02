/**
 * Prediction Service
 * 
 * Handles data prediction/forecasting for accelerometer data
 */

const predictionService = {
  /**
   * Predict future values using linear regression
   * 
   * @param {Array} data - Historical accelerometer data
   * @param {number} pointsAhead - Number of points to predict ahead
   * @returns {Array} - Predicted values
   */
  predictLinear: (data, pointsAhead = 10) => {
    if (!data || data.length < 2) {
      console.error('Not enough data points for prediction');
      return [];
    }
    
    // Make predictions for each axis
    const xPrediction = predictionService._linearRegression(data.map(d => d.x), pointsAhead);
    const yPrediction = predictionService._linearRegression(data.map(d => d.y), pointsAhead);
    const zPrediction = predictionService._linearRegression(data.map(d => d.z), pointsAhead);
    
    // Get the last timestamp to increment for predictions
    const lastTimestamp = data[0].timestamp instanceof Date
      ? data[0].timestamp.getTime()
      : new Date(data[0].timestamp * 1000).getTime();
    
    // Calculate time interval between last two points (or use default of 1 second)
    let timeInterval = 1000; // default: 1 second
    if (data.length >= 2) {
      const secondLastTimestamp = data[1].timestamp instanceof Date
        ? data[1].timestamp.getTime()
        : new Date(data[1].timestamp * 1000).getTime();
      
      const calculatedInterval = Math.abs(lastTimestamp - secondLastTimestamp);
      if (calculatedInterval > 0) {
        timeInterval = calculatedInterval;
      }
    }
    
    // Generate predicted data points
    const predictions = [];
    for (let i = 0; i < pointsAhead; i++) {
      const prediction = {
        id: `prediction-${i}`,
        x: xPrediction[i],
        y: yPrediction[i],
        z: zPrediction[i],
        timestamp: new Date(lastTimestamp + (i + 1) * timeInterval),
        isPrediction: true
      };
      
      predictions.push(prediction);
    }
    
    return predictions;
  },
  
  /**
   * Perform simple linear regression on values and predict future points
   * 
   * @param {Array} values - Array of historical values
   * @param {number} pointsAhead - Number of points to predict
   * @returns {Array} - Array of predicted values
   */
  _linearRegression: (values, pointsAhead) => {
    const n = values.length;
    
    // Simple case for small datasets
    if (n < 5) {
      return Array(pointsAhead).fill(values[0] || 0);
    }
    
    // Use only the most recent values for better prediction
    const recentValues = values.slice(0, Math.min(30, n));
    const recentN = recentValues.length;
    
    // X values are just indices
    const indices = Array.from({ length: recentN }, (_, i) => i);
    
    // Calculate means
    const meanX = indices.reduce((sum, x) => sum + x, 0) / recentN;
    const meanY = recentValues.reduce((sum, y) => sum + y, 0) / recentN;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < recentN; i++) {
      numerator += (indices[i] - meanX) * (recentValues[i] - meanY);
      denominator += Math.pow(indices[i] - meanX, 2);
    }
    
    // Avoid division by zero
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;
    
    // Generate predictions
    const predictions = [];
    for (let i = 1; i <= pointsAhead; i++) {
      const predX = recentN + i - 1;
      const predY = slope * predX + intercept;
      predictions.push(predY);
    }
    
    return predictions;
  },
  
  /**
   * Predict using exponential smoothing (for short-term forecasting)
   * 
   * @param {Array} data - Historical accelerometer data
   * @param {number} pointsAhead - Number of points to predict
   * @param {number} alpha - Smoothing factor (0-1)
   * @returns {Array} - Predicted values
   */
  predictExponentialSmoothing: (data, pointsAhead = 5, alpha = 0.3) => {
    if (!data || data.length < 2) {
      console.error('Not enough data points for prediction');
      return [];
    }
    
    // Make predictions for each axis
    const xPrediction = predictionService._exponentialSmoothing(data.map(d => d.x), pointsAhead, alpha);
    const yPrediction = predictionService._exponentialSmoothing(data.map(d => d.y), pointsAhead, alpha);
    const zPrediction = predictionService._exponentialSmoothing(data.map(d => d.z), pointsAhead, alpha);
    
    // Get the last timestamp to increment for predictions
    const lastTimestamp = data[0].timestamp instanceof Date
      ? data[0].timestamp.getTime()
      : new Date(data[0].timestamp * 1000).getTime();
    
    // Calculate time interval between points
    let timeInterval = 1000; // default: 1 second
    if (data.length >= 2) {
      const secondLastTimestamp = data[1].timestamp instanceof Date
        ? data[1].timestamp.getTime()
        : new Date(data[1].timestamp * 1000).getTime();
      
      const calculatedInterval = Math.abs(lastTimestamp - secondLastTimestamp);
      if (calculatedInterval > 0) {
        timeInterval = calculatedInterval;
      }
    }
    
    // Generate predicted data points
    const predictions = [];
    for (let i = 0; i < pointsAhead; i++) {
      const prediction = {
        id: `prediction-${i}`,
        x: xPrediction[i],
        y: yPrediction[i],
        z: zPrediction[i],
        timestamp: new Date(lastTimestamp + (i + 1) * timeInterval),
        isPrediction: true
      };
      
      predictions.push(prediction);
    }
    
    return predictions;
  },
  
  /**
   * Perform exponential smoothing
   * 
   * @param {Array} values - Array of historical values
   * @param {number} pointsAhead - Number of points to predict
   * @param {number} alpha - Smoothing factor (0-1)
   * @returns {Array} - Array of predicted values
   */
  _exponentialSmoothing: (values, pointsAhead, alpha) => {
    // Last known value
    const lastValue = values[0];
    
    // Calculate smoothed value
    let smoothedValue = lastValue;
    for (let i = 1; i < Math.min(values.length, 10); i++) {
      smoothedValue = alpha * values[i] + (1 - alpha) * smoothedValue;
    }
    
    // Generate predictions - in simple exponential smoothing,
    // all future predictions are the same as the last smoothed value
    return Array(pointsAhead).fill(smoothedValue);
  },
  
  /**
   * Evaluate prediction accuracy using Mean Absolute Error
   * 
   * @param {Array} actualValues - Array of actual values
   * @param {Array} predictedValues - Array of predicted values
   * @returns {number} - Mean Absolute Error
   */
  calculateMAE: (actualValues, predictedValues) => {
    if (actualValues.length !== predictedValues.length) {
      console.error('Actual and predicted value arrays must be the same length');
      return null;
    }
    
    const sum = actualValues.reduce((acc, actual, i) => {
      return acc + Math.abs(actual - predictedValues[i]);
    }, 0);
    
    return sum / actualValues.length;
  },
  
  /**
   * Evaluate prediction accuracy using Root Mean Square Error
   * 
   * @param {Array} actualValues - Array of actual values
   * @param {Array} predictedValues - Array of predicted values
   * @returns {number} - Root Mean Square Error
   */
  calculateRMSE: (actualValues, predictedValues) => {
    if (actualValues.length !== predictedValues.length) {
      console.error('Actual and predicted value arrays must be the same length');
      return null;
    }
    
    const sum = actualValues.reduce((acc, actual, i) => {
      return acc + Math.pow(actual - predictedValues[i], 2);
    }, 0);
    
    return Math.sqrt(sum / actualValues.length);
  }
};

export default predictionService; 