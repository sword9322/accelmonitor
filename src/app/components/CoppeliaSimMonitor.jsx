'use client';

import React, { useState, useEffect, useRef } from 'react';
import AccelerometerChart from './AccelerometerChart';
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
        
        // Start the polling service
        accelerometerService.startPolling(1000); // Poll every second
        
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
  }, [isLogging]);
  
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
  
  // Get the current accelerometer reading
  const currentReading = accelerometerData && accelerometerData.length > 0 ? accelerometerData[0] : null;
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">CoppeliaSim Accelerometer Monitor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Status Card */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              status === STATUS.CONNECTED ? 'bg-success' :
              status === STATUS.CONNECTING ? 'bg-warning' :
              status === STATUS.ERROR ? 'bg-danger' : 'bg-gray-400'
            }`}></div>
            <span className="capitalize">{status}</span>
          </div>
          
          {status === STATUS.ERROR && (
            <div className="text-danger text-sm mt-2">
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
        
        <div className="flex-grow"></div>
        
        <div className="flex items-end">
          <button 
            onClick={toggleLogging}
            className={`btn ${isLogging ? 'bg-danger text-white' : 'btn-primary'}`}
          >
            {isLogging ? 'Stop Logging' : 'Start Logging'}
          </button>
        </div>
      </div>
      
      {/* Chart */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Accelerometer Data</h2>
        <AccelerometerChart 
          data={accelerometerData} 
          chartType={chartType}
          timeRange={timeRange}
        />
      </div>
      
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
  );
}
