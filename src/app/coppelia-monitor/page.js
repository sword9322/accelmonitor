'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CoppeliaSimMonitor from '../components/CoppeliaSimMonitor';
import Link from 'next/link';

export default function CoppeliaMonitorPage() {
  const { user } = useAuth();
  const [isFullScreen, setIsFullScreen] = useState(false);

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
    <div className={`w-full h-full ${isFullScreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <CoppeliaSimMonitor />
      
      {/* Additional Resources - Only show when not in fullscreen */}
      {!isFullScreen && (
        <div className="container mx-auto p-4 mb-6">
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
        </div>
      )}
    </div>
  );
} 