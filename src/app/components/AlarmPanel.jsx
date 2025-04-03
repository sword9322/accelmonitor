'use client';

import React, { useState } from 'react';

export default function AlarmPanel({ activeAlarms, alarmHistory, onClearAlarms, alarmsEnabled, onToggleAlarms }) {
  const [showHistory, setShowHistory] = useState(false);
  
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : new Date(timestamp);
    
    return date.toLocaleTimeString();
  };
  
  const formatAlarmType = (type, axis) => {
    if (type === 'above_max') {
      return `${axis.toUpperCase()}-axis above maximum threshold`;
    } else if (type === 'below_min') {
      return `${axis.toUpperCase()}-axis below minimum threshold`;
    }
    return `${axis.toUpperCase()}-axis alarm`;
  };
  
  const getAlarmSeverityClass = (alarm) => {
    // You could enhance this with different severity levels
    if (alarm.type === 'above_max') {
      const exceedRatio = alarm.value / alarm.threshold;
      if (exceedRatio > 1.5) return 'bg-red-100 border-red-500';
      return 'bg-orange-100 border-orange-500';
    } else if (alarm.type === 'below_min') {
      const exceedRatio = alarm.threshold / alarm.value;
      if (exceedRatio > 1.5) return 'bg-red-100 border-red-500';
      return 'bg-orange-100 border-orange-500';
    }
    return 'bg-yellow-100 border-yellow-500';
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            {showHistory ? 'Show Active Alarms' : 'Show Alarm History'}
          </button>
          {activeAlarms.length > 0 && (
            <button 
              onClick={onClearAlarms}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      
      {!showHistory ? (
        <div>
          <h4 className="font-medium mb-2">Active Alarms</h4>
          {activeAlarms.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No active alarms
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activeAlarms.map((alarm) => (
                <div 
                  key={alarm.id} 
                  className={`border-l-4 p-3 rounded-md ${getAlarmSeverityClass(alarm)}`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{formatAlarmType(alarm.type, alarm.axis)}</span>
                    <span className="text-sm text-gray-600">{formatTime(alarm.timestamp)}</span>
                  </div>
                  <div className="mt-1 text-sm">
                    Value: <span className="font-medium">{typeof alarm.value === 'number' ? alarm.value.toFixed(4) : 'N/A'}</span> | 
                    Threshold: <span className="font-medium">{typeof alarm.threshold === 'number' ? alarm.threshold.toFixed(4) : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h4 className="font-medium mb-2">Alarm History</h4>
          {alarmHistory.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No alarm history
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Time</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Type</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Value</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {alarmHistory.map((alarm, index) => (
                    <tr key={alarm.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 text-sm">{formatTime(alarm.timestamp)}</td>
                      <td className="py-2 text-sm">{formatAlarmType(alarm.type, alarm.axis)}</td>
                      <td className="py-2 text-sm">{typeof alarm.value === 'number' ? alarm.value.toFixed(4) : 'N/A'}</td>
                      <td className="py-2 text-sm">{typeof alarm.threshold === 'number' ? alarm.threshold.toFixed(4) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Alarms are triggered when axis values exceed the thresholds set in Settings.</p>
      </div>
      
      {/* Alarm status indication */}
      <div className="mt-2 flex items-center">
        <div className={`inline-block w-3 h-3 rounded-full mr-2 ${alarmsEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-xs text-gray-600">
          {alarmsEnabled ? 'Alarms are enabled' : 'Alarms are disabled - no new alerts will be triggered'}
        </span>
      </div>
    </div>
  );
} 