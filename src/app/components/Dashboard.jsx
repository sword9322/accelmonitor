'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AccelerometerChart from './AccelerometerChart';
import AxisChart from './AxisChart';
import SettingsPanel from './SettingsPanel';
import accelerometerService from '../services/accelerometerService';

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

  // Function to check if server is active based on data timestamps
  const checkServerStatus = (data) => {
    const now = Date.now();
    
    // If we have data
    if (data && data.length > 0) {
      // Get the most recent data point
      const latestReading = data[0];
      const latestTimestamp = latestReading.timestamp instanceof Date 
        ? latestReading.timestamp.getTime() 
        : new Date(latestReading.timestamp).getTime();
      
      // Server considered active if latest reading is within the last 30 seconds
      // Adjust this threshold based on expected data frequency
      const isActive = (now - latestTimestamp) < 30000;
      
      // Update server status
      setServerStatus({
        isActive: isActive,
        lastActivity: latestTimestamp,
        consecutiveEmptyFetches: 0 // Reset counter when we get data
      });
      
      return isActive;
    } else {
      // If no data, increment consecutive empty fetches
      setServerStatus(prev => ({
        ...prev,
        isActive: false,
        consecutiveEmptyFetches: prev.consecutiveEmptyFetches + 1
      }));
      
      return false;
    }
  };

  useEffect(() => {
    console.log(`Setting up polling with refresh interval: ${refreshInterval} seconds`);
    
    // Subscribe to accelerometer data updates
    const unsubscribe = accelerometerService.subscribe(data => {
      setAccelerometerData(data);
      setLoading(false);
      setLastUpdated(new Date());
      checkServerStatus(data);
    });

    // Start polling for data with the current refresh interval
    accelerometerService.stopPolling(); // Stop any existing polling
    accelerometerService.startPolling(refreshInterval * 1000);

    // Clean up subscription when component unmounts or when refreshInterval changes
    return () => {
      console.log('Cleaning up subscription');
      unsubscribe();
      accelerometerService.stopPolling();
    };
  }, [refreshInterval]); // Re-run effect when refreshInterval changes

  const handleRefreshIntervalChange = (seconds) => {
    console.log(`Setting refresh interval to ${seconds} seconds at ${new Date().toLocaleTimeString()}`);
    setRefreshInterval(seconds);
    // No need to manually restart polling here as the useEffect will handle it
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Calculate basic statistics from the data
  const calculateStats = () => {
    if (!accelerometerData || accelerometerData.length === 0) {
      return { x: {}, y: {}, z: {} };
    }

    const stats = accelerometerService.calculateStatistics(accelerometerData);
    return stats;
  };

  const stats = calculateStats();

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

      {showSettings && (
        <SettingsPanel 
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={handleRefreshIntervalChange}
          chartType={chartType}
          onChartTypeChange={handleChartTypeChange}
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          onClose={toggleSettings}
        />
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-t-4 border-primary rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center p-8 bg-red-50 text-red-500 rounded-lg">
          <p>Error loading accelerometer data: {error.message || 'Unknown error'}</p>
          <button 
            onClick={() => accelerometerService.startPolling(refreshInterval * 1000)}
            className="mt-4 btn btn-primary"
          >
            Retry
          </button>
        </div>
      ) : !serverStatus.isActive && serverStatus.consecutiveEmptyFetches > 2 ? (
        <div className="text-center p-8 bg-yellow-50 text-yellow-800 rounded-lg mb-8">
          <div className="flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h3 className="text-xl font-bold">Data Access Issue</h3>
          </div>
          <p>Unable to access accelerometer data. This could be due to one of the following reasons:</p>
          <ul className="mt-2 list-disc list-inside text-left mb-4">
            <li>The API server is not running or not sending data to Firebase</li>
            <li>Firebase database permission rules need to be updated</li>
            <li>There may be network connectivity issues</li>
          </ul>
          <div className="mt-4 bg-white p-4 rounded-md text-left shadow-sm">
            <p className="font-mono text-sm mb-2">Last data update: {serverStatus.lastActivity ? new Date(serverStatus.lastActivity).toLocaleTimeString() : 'Never'}</p>
            <p className="font-mono text-sm">
              If you're an administrator, please check:
              <br/>1. API server is running
              <br/>2. Firebase Realtime Database rules allow reading from simulator_user path
              <br/>3. Firebase project is properly configured in the app
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">X-Axis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Min</p>
                <p className="text-xl">{stats.x.min || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Max</p>
                <p className="text-xl">{stats.x.max || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Avg</p>
                <p className="text-xl">{stats.x.avg || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Current</p>
                <p className="text-xl">{accelerometerData[0]?.x.toFixed(3) || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">Y-Axis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Min</p>
                <p className="text-xl">{stats.y.min || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Max</p>
                <p className="text-xl">{stats.y.max || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Avg</p>
                <p className="text-xl">{stats.y.avg || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Current</p>
                <p className="text-xl">{accelerometerData[0]?.y.toFixed(3) || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-2">Z-Axis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Min</p>
                <p className="text-xl">{stats.z.min || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Max</p>
                <p className="text-xl">{stats.z.max || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Avg</p>
                <p className="text-xl">{stats.z.avg || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Current</p>
                <p className="text-xl">{accelerometerData[0]?.z.toFixed(3) || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Combined Accelerometer Data</h2>
        <AccelerometerChart 
          data={accelerometerData} 
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
              </tr>
            </thead>
            <tbody>
              {accelerometerData.slice(0, 10).map((reading, index) => (
                <tr key={reading.id || index} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{reading.timestamp?.toLocaleTimeString() || 'Unknown'}</td>
                  <td className="px-4 py-2">{reading.x.toFixed(4)}</td>
                  <td className="px-4 py-2">{reading.y.toFixed(4)}</td>
                  <td className="px-4 py-2">{reading.z.toFixed(4)}</td>
                </tr>
              ))}
              {accelerometerData.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
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
