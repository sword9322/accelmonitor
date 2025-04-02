'use client';

import React, { useState } from 'react';

export default function SettingsPanel({ 
  refreshInterval, 
  onRefreshIntervalChange, 
  chartType,
  onChartTypeChange,
  timeRange, 
  onTimeRangeChange,
  onClose
}) {
  const [isSaving, setIsSaving] = useState(false);
  
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

  // Handle update frequency change
  const handleUpdateFrequencyChange = (e) => {
    const newInterval = parseFloat(e.target.value);
    console.log(`Setting refresh interval to ${newInterval} seconds (${newInterval * 1000}ms)`);
    setSelectedInterval(newInterval);
  };

  // Handle chart type change
  const handleChartTypeChange = (e) => {
    const newChartType = e.target.value;
    onChartTypeChange(newChartType);
  };

  // Handle time range change
  const handleTimeRangeChange = (e) => {
    const newTimeRange = e.target.value;
    onTimeRangeChange(newTimeRange);
  };

  // Apply settings
  const handleSave = () => {
    setIsSaving(true);
    
    // Ensure the interval is properly passed as a float
    onRefreshIntervalChange(selectedInterval);
    onChartTypeChange(selectedChartType);
    onTimeRangeChange(selectedTimeRange);
    
    // Simulate saving delay
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 500);
  };
  
  // Track selected interval separately to avoid immediate changes
  const [selectedInterval, setSelectedInterval] = useState(refreshInterval);
  const [selectedChartType, setSelectedChartType] = useState(chartType);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

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