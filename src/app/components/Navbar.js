'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-indigo-600 shadow-md">
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-white">
              Accelerometer Monitor
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="flex items-center ml-10 space-x-4">
              <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-500">
                Dashboard
              </Link>
              <Link href="/dashboard/reports" className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-500">
                Reports
              </Link>
              <Link href="/dashboard/settings" className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-500">
                Settings
              </Link>
            </div>
          </div>

          {/* User profile dropdown */}
          <div className="hidden md:block">
            <div className="relative ml-3">
              <div className="flex items-center">
                <button
                  type="button"
                  className="flex items-center max-w-xs text-sm text-white rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                  id="user-menu-button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-800 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                      </span>
                    </div>
                    <span className="ml-2">{user?.displayName || user?.email}</span>
                  </div>
                </button>
              </div>

              {/* Profile dropdown menu */}
              {isMenuOpen && (
                <div
                  className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <Link 
                    href="/dashboard/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link 
                    href="/dashboard/settings" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 text-white rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/dashboard" 
              className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-indigo-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard/reports" 
              className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-indigo-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Reports
            </Link>
            <Link 
              href="/dashboard/settings" 
              className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-indigo-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Settings
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-indigo-700">
            <div className="px-5 flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-800 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-white">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">{user?.displayName}</div>
                <div className="text-sm font-medium text-indigo-300">{user?.email}</div>
              </div>
            </div>
            <div className="px-2 mt-3 space-y-1">
              <Link 
                href="/dashboard/profile" 
                className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-indigo-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Your Profile
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-indigo-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-white rounded-md hover:bg-indigo-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 