'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  
  const isActive = (path) => {
    return pathname === path ? 'text-blue-500 font-semibold' : 'text-gray-600 hover:text-blue-500';
  };
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 border-b py-4 bg-white z-10 shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold flex items-center gap-2">
          <div className="bg-blue-500 text-white p-1 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
            </svg>
          </div>
          AccelMonitor
        </Link>
        
        {user ? (
          <nav className="flex items-center space-x-6">
            <Link href="/dashboard" className={`${isActive('/dashboard')} transition duration-150`}>
              Dashboard
            </Link>
            <Link href="/coppelia-monitor" className={`${isActive('/coppelia-monitor')} transition duration-150`}>
              Monitor
            </Link>
            {isAdmin && (
              <Link href="/admin/users" className={`${isActive('/admin/users')} transition duration-150`}>
                User Management
              </Link>
            )}
            <button 
              onClick={handleLogout} 
              className="text-gray-600 hover:text-blue-500 transition duration-150"
            >
              Logout
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-gray-600 hover:text-blue-500 transition duration-150"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-150"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
} 