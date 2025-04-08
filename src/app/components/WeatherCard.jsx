'use client';

import React, { useState, useEffect } from 'react';
import weatherService from '../services/weatherService';

// List of popular cities for the dropdown
const POPULAR_CITIES = [
  'Lisbon', 'Porto', 'London', 'Paris', 'Madrid', 'Berlin', 
  'Rome', 'Amsterdam', 'Brussels', 'Vienna', 'Prague', 'Athens'
];

export default function WeatherCard() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changingLocation, setChangingLocation] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [showCitySelector, setShowCitySelector] = useState(false);

  useEffect(() => {
    // Subscribe to weather data updates
    const unsubscribe = weatherService.subscribe((data) => {
      setWeatherData(data);
      setLoading(false);
      setError(null);
    });

    // Start polling for weather updates
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

  const handleCityChange = async (city) => {
    try {
      setChangingLocation(true);
      setError(null);
      await weatherService.changeLocation(city);
      setShowCitySelector(false);
      setNewCity('');
    } catch (err) {
      setError(`Failed to change location: ${err.message}`);
    } finally {
      setChangingLocation(false);
    }
  };

  const handleCustomCitySubmit = async (e) => {
    e.preventDefault();
    if (newCity.trim()) {
      await handleCityChange(newCity.trim());
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-red-500">{error || 'Error loading weather data'}</div>
      </div>
    );
  }

  if (!weatherData) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Weather in {weatherData.city || 'Lisbon'}
          </h2>
          <button 
            onClick={() => setShowCitySelector(!showCitySelector)}
            className="ml-2 text-blue-500 hover:text-blue-700"
            title="Change location"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
        <img 
          src={`http://openweathermap.org/img/wn/${weatherData.icon || '01d'}@2x.png`}
          alt={weatherData.description || 'Weather icon'}
          className="w-16 h-16"
        />
      </div>
      
      {showCitySelector && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Change location</h3>
          
          {/* Popular cities */}
          <div className="flex flex-wrap gap-2 mb-3">
            {POPULAR_CITIES.map(city => (
              <button
                key={city}
                onClick={() => handleCityChange(city)}
                disabled={changingLocation}
                className="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                {city}
              </button>
            ))}
          </div>
          
          {/* Custom city input */}
          <form onSubmit={handleCustomCitySubmit} className="flex">
            <input
              type="text"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="Enter city name..."
              className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              disabled={changingLocation}
            />
            <button
              type="submit"
              disabled={changingLocation || !newCity.trim()}
              className="px-3 py-2 bg-blue-500 text-white text-sm rounded-r hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              {changingLocation ? 'Updating...' : 'Update'}
            </button>
          </form>
          
          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">Temperature</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
            {weatherData.temperature?.toFixed(1)}°C
          </div>
        </div>
        
        <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">Feels Like</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-300">
            {weatherData.feelsLike?.toFixed(1)}°C
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
            {weatherData.description || "Clear Sky"}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-right">
        Last updated: {new Date(weatherData.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
} 