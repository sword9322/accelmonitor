'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AccelerometerChart from './AccelerometerChart';
import AxisChart from './AxisChart';
import SettingsPanel from './SettingsPanel';
import AlarmPanel from './AlarmPanel';
import accelerometerService from '../services/accelerometerService';
import alarmService from '../services/alarmService';
import reportService from '../services/reportService';
import predictionService from '../services/predictionService';

export default function Dashboard() {
  const { user } = useAuth();
  const [accelerometerData, setAccelerometerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('5m'); // 5 minutes
  const [serverStatus, setServerStatus] = useState({ 
    isActive: false, 
    lastActivity: null,
    consecutiveEmptyFetches: 0
  });
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(null);
  
  // New states for alarms, reports, and predictions
  const [activeAlarms, setActiveAlarms] = useState([]);
  const [alarmHistory, setAlarmHistory] = useState([]);
  const [alarmThresholds, setAlarmThresholds] = useState({
    x: { min: -10, max: 10 },
    y: { min: -10, max: 10 },
    z: { min: -10, max: 10 }
  });
  const [predictionEnabled, setPredictionEnabled] = useState(false);
  const [predictionMethod, setPredictionMethod] = useState('linear');
  const [predictedData, setPredictedData] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Initialize alarm service with stored thresholds
  useEffect(() => {
    // Get stored thresholds from localStorage or use defaults
    const storedThresholds = alarmService.getThresholds();
    setAlarmThresholds(storedThresholds);
  }, []);
  
  useEffect(() => {
    // Set up data polling when the component mounts
    const fetchData = async () => {
      try {
        // Log with millisecond precision for sub-second intervals
        const intervalMs = refreshInterval * 1000;
        console.log(`Setting up data subscription with ${refreshInterval} second interval (${intervalMs}ms) at ${new Date().toLocaleTimeString()}`);
        
        // Set up the subscription
        const unsubscribe = accelerometerService.subscribe(newData => {
          if (newData && newData.length > 0) {
            setAccelerometerData(newData);
            setLastUpdated(new Date());
            setLoading(false);
            
            // Update server status
            setServerStatus({
              isActive: true,
              lastActivity: new Date(),
              consecutiveEmptyFetches: 0
            });
            
            // Check for alarms
            const triggeredAlarms = alarmService.checkThresholds(newData);
            if (triggeredAlarms.length > 0) {
              setActiveAlarms(alarmService.getActiveAlarms());
              setAlarmHistory(alarmService.getAlarmHistory());
              
              // Show browser notification for new alarms
              triggeredAlarms.forEach(alarm => {
                alarmService.showNotification(alarm);
              });
            }
            
            // Generate predictions if enabled
            if (predictionEnabled && newData.length >= 5) {
              const predictions = predictionMethod === 'linear'
                ? predictionService.predictLinear(newData)
                : predictionService.predictExponentialSmoothing(newData);
              
              setPredictedData(predictions);
            } else {
              setPredictedData([]);
            }
          } else if (newData && newData.length === 0) {
            setServerStatus(prevStatus => ({
              ...prevStatus,
              consecutiveEmptyFetches: prevStatus.consecutiveEmptyFetches + 1,
              isActive: prevStatus.consecutiveEmptyFetches < 5 // Consider inactive after 5 empty fetches
            }));
          }
        });
        
        // Start polling with specified interval (convert seconds to ms)
        accelerometerService.startPolling(refreshInterval * 1000);
        
        return unsubscribe;
      } catch (err) {
        console.error('Error setting up data subscription:', err);
        setError(err.message);
        setLoading(false);
        return () => {};
      }
    };
    
    const unsubscribe = fetchData();
    
    // Clean up on unmount
    return () => {
      console.log('Cleaning up data subscription');
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      accelerometerService.stopPolling();
    };
  }, [refreshInterval, predictionEnabled, predictionMethod]);
  
  const handleRefreshIntervalChange = (seconds) => {
    // Make sure we're handling seconds as a float
    const intervalInSeconds = parseFloat(seconds);
    console.log(`Setting refresh interval to ${intervalInSeconds} seconds (${intervalInSeconds * 1000}ms)`);
    setRefreshInterval(intervalInSeconds);
    // No need to manually restart polling here as the useEffect will handle it
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };
  
  const handleAlarmThresholdsChange = (thresholds) => {
    setAlarmThresholds(thresholds);
    
    // Update alarm service with new thresholds
    Object.entries(thresholds).forEach(([axis, { min, max }]) => {
      alarmService.setThreshold(axis, min, max);
    });
    
    // Re-check current data with new thresholds
    if (accelerometerData.length > 0) {
      alarmService.checkThresholds(accelerometerData);
      setActiveAlarms(alarmService.getActiveAlarms());
    }
  };
  
  const handleClearAlarms = () => {
    alarmService.clearActiveAlarms();
    setActiveAlarms([]);
  };
  
  const handlePredictionEnabledChange = (enabled) => {
    setPredictionEnabled(enabled);
    
    // Clear predictions if disabled
    if (!enabled) {
      setPredictedData([]);
    }
  };
  
  const handlePredictionMethodChange = (method) => {
    setPredictionMethod(method);
  };
  
  const handleGenerateReport = (timeInterval) => {
    if (!accelerometerData || accelerometerData.length === 0) {
      alert('No data available to generate a report.');
      return;
    }
    
    setIsGeneratingReport(true);
    
    try {
      // Generate report data
      const reportData = reportService.generateReportData(timeInterval, accelerometerData);
      
      // Generate CSV content
      const csvContent = reportService.generateCSVReport(reportData);
      
      // Trigger download
      reportService.downloadCSV(csvContent, `accel-report-${timeInterval}-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  const handleClearDatabase = async () => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to clear all accelerometer data from the database? This action cannot be undone.')) {
      return;
    }
    
    setIsClearing(true);
    setClearSuccess(null);
    
    try {
      const success = await accelerometerService.clearSimulatorData();
      setClearSuccess(success);
      if (success) {
        setAccelerometerData([]); // Clear local data as well
        setPredictedData([]); // Clear predictions
        handleClearAlarms(); // Clear any active alarms
      }
    } catch (error) {
      console.error('Error clearing database:', error);
      setClearSuccess(false);
    } finally {
      setIsClearing(false);
      
      // Hide success message after 3 seconds
      if (setClearSuccess) {
        setTimeout(() => {
          setClearSuccess(null);
        }, 3000);
      }
    }
  };

  // Calculate basic statistics from the data
  const calculateStats = () => {
    if (!accelerometerData || accelerometerData.length === 0) {
      return { 
        x: { min: null, max: null, avg: null, stdDev: null }, 
        y: { min: null, max: null, avg: null, stdDev: null }, 
        z: { min: null, max: null, avg: null, stdDev: null } 
      };
    }

    const stats = accelerometerService.calculateStatistics(accelerometerData);
    return stats;
  };
  
  // Combine actual and predicted data for charts (if prediction is enabled)
  const getChartData = () => {
    if (predictionEnabled && predictedData.length > 0) {
      // Create a copy of the data to avoid modifying the original
      const combinedData = [...accelerometerData];
      
      // Add predicted data with a flag to distinguish it
      predictedData.forEach(point => {
        combinedData.push({
          ...point,
          isPrediction: true  // Flag to style differently in charts
        });
      });
      
      return combinedData;
    }
    
    return accelerometerData;
  };

  const stats = calculateStats();
  const chartData = getChartData();
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Accelerometer Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${serverStatus.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="text-sm text-gray-600">
              {serverStatus.isActive 
                ? 'Server active' 
                : 'Server inactive'}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </div>
          <button 
            onClick={toggleSettings}
            className="btn btn-primary flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* Alarm Panel */}
      {!loading && (
        <AlarmPanel 
          activeAlarms={activeAlarms} 
          alarmHistory={alarmHistory}
          onClearAlarms={handleClearAlarms}
        />
      )}

      {/* Database Management */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <button
            onClick={handleClearDatabase}
            disabled={isClearing}
            className="btn bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
          >
            {isClearing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Clearing Database...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Clear Database
              </>
            )}
          </button>
          
          {clearSuccess !== null && (
            <div className={`text-sm ${clearSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {clearSuccess 
                ? 'Database cleared successfully!' 
                : 'Failed to clear database. Please try again.'}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          This will delete all accelerometer readings from the database to save space on the free tier.
        </p>
      </div>

      {showSettings && (
        <SettingsPanel 
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={handleRefreshIntervalChange}
          chartType={chartType}
          onChartTypeChange={handleChartTypeChange}
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          alarmThresholds={alarmThresholds}
          onAlarmThresholdsChange={handleAlarmThresholdsChange}
          predictionEnabled={predictionEnabled}
          onPredictionEnabledChange={handlePredictionEnabledChange}
          predictionMethod={predictionMethod}
          onPredictionMethodChange={handlePredictionMethodChange}
          onClose={toggleSettings}
          onGenerateReport={handleGenerateReport}
        />
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-t-4 border-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">X-Axis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Min</p>
                <p className="text-xl">{stats.x?.min !== null && stats.x?.min !== undefined ? stats.x.min : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Max</p>
                <p className="text-xl">{stats.x?.max !== null && stats.x?.max !== undefined ? stats.x.max : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Avg</p>
                <p className="text-xl">{stats.x?.avg !== null && stats.x?.avg !== undefined ? stats.x.avg : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Current</p>
                <p className="text-xl">{accelerometerData[0]?.x !== undefined ? accelerometerData[0].x.toFixed(3) : 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">Y-Axis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Min</p>
                <p className="text-xl">{stats.y?.min !== null && stats.y?.min !== undefined ? stats.y.min : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Max</p>
                <p className="text-xl">{stats.y?.max !== null && stats.y?.max !== undefined ? stats.y.max : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Avg</p>
                <p className="text-xl">{stats.y?.avg !== null && stats.y?.avg !== undefined ? stats.y.avg : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Current</p>
                <p className="text-xl">{accelerometerData[0]?.y !== undefined ? accelerometerData[0].y.toFixed(3) : 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">Z-Axis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Min</p>
                <p className="text-xl">{stats.z?.min !== null && stats.z?.min !== undefined ? stats.z.min : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Max</p>
                <p className="text-xl">{stats.z?.max !== null && stats.z?.max !== undefined ? stats.z.max : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Avg</p>
                <p className="text-xl">{stats.z?.avg !== null && stats.z?.avg !== undefined ? stats.z.avg : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Current</p>
                <p className="text-xl">{accelerometerData[0]?.z !== undefined ? accelerometerData[0].z.toFixed(3) : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Combined Accelerometer Data
          {predictionEnabled && (
            <span className="ml-2 text-sm font-normal text-blue-500">
              (with {predictionMethod === 'linear' ? 'Linear' : 'Exponential'} Prediction)
            </span>
          )}
        </h2>
        <AccelerometerChart 
          data={chartData} 
          chartType={chartType}
          timeRange={timeRange}
        />
      </div>

      {/* Individual Axis Charts */}
      {!loading && accelerometerData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">X-Axis Variations</h2>
            <AxisChart 
              data={chartData} 
              axis="x" 
              color="rgb(255, 99, 132)" 
              timeRange={timeRange}
              title="X-Axis Acceleration"
            />
          </div>
          
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">Y-Axis Variations</h2>
            <AxisChart 
              data={chartData} 
              axis="y" 
              color="rgb(75, 192, 192)" 
              timeRange={timeRange}
              title="Y-Axis Acceleration"
            />
          </div>
          
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">Z-Axis Variations</h2>
            <AxisChart 
              data={chartData} 
              axis="z" 
              color="rgb(53, 162, 235)" 
              timeRange={timeRange}
              title="Z-Axis Acceleration"
            />
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Readings</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-2 text-left text-white">Time</th>
                <th className="px-4 py-2 text-left text-white">X-Axis</th>
                <th className="px-4 py-2 text-left text-white">Y-Axis</th>
                <th className="px-4 py-2 text-left text-white">Z-Axis</th>
                {predictionEnabled && <th className="px-4 py-2 text-left text-white">Type</th>}
              </tr>
            </thead>
            <tbody>
              {chartData.slice(0, 10).map((reading, index) => (
                <tr key={reading.id || index} className={reading.isPrediction ? 'bg-blue-50 dark:bg-blue-900' : 'border-b border-gray-200 dark:border-gray-700'}>
                  <td className="px-4 py-2">
                    {reading.timestamp ? 
                      (reading.timestamp instanceof Date 
                        ? reading.timestamp.toLocaleTimeString() 
                        : typeof reading.timestamp === 'number'
                          ? new Date(reading.timestamp * 1000).toLocaleTimeString()
                          : 'Unknown') 
                      : 'Unknown'}
                  </td>
                  <td className="px-4 py-2">{typeof reading.x === 'number' ? reading.x.toFixed(4) : 'N/A'}</td>
                  <td className="px-4 py-2">{typeof reading.y === 'number' ? reading.y.toFixed(4) : 'N/A'}</td>
                  <td className="px-4 py-2">{typeof reading.z === 'number' ? reading.z.toFixed(4) : 'N/A'}</td>
                  {predictionEnabled && (
                    <td className="px-4 py-2">
                      {reading.isPrediction ? (
                        <span className="text-blue-500">Predicted</span>
                      ) : (
                        <span className="text-green-500">Actual</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {chartData.length === 0 && (
                <tr>
                  <td colSpan={predictionEnabled ? "5" : "4"} className="px-4 py-8 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
