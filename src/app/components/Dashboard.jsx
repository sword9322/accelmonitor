'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  const [refreshInterval, setRefreshInterval] = useState(1000);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('5m');
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
    x: { min: -1, max: 1 },
    y: { min: -1, max: 1 },
    z: { min: -1, max: 1 }
  });
  const [predictionEnabled, setPredictionEnabled] = useState(false);
  const [predictionMethod, setPredictionMethod] = useState('linear');
  const [predictedData, setPredictedData] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showAlarmPanel, setShowAlarmPanel] = useState(true);
  const [alarmsEnabled, setAlarmsEnabled] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);

  // Calculate statistics from accelerometer data
  const stats = useMemo(() => {
    if (!accelerometerData || accelerometerData.length === 0) {
      return {
        x: { min: 0, max: 0, avg: 0 },
        y: { min: 0, max: 0, avg: 0 },
        z: { min: 0, max: 0, avg: 0 }
      };
    }
    return accelerometerService.calculateStatistics(accelerometerData);
  }, [accelerometerData]);
  
  // Initialize alarm service with stored thresholds
  useEffect(() => {
    const storedThresholds = localStorage.getItem('alarmThresholds');
    if (storedThresholds) {
      try {
        setAlarmThresholds(JSON.parse(storedThresholds));
      } catch (error) {
        console.error('Error parsing stored alarm thresholds:', error);
      }
    }
  }, []);
  
  // Set up data subscription
  useEffect(() => {
    let unsubscribe;
    
    const setupSubscription = async () => {
      try {
        // Log with millisecond precision for sub-second intervals
        const intervalMs = refreshInterval;
        console.log(`Setting up data subscription with ${refreshInterval} ms interval (${intervalMs}ms) at ${new Date().toLocaleTimeString()}`);
        
        // Set up the subscription
        unsubscribe = accelerometerService.subscribe(data => {
          if (data && data.length > 0) {
            setAccelerometerData(data);
            setLastUpdated(new Date());
            setLoading(false);
            setError(null);
            // Update server status to active when receiving data
            setServerStatus({
              isActive: true,
              lastActivity: new Date(),
              consecutiveEmptyFetches: 0
            });
            
            // Check for alarms only if they're enabled
            if (alarmsEnabled) {
              const newAlarms = alarmService.checkThresholds(data);
              if (newAlarms.length > 0) {
                setActiveAlarms(prev => [...newAlarms, ...prev]);
                setAlarmHistory(prev => [...newAlarms, ...prev]);
              }
            }
            
            // Generate predictions if enabled
            if (predictionEnabled) {
              const predictions = predictionService.generatePredictions(data, predictionMethod);
              setPredictedData(predictions);
            }
          } else {
            // Update consecutive empty fetches counter
            setServerStatus(prev => ({
              ...prev,
              consecutiveEmptyFetches: prev.consecutiveEmptyFetches + 1,
              isActive: prev.consecutiveEmptyFetches < 5 // Consider inactive after 5 consecutive empty fetches
            }));
          }
        });
        
        // Start polling with specified interval
        accelerometerService.startPolling(refreshInterval);
        
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up data subscription:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    setupSubscription();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      accelerometerService.stopPolling();
    };
  }, [refreshInterval, alarmThresholds, predictionEnabled, predictionMethod, alarmsEnabled]);
  
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
  
  const handleToggleAlarms = () => {
    const newEnabledState = !alarmsEnabled;
    setAlarmsEnabled(newEnabledState);
    
    // If we're disabling alarms, clear any active ones
    if (!newEnabledState) {
      handleClearAlarms();
    }
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

  const toggleAlarmPanel = () => {
    setShowAlarmPanel(!showAlarmPanel);
  };

  const toggleStatistics = () => {
    setShowStatistics(!showStatistics);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen pt-16">
        <div className="w-16 h-16 border-t-4 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen pt-16">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${serverStatus.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700 font-medium">
              Server active
            </span>
          </div>
          <div className="text-gray-600">
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
          </div>
        </div>
        <button 
          onClick={toggleSettings}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>

      {/* Alarm Panel with toggle functionality */}
      {!loading && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2 bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <button 
                className="text-gray-500 hover:text-gray-700 mr-1" 
                onClick={toggleAlarmPanel}
                aria-label="Toggle alarm panel"
              >
                {showAlarmPanel ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <h2 className="text-xl font-semibold">Alarm Monitor</h2>
              {activeAlarms.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeAlarms.length}
                </span>
              )}
            </div>
            
            {/* Alarm Toggle Switch */}
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-600">{alarmsEnabled ? 'Alerts On' : 'Alerts Off'}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  className="sr-only peer"
                  checked={alarmsEnabled}
                  onChange={handleToggleAlarms}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          {showAlarmPanel && (
            <AlarmPanel 
              activeAlarms={activeAlarms} 
              alarmHistory={alarmHistory}
              onClearAlarms={handleClearAlarms}
              alarmsEnabled={alarmsEnabled}
              onToggleAlarms={handleToggleAlarms}
            />
          )}
        </div>
      )}

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
          onClearDatabase={handleClearDatabase}
          isClearing={isClearing}
          clearSuccess={clearSuccess}
        />
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-t-4 border-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2 bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <button 
                className="text-gray-500 hover:text-gray-700 mr-1" 
                onClick={toggleStatistics}
                aria-label="Toggle statistics panel"
              >
                {showStatistics ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <h2 className="text-xl font-semibold">Statistics</h2>
            </div>
          </div>
          
          {showStatistics && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-white">X Axis</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-sm text-gray-500">Min</span>
                      <p className="font-mono text-white">{stats.x.min.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Max</span>
                      <p className="font-mono text-white">{stats.x.max.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Avg</span>
                      <p className="font-mono text-white">{stats.x.avg.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-white">Y Axis</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-sm text-gray-500">Min</span>
                      <p className="font-mono text-white">{stats.y.min.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Max</span>
                      <p className="font-mono text-white">{stats.y.max.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Avg</span>
                      <p className="font-mono text-white">{stats.y.avg.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-white">Z Axis</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-sm text-gray-500">Min</span>
                      <p className="font-mono text-white">{stats.z.min.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Max</span>
                      <p className="font-mono text-white">{stats.z.max.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Avg</span>
                      <p className="font-mono text-white">{stats.z.avg.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
          data={accelerometerData} 
          predictedData={predictedData}
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
              data={accelerometerData} 
              axis="x" 
              color="rgb(255, 99, 132)" 
              timeRange={timeRange}
              title="X-Axis Acceleration"
            />
          </div>
          
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">Y-Axis Variations</h2>
            <AxisChart 
              data={accelerometerData} 
              axis="y" 
              color="rgb(75, 192, 192)" 
              timeRange={timeRange}
              title="Y-Axis Acceleration"
            />
          </div>
          
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">Z-Axis Variations</h2>
            <AxisChart 
              data={accelerometerData} 
              axis="z" 
              color="rgb(53, 162, 235)" 
              timeRange={timeRange}
              title="Z-Axis Acceleration"
            />
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4 text-white text-center">Recent Readings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-2 px-4 text-white">Time</th>
                <th className="text-left py-2 px-4 text-white">X</th>
                <th className="text-left py-2 px-4 text-white">Y</th>
                <th className="text-left py-2 px-4 text-white">Z</th>
                <th className="text-left py-2 px-4 text-white">Type</th>
              </tr>
            </thead>
            <tbody>
              {[...predictedData, ...accelerometerData].slice(0, 10).map((reading, index) => (
                <tr 
                  key={reading.id || index} 
                  className={`border-b dark:border-gray-700 ${
                    predictedData.includes(reading) ? 'text-blue-500' : ''
                  }`}
                >
                  <td className="py-2 px-4 text-white">
                    {reading.timestamp instanceof Date 
                      ? reading.timestamp.toLocaleString()
                      : new Date(reading.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 font-mono text-white">
                    {typeof reading.x === 'number' ? reading.x.toFixed(4) : 'N/A'}
                  </td>
                  <td className="py-2 px-4 font-mono text-white">
                    {typeof reading.y === 'number' ? reading.y.toFixed(4) : 'N/A'}
                  </td>
                  <td className="py-2 px-4 font-mono text-white">
                    {typeof reading.z === 'number' ? reading.z.toFixed(4) : 'N/A'}
                  </td>
                  <td className="py-2 px-4 text-white">
                    {predictedData.includes(reading) ? 'Predicted' : 'Actual'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
