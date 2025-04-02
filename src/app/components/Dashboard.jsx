'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AccelerometerChart from './AccelerometerChart';
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

  useEffect(() => {
    console.log(`Setting up polling with refresh interval: ${refreshInterval} seconds`);
    
    // Subscribe to accelerometer data updates
    const unsubscribe = accelerometerService.subscribe(data => {
      setAccelerometerData(data);
      setLoading(false);
      setLastUpdated(new Date());
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
        <h2 className="text-xl font-semibold mb-4">Accelerometer Data</h2>
        <AccelerometerChart 
          data={accelerometerData} 
          chartType={chartType}
          timeRange={timeRange}
        />
      </div>

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
