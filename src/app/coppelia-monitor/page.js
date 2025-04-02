'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CoppeliaSimMonitor from '../components/CoppeliaSimMonitor';
import Link from 'next/link';

export default function CoppeliaMonitorPage() {
  const { user } = useAuth();
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Handle fullscreen toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-xl font-semibold mb-4">Authentication Required</h1>
        <p className="mb-4">Please sign in to access the CoppeliaSim Monitoring page.</p>
        <Link href="/auth/signin" className="btn btn-primary">
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CoppeliaSim Accelerometer Monitor</h1>
        <div className="flex space-x-2">
          <button 
            onClick={toggleFullScreen}
            className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
          </button>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg shadow-md">
        <p className="text-gray-700 mb-4">
          This page provides real-time monitoring of accelerometer data from CoppeliaSim. 
          The graph below shows the most recent readings for all three axes (X, Y, Z).
        </p>
        
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            Configure the update interval and chart range using the controls below the chart.
          </span>
        </div>
      </div>
      
      {/* CoppeliaSim Monitor Component */}
      <div className={isFullScreen ? 'fixed inset-0 z-50 p-4 bg-white' : ''}>
        <CoppeliaSimMonitor />
      </div>
      
      {/* Additional Resources */}
      {!isFullScreen && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">Additional Resources</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <a 
                href="https://www.coppeliarobotics.com/helpFiles/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800"
              >
                CoppeliaSim Documentation
              </a>
            </li>
            <li>
              <a 
                href="https://www.coppeliarobotics.com/helpFiles/en/remoteApiOverview.htm" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800"
              >
                CoppeliaSim Remote API Documentation
              </a>
            </li>
            <li>
              <a 
                href="https://github.com/CoppeliaRobotics/zmqRemoteApi" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800"
              >
                CoppeliaSim ZMQ Remote API on GitHub
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
} 