'use client';

import React from 'react';

const StatsPanel = ({ title, value, unit, icon, color = 'blue' }) => {
  // Define color classes based on the prop
  const colorClasses = {
    blue: {
      background: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'bg-blue-100 text-blue-600',
    },
    red: {
      background: 'bg-red-50',
      text: 'text-red-600',
      icon: 'bg-red-100 text-red-600',
    },
    green: {
      background: 'bg-green-50',
      text: 'text-green-600',
      icon: 'bg-green-100 text-green-600',
    },
    yellow: {
      background: 'bg-yellow-50',
      text: 'text-yellow-600',
      icon: 'bg-yellow-100 text-yellow-600',
    },
    purple: {
      background: 'bg-purple-50',
      text: 'text-purple-600',
      icon: 'bg-purple-100 text-purple-600',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  // Format the value for display
  const formattedValue = value !== null && value !== undefined 
    ? Number(value).toFixed(3)
    : 'N/A';

  return (
    <div className={`${colors.background} p-6 rounded-lg shadow-sm transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="mt-2 flex items-end">
            <span className={`text-3xl font-bold ${colors.text}`}>
              {formattedValue}
            </span>
            {unit && (
              <span className="ml-1 text-gray-500 text-sm">{unit}</span>
            )}
          </div>
        </div>
        
        {icon && (
          <div className={`p-3 rounded-full ${colors.icon}`}>
            {icon}
          </div>
        )}
      </div>
      
      {value !== null && value !== undefined && (
        <div className="mt-4 text-sm text-gray-500">
          {value > 0 ? (
            <span className="text-green-600">+{value.toFixed(2)}</span>
          ) : value < 0 ? (
            <span className="text-red-600">{value.toFixed(2)}</span>
          ) : (
            <span className="text-gray-600">0.00</span>
          )}
          <span> from reference point</span>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
