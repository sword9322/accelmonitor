'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, subMinutes, subHours } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export default function AxisChart({ 
  data, 
  axis, 
  color, 
  timeRange = '5m',
  title = 'Axis Data',
}) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (!data || !Array.isArray(data) || data.length === 0 || !axis) {
      // Set empty chart data
      setChartData({
        labels: [],
        datasets: []
      });
      return;
    }

    // Filter data based on timeRange
    const now = new Date();
    let filteredData = [...data].filter(item => 
      item && 
      typeof item === 'object' && 
      item !== null && 
      typeof item[axis] === 'number' && 
      item.timestamp
    );
    
    if (filteredData.length === 0) {
      // No valid data found
      setChartData({
        labels: [],
        datasets: []
      });
      return;
    }
    
    // Apply time range filtering
    if (timeRange === '5m') {
      const fiveMinutesAgo = subMinutes(now, 5);
      filteredData = filteredData.filter(reading => {
        try {
          const timestamp = reading.timestamp instanceof Date 
            ? reading.timestamp 
            : typeof reading.timestamp === 'number'
              ? new Date(reading.timestamp * 1000)
              : new Date(reading.timestamp);
          return timestamp >= fiveMinutesAgo;
        } catch (e) {
          return false;
        }
      });
    } else if (timeRange === '15m') {
      const fifteenMinutesAgo = subMinutes(now, 15);
      filteredData = filteredData.filter(reading => {
        try {
          const timestamp = reading.timestamp instanceof Date 
            ? reading.timestamp 
            : typeof reading.timestamp === 'number'
              ? new Date(reading.timestamp * 1000)
              : new Date(reading.timestamp);
          return timestamp >= fifteenMinutesAgo;
        } catch (e) {
          return false;
        }
      });
    } else if (timeRange === '1h') {
      const oneHourAgo = subHours(now, 1);
      filteredData = filteredData.filter(reading => {
        try {
          const timestamp = reading.timestamp instanceof Date 
            ? reading.timestamp 
            : typeof reading.timestamp === 'number'
              ? new Date(reading.timestamp * 1000)
              : new Date(reading.timestamp);
          return timestamp >= oneHourAgo;
        } catch (e) {
          return false;
        }
      });
    } else if (timeRange === '24h') {
      const oneDayAgo = subHours(now, 24);
      filteredData = filteredData.filter(reading => {
        try {
          const timestamp = reading.timestamp instanceof Date 
            ? reading.timestamp 
            : typeof reading.timestamp === 'number'
              ? new Date(reading.timestamp * 1000)
              : new Date(reading.timestamp);
          return timestamp >= oneDayAgo;
        } catch (e) {
          return false;
        }
      });
    }

    // Ensure we always have some data to display even if the time filter removes everything
    if (filteredData.length === 0 && data.length > 0) {
      filteredData = data
        .filter(item => 
          item && 
          typeof item === 'object' && 
          item !== null && 
          typeof item[axis] === 'number' && 
          item.timestamp
        )
        .slice(0, Math.min(20, data.length));
    }

    // Sort the data by timestamp (oldest first)
    filteredData.sort((a, b) => {
      try {
        const aTime = a.timestamp instanceof Date 
          ? a.timestamp 
          : typeof a.timestamp === 'number'
            ? new Date(a.timestamp * 1000)
            : new Date(a.timestamp);
        const bTime = b.timestamp instanceof Date 
          ? b.timestamp 
          : typeof b.timestamp === 'number'
            ? new Date(b.timestamp * 1000)
            : new Date(b.timestamp);
        return aTime - bTime;
      } catch (e) {
        return 0;
      }
    });

    // Format the time labels
    const labels = filteredData.map(reading => {
      try {
        const time = reading.timestamp instanceof Date 
          ? reading.timestamp 
          : typeof reading.timestamp === 'number'
            ? new Date(reading.timestamp * 1000)
            : new Date(reading.timestamp);
        return format(time, 'HH:mm:ss');
      } catch (e) {
        return 'Invalid time';
      }
    });

    // Extract axis values and calculate average
    const axisValues = filteredData.map(reading => {
      const value = reading[axis];
      return typeof value === 'number' ? value : 0;
    });
    
    // Calculate average safely
    const sum = axisValues.reduce((acc, val) => acc + val, 0);
    const average = axisValues.length > 0 ? sum / axisValues.length : 0;

    // Create the chart data configuration
    setChartData({
      labels,
      datasets: [
        {
          label: `${axis.toUpperCase()}-Axis`,
          data: axisValues,
          borderColor: color || '#000000',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: color || '#000000',
          pointBorderColor: 'white',
          pointBorderWidth: 1,
          fill: false,
          spanGaps: false,
        },
        {
          label: 'Average',
          data: Array(labels.length).fill(average),
          borderColor: 'rgba(150, 150, 150, 0.7)',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }
      ],
    });
  }, [data, axis, color, timeRange]);

  // Calculate dynamic Y-axis range based on actual data values
  const calculateDynamicRange = () => {
    if (!data || data.length === 0) {
      return getDefaultRange();
    }

    // Filter data based on timeRange first
    const now = new Date();
    let filteredData = [...data].filter(item => 
      item && typeof item[axis] === 'number' && item.timestamp
    );
    
    if (filteredData.length === 0) {
      return getDefaultRange();
    }
    
    // Apply time range filtering
    if (timeRange === '5m') {
      const fiveMinutesAgo = subMinutes(now, 5);
      filteredData = filteredData.filter(reading => {
        try {
          const timestamp = reading.timestamp instanceof Date 
            ? reading.timestamp 
            : new Date(reading.timestamp);
          return timestamp >= fiveMinutesAgo;
        } catch (e) {
          return false;
        }
      });
    } else if (timeRange === '15m') {
      const fifteenMinutesAgo = subMinutes(now, 15);
      filteredData = filteredData.filter(reading => {
        try {
          const timestamp = reading.timestamp instanceof Date 
            ? reading.timestamp 
            : new Date(reading.timestamp);
          return timestamp >= fifteenMinutesAgo;
        } catch (e) {
          return false;
        }
      });
    } else if (timeRange === '1h') {
      const oneHourAgo = subHours(now, 1);
      filteredData = filteredData.filter(reading => {
        try {
          const timestamp = reading.timestamp instanceof Date 
            ? reading.timestamp 
            : new Date(reading.timestamp);
          return timestamp >= oneHourAgo;
        } catch (e) {
          return false;
        }
      });
    } else if (timeRange === '24h') {
      const oneDayAgo = subHours(now, 24);
      filteredData = filteredData.filter(reading => {
        try {
          const timestamp = reading.timestamp instanceof Date 
            ? reading.timestamp 
            : new Date(reading.timestamp);
          return timestamp >= oneDayAgo;
        } catch (e) {
          return false;
        }
      });
    }

    // Ensure we have data to analyze
    if (filteredData.length === 0) {
      filteredData = data
        .filter(item => item && typeof item[axis] === 'number')
        .slice(0, Math.min(20, data.length));
      
      if (filteredData.length === 0) {
        return getDefaultRange();
      }
    }

    // Extract axis values
    const axisValues = filteredData.map(reading => {
      const value = reading[axis];
      return typeof value === 'number' ? value : 0;
    });
    
    if (axisValues.length === 0) {
      return getDefaultRange();
    }
    
    // Calculate min and max values
    let min = Math.min(...axisValues);
    let max = Math.max(...axisValues);
    
    // Check for valid numbers
    if (!isFinite(min) || !isFinite(max)) {
      return getDefaultRange();
    }
    
    // Calculate the range of values
    const valueRange = max - min;
    
    // If we have a very small range, expand it a bit to avoid flat lines
    if (!isFinite(valueRange) || valueRange < 0.2) {
      const average = (max + min) / 2;
      min = isFinite(average) ? average - 0.5 : -0.5;
      max = isFinite(average) ? average + 0.5 : 0.5;
    } else {
      // Add padding to ensure spikes are visible (20% padding)
      const padding = valueRange * 0.2;
      min = min - padding;
      max = max + padding;
    }
    
    return { min, max };
  };

  // Default ranges for each axis if needed
  const getDefaultRange = () => {
    switch (axis) {
      case 'x':
        return { min: -11, max: -8 }; 
      case 'y':
        return { min: -2, max: 4 }; 
      case 'z':
        return { min: -3, max: 4 }; 
      default:
        return { min: -2, max: 2 };
    }
  };

  // Use dynamic range calculation
  const yAxisRange = calculateDynamicRange();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disables animation for more real-time feeling
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: {
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(4);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (seconds)',
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          maxTicksLimit: 8,
          font: {
            size: 10
          }
        },
        grid: {
          display: true,
          color: 'rgba(200, 200, 200, 0.2)',
          drawBorder: true,
        }
      },
      y: {
        title: {
          display: true,
          text: `${axis.toUpperCase()}-Axis (User unit)`,
          font: {
            weight: 'bold'
          }
        },
        min: yAxisRange.min,
        max: yAxisRange.max,
        ticks: {
          font: {
            size: 10
          },
          // Auto calculate step size based on range
          stepSize: Math.max(0.1, Math.abs(yAxisRange.max - yAxisRange.min) / 10),
        },
        grid: {
          display: true,
          color: 'rgba(200, 200, 200, 0.2)',
          drawBorder: true,
        }
      },
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        radius: 2,
        hoverRadius: 5
      }
    },
    layout: {
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-64 bg-gray-900 rounded-lg p-2">
      <Line data={chartData} options={options} />
    </div>
  );
} 