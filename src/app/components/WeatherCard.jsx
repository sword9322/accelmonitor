'use client';

import React, { useState, useEffect } from 'react';
import weatherService from '../services/weatherService';

export default function WeatherCard() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to weather data updates
    const unsubscribe = weatherService.subscribe((data) => {
      setWeatherData(data);
      setLoading(false);
      setError(null);
    });

    // Start polling for weather data
    weatherService.startPolling();

    // Set up Firebase listener
    weatherService.setupWeatherListener();

    // Cleanup
    return () => {
      unsubscribe();
      weatherService.stopPolling();
      weatherService.removeRealtimeListeners();
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-red-500">Error loading weather data</div>
      </div>
    );
  }

  if (!weatherData) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Weather in Lisbon</h2>
        <img 
          src={`http://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
          alt={weatherData.description}
          className="w-16 h-16"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">Temperature</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
            {weatherData.temperature.toFixed(1)}°C
          </div>
        </div>
        
        <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">Feels Like</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-300">
            {weatherData.feelsLike.toFixed(1)}°C
          </div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">Humidity</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
            {weatherData.humidity}%
          </div>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">Conditions</div>
          <div className="text-lg font-medium text-yellow-600 dark:text-yellow-300 capitalize">
            {weatherData.description}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-right">
        Last updated: {new Date(weatherData.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
} 