'use client';

import React, { useState, useEffect, useRef } from 'react';
import AccelerometerChart from './AccelerometerChart';
import AxisChart from './AxisChart';
import accelerometerService from '../services/accelerometerService';

const STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
};

export default function CoppeliaSimMonitor() {
  const [status, setStatus] = useState(STATUS.DISCONNECTED);
  const [accelerometerData, setAccelerometerData] = useState([]);
  const [error, setError] = useState(null);
  const [isLogging, setIsLogging] = useState(false);
  const [logEntries, setLogEntries] = useState([]);
  const [showRawData, setShowRawData] = useState(false);
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('5m');
  const [pollingFrequency, setPollingFrequency] = useState(1000); // default 1 second
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    // Connect to the accelerometer service
    const connectToSimulator = async () => {
      try {
        setStatus(STATUS.CONNECTING);
        
        // Subscribe to accelerometer data updates
        const unsubscribe = accelerometerService.subscribe(data => {
          if (data && data.length > 0) {
            setAccelerometerData(data);
            setStatus(STATUS.CONNECTED);
            
            // Add log entries when logging is enabled
            if (isLogging) {
              const latestReading = data[0];
              if (latestReading) {
                const timestamp = new Date().toLocaleTimeString();
                const logEntry = `${timestamp} - X: ${latestReading.x.toFixed(4)}, Y: ${latestReading.y.toFixed(4)}, Z: ${latestReading.z.toFixed(4)}`;
                setLogEntries(prevEntries => [logEntry, ...prevEntries].slice(0, 100)); // Keep only the latest 100 entries
              }
            }
          }
        });
        
        // Start the polling service with the current polling frequency
        accelerometerService.startPolling(pollingFrequency);
        
        return unsubscribe;
      } catch (err) {
        console.error('Error connecting to simulator:', err);
        setError(err.message || 'Failed to connect to CoppeliaSim');
        setStatus(STATUS.ERROR);
      }
    };
    
    const unsubscribe = connectToSimulator();
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      accelerometerService.stopPolling();
    };
  }, [isLogging, pollingFrequency]);
  
  useEffect(() => {
    // Auto-scroll log to bottom when new entries are added
    if (logRef.current && isLogging) {
      logRef.current.scrollTop = 0;
    }
  }, [logEntries, isLogging]);
  
  const toggleLogging = () => {
    setIsLogging(!isLogging);
    if (!isLogging) {
      // Clear previous log entries when starting a new log
      setLogEntries([]);
    }
  };
  
  const clearLog = () => {
    setLogEntries([]);
  };
  
  const downloadLog = () => {
    if (logEntries.length === 0) return;
    
    const logText = logEntries.reverse().join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coppelia-accelerometer-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };
  
  const handleChartTypeChange = (e) => {
    setChartType(e.target.value);
  };

  const handlePollingFrequencyChange = (e) => {
    const frequency = parseInt(e.target.value, 10);
    setPollingFrequency(frequency);
    // The useEffect will restart polling with the new frequency automatically
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
  
  // Get the current accelerometer reading
  const currentReading = accelerometerData && accelerometerData.length > 0 ? accelerometerData[0] : null;
  
  return (
    <div className="w-full">
      {/* Full-width top bar */}
      <div className="w-full bg-indigo-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">CoppeliaSim Accelerometer Monitor</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => window.document.documentElement.requestFullscreen()}
            className="px-4 py-2 bg-indigo-700 rounded hover:bg-indigo-800 transition"
          >
            Fullscreen Mode
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-white text-indigo-600 rounded hover:bg-gray-100 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      
      {/* Information alert */}
      <div className="w-full bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-800">
          This page provides real-time monitoring of accelerometer data from CoppeliaSim. The graph below shows the most recent readings for all three axes (X, Y, Z).
        </p>
        <p className="text-blue-700 mt-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          Configure the update interval and chart range using the controls below the chart.
        </p>
      </div>
      
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Status Card */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${
                status === STATUS.CONNECTED ? 'bg-green-500' :
                status === STATUS.CONNECTING ? 'bg-yellow-500' :
                status === STATUS.ERROR ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
              <span className="capitalize">{status}</span>
            </div>
            
            {status === STATUS.ERROR && (
              <div className="text-red-500 text-sm mt-2">
                {error || 'Failed to connect to CoppeliaSim'}
              </div>
            )}
            
            <button 
              onClick={() => accelerometerService.startPolling(1000)}
              className="btn btn-primary mt-2 text-sm"
              disabled={status === STATUS.CONNECTING || status === STATUS.CONNECTED}
            >
              Reconnect
            </button>
          </div>
          
          {/* Current Reading Card */}
          <div className="card p-4 col-span-1 md:col-span-2">
            <h2 className="text-lg font-semibold mb-2">Current Reading</h2>
            {currentReading ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600">X-Axis</p>
                  <p className="text-2xl font-mono">{currentReading.x.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Y-Axis</p>
                  <p className="text-2xl font-mono">{currentReading.y.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Z-Axis</p>
                  <p className="text-2xl font-mono">{currentReading.z.toFixed(4)}</p>
                </div>
                <div className="col-span-3 text-xs text-gray-500">
                  Last updated: {currentReading.timestamp ? (
                    currentReading.timestamp instanceof Date 
                      ? currentReading.timestamp.toLocaleTimeString() 
                      : new Date(currentReading.timestamp).toLocaleTimeString()
                  ) : 'Unknown'}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </div>
        </div>
        
        {/* Database Management */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
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
            </div>
            
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
        
        {/* Chart Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select 
              id="timeRange" 
              className="input"
              value={timeRange}
              onChange={handleTimeRangeChange}
            >
              <option value="5m">Last 5 minutes</option>
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last hour</option>
              <option value="24h">Last 24 hours</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="chartType" className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
            <select 
              id="chartType" 
              className="input"
              value={chartType}
              onChange={handleChartTypeChange}
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>

          <div>
            <label htmlFor="pollingFrequency" className="block text-sm font-medium text-gray-700 mb-1">Update Frequency</label>
            <select 
              id="pollingFrequency" 
              className="input"
              value={pollingFrequency}
              onChange={handlePollingFrequencyChange}
            >
              <option value="200">Live (200ms)</option>
              <option value="500">Fast (500ms)</option>
              <option value="1000">Normal (1s)</option>
              <option value="2000">Slow (2s)</option>
              <option value="5000">Very Slow (5s)</option>
            </select>
          </div>
          
          <div className="flex-grow"></div>
          
          <div className="flex items-end">
            <button 
              onClick={toggleLogging}
              className={`btn ${isLogging ? 'bg-red-500 text-white' : 'btn-primary'}`}
            >
              {isLogging ? 'Stop Logging' : 'Start Logging'}
            </button>
          </div>
        </div>
        
        {/* Combined Chart */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Combined Accelerometer Data</h2>
          <AccelerometerChart 
            data={accelerometerData} 
            chartType={chartType}
            timeRange={timeRange}
          />
        </div>
        
        {/* Individual Axis Charts */}
        {accelerometerData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* X-Axis Chart */}
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
            
            {/* Y-Axis Chart */}
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
            
            {/* Z-Axis Chart */}
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
        
        {/* Data Logger Section */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Data Log</h2>
            <div className="flex gap-2">
              <button 
                onClick={clearLog}
                className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
                disabled={logEntries.length === 0}
              >
                Clear Log
              </button>
              <button 
                onClick={downloadLog}
                className="btn btn-primary"
                disabled={logEntries.length === 0}
              >
                Download Log
              </button>
            </div>
          </div>
          
          <div 
            ref={logRef}
            className="h-60 overflow-y-auto bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm"
          >
            {logEntries.length > 0 ? (
              logEntries.map((entry, index) => (
                <div key={index} className="mb-1">{entry}</div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">
                {isLogging ? 'Logging data...' : 'Start logging to capture data'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
