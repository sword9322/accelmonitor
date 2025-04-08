'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPanel({ 
  refreshInterval, 
  onRefreshIntervalChange, 
  chartType,
  onChartTypeChange,
  timeRange, 
  onTimeRangeChange,
  alarmThresholds,
  onAlarmThresholdsChange,
  predictionEnabled,
  onPredictionEnabledChange,
  predictionMethod,
  onPredictionMethodChange,
  onClose,
  onGenerateReport,
  onClearDatabase,
  isClearing,
  clearSuccess
}) {
  // ===== START: Hooks moved to top =====
  const { user } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(refreshInterval);
  const [selectedChartType, setSelectedChartType] = useState(chartType);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedReportTimeInterval, setSelectedReportTimeInterval] = useState('30m');
  const [selectedPredictionEnabled, setSelectedPredictionEnabled] = useState(predictionEnabled ?? false);
  const [selectedPredictionMethod, setSelectedPredictionMethod] = useState(predictionMethod ?? 'linear');
  const [xMinThreshold, setXMinThreshold] = useState(alarmThresholds?.x?.min ?? -10);
  const [xMaxThreshold, setXMaxThreshold] = useState(alarmThresholds?.x?.max ?? 10);
  const [yMinThreshold, setYMinThreshold] = useState(alarmThresholds?.y?.min ?? -10);
  const [yMaxThreshold, setYMaxThreshold] = useState(alarmThresholds?.y?.max ?? 10);
  const [zMinThreshold, setZMinThreshold] = useState(alarmThresholds?.z?.min ?? -10);
  const [zMaxThreshold, setZMaxThreshold] = useState(alarmThresholds?.z?.max ?? 10);

  // Effect to update selectedInterval when prop changes
  useEffect(() => {
    setSelectedInterval(refreshInterval);
  }, [refreshInterval]);
  // ===== END: Hooks moved to top =====

  // Redirect non-admin users (runs AFTER hooks)
  useEffect(() => {
    // Consider adding check for auth loading state from useAuth if available
    // e.g., if (authLoading) return;
    if (user !== undefined && user !== null && !user.isAdmin) { 
      router.push('/access-denied');
    }
  }, [user, router]); // Add authLoading dependency if used

  // Conditional rendering (runs AFTER hooks)
  // Consider adding check for auth loading state
  // e.g., if (authLoading) return <LoadingSpinner />;
  if (user === undefined || user === null || !user.isAdmin) {
    // Return null only if user is loaded and not an admin, or not loaded
    return null; 
  }

  // Update frequency options
  const updateFrequencyOptions = [
    { label: 'Live (100ms)', value: 0.1 },
    { label: 'Very Fast (200ms)', value: 0.2 },
    { label: 'Fast (500ms)', value: 0.5 },
    { label: '1 second', value: 1 },
    { label: '2 seconds', value: 2 },
    { label: '5 seconds', value: 5 },
    { label: '10 seconds', value: 10 },
    { label: '30 seconds', value: 30 },
    { label: '1 minute', value: 60 }
  ];

  // Chart type options
  const chartTypeOptions = [
    { label: 'Line Chart', value: 'line' },
    { label: 'Bar Chart', value: 'bar' },
  ];

  // Time range options
  const timeRangeOptions = [
    { label: 'Last 5 minutes', value: '5m' },
    { label: 'Last 15 minutes', value: '15m' },
    { label: 'Last hour', value: '1h' },
    { label: 'Last 24 hours', value: '24h' },
  ];
  
  // Report time interval options
  const reportTimeIntervalOptions = [
    { label: 'Last 10 minutes', value: '10m' },
    { label: 'Last 30 minutes', value: '30m' },
    { label: 'Last hour', value: '60m' },
    { label: 'Last 4 hours', value: '4h' },
    { label: 'Last day', value: '24h' },
  ];
  
  // Prediction method options
  const predictionMethodOptions = [
    { label: 'Linear Regression', value: 'linear' },
    { label: 'Exponential Smoothing', value: 'exponential' },
  ];

  // Handle update frequency change
  const handleUpdateFrequencyChange = (e) => {
    const newInterval = parseFloat(e.target.value);
    console.log(`Setting refresh interval to ${newInterval} seconds (${newInterval * 1000}ms)`);
    setSelectedInterval(newInterval);
  };

  // Handle chart type change
  const handleChartTypeChange = (e) => {
    const newChartType = e.target.value;
    setSelectedChartType(newChartType);
  };

  // Handle time range change
  const handleTimeRangeChange = (e) => {
    const newTimeRange = e.target.value;
    setSelectedTimeRange(newTimeRange);
  };
  
  // Handle report time interval change
  const handleReportTimeIntervalChange = (e) => {
    setSelectedReportTimeInterval(e.target.value);
  };
  
  // Handle prediction enabled change
  const handlePredictionEnabledChange = (e) => {
    setSelectedPredictionEnabled(e.target.checked);
  };
  
  // Handle prediction method change
  const handlePredictionMethodChange = (e) => {
    setSelectedPredictionMethod(e.target.value);
  };
  
  // Handle generating a report
  const handleGenerateReport = () => {
    if (onGenerateReport) {
      onGenerateReport(selectedReportTimeInterval);
    }
  };

  // Apply settings
  const handleSave = () => {
    setIsSaving(true);
    
    // Ensure the interval is properly passed as a float
    onRefreshIntervalChange(selectedInterval);
    onChartTypeChange(selectedChartType);
    onTimeRangeChange(selectedTimeRange);
    
    // Save alarm thresholds
    if (onAlarmThresholdsChange) {
      onAlarmThresholdsChange({
        x: { min: parseFloat(xMinThreshold), max: parseFloat(xMaxThreshold) },
        y: { min: parseFloat(yMinThreshold), max: parseFloat(yMaxThreshold) },
        z: { min: parseFloat(zMinThreshold), max: parseFloat(zMaxThreshold) }
      });
    }
    
    // Save prediction settings
    if (onPredictionEnabledChange) {
      onPredictionEnabledChange(selectedPredictionEnabled);
    }
    
    if (onPredictionMethodChange) {
      onPredictionMethodChange(selectedPredictionMethod);
    }
    
    // Simulate saving delay
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 500);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Dashboard Settings</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium mb-2">Display Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="updateFrequency" className="block text-sm font-medium mb-1">
              Update Frequency
            </label>
            <select
              id="updateFrequency"
              value={selectedInterval}
              onChange={handleUpdateFrequencyChange}
              className="input w-full"
            >
              {updateFrequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How often to fetch new data
            </p>
          </div>

          <div>
            <label htmlFor="chartType" className="block text-sm font-medium mb-1">
              Chart Type
            </label>
            <select
              id="chartType"
              value={selectedChartType}
              onChange={handleChartTypeChange}
              className="input w-full"
            >
              {chartTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="timeRange" className="block text-sm font-medium mb-1">
              Time Range
            </label>
            <select
              id="timeRange"
              value={selectedTimeRange}
              onChange={handleTimeRangeChange}
              className="input w-full"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium mb-2">Alarm Settings</h4>
        <p className="text-xs text-gray-500 mb-2">
          Set thresholds for each axis. Alarms will trigger when values exceed these ranges.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">X-Axis Thresholds</label>
            <div className="flex gap-2">
              <div>
                <label htmlFor="xMinThreshold" className="block text-xs text-gray-500 mb-1">Min</label>
                <input
                  id="xMinThreshold"
                  type="number"
                  value={xMinThreshold}
                  onChange={(e) => setXMinThreshold(e.target.value)}
                  className="input w-full"
                  step="0.1"
                />
              </div>
              <div>
                <label htmlFor="xMaxThreshold" className="block text-xs text-gray-500 mb-1">Max</label>
                <input
                  id="xMaxThreshold"
                  type="number"
                  value={xMaxThreshold}
                  onChange={(e) => setXMaxThreshold(e.target.value)}
                  className="input w-full"
                  step="0.1"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Y-Axis Thresholds</label>
            <div className="flex gap-2">
              <div>
                <label htmlFor="yMinThreshold" className="block text-xs text-gray-500 mb-1">Min</label>
                <input
                  id="yMinThreshold"
                  type="number"
                  value={yMinThreshold}
                  onChange={(e) => setYMinThreshold(e.target.value)}
                  className="input w-full"
                  step="0.1"
                />
              </div>
              <div>
                <label htmlFor="yMaxThreshold" className="block text-xs text-gray-500 mb-1">Max</label>
                <input
                  id="yMaxThreshold"
                  type="number"
                  value={yMaxThreshold}
                  onChange={(e) => setYMaxThreshold(e.target.value)}
                  className="input w-full"
                  step="0.1"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Z-Axis Thresholds</label>
            <div className="flex gap-2">
              <div>
                <label htmlFor="zMinThreshold" className="block text-xs text-gray-500 mb-1">Min</label>
                <input
                  id="zMinThreshold"
                  type="number"
                  value={zMinThreshold}
                  onChange={(e) => setZMinThreshold(e.target.value)}
                  className="input w-full"
                  step="0.1"
                />
              </div>
              <div>
                <label htmlFor="zMaxThreshold" className="block text-xs text-gray-500 mb-1">Max</label>
                <input
                  id="zMaxThreshold"
                  type="number"
                  value={zMaxThreshold}
                  onChange={(e) => setZMaxThreshold(e.target.value)}
                  className="input w-full"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium mb-2">Report Generation</h4>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="reportTimeInterval" className="block text-sm font-medium mb-1">
              Report Time Interval
            </label>
            <select
              id="reportTimeInterval"
              value={selectedReportTimeInterval}
              onChange={handleReportTimeIntervalChange}
              className="input w-full"
            >
              {reportTimeIntervalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateReport}
            className="btn btn-secondary h-10"
          >
            Generate Report
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Generate and download a CSV report with statistics for the selected time interval.
        </p>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium mb-2">Prediction Settings</h4>
        <div className="flex items-center mb-3">
          <input
            id="predictionEnabled"
            type="checkbox"
            checked={selectedPredictionEnabled}
            onChange={handlePredictionEnabledChange}
            className="mr-2 h-4 w-4"
          />
          <label htmlFor="predictionEnabled" className="text-sm">
            Enable data prediction
          </label>
        </div>
        
        <div className={selectedPredictionEnabled ? "" : "opacity-50 pointer-events-none"}>
          <label htmlFor="predictionMethod" className="block text-sm font-medium mb-1">
            Prediction Method
          </label>
          <select
            id="predictionMethod"
            value={selectedPredictionMethod}
            onChange={handlePredictionMethodChange}
            className="input w-full"
            disabled={!selectedPredictionEnabled}
          >
            {predictionMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Linear regression works better for trending data, while exponential smoothing is better for stable patterns.
          </p>
        </div>
      </div>

      {/* Database Management Section */}
      {onClearDatabase && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Database Management</h4>
          <div className="flex justify-between items-center">
            <button
              onClick={onClearDatabase}
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
      )}

      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary w-full"
        >
          {isSaving ? 'Applying...' : 'Apply Settings'}
        </button>
      </div>
    </div>
  );
} 