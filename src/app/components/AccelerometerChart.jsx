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
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format, subMinutes, subHours } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export default function AccelerometerChart({ 
  data, 
  predictedData = [],
  chartType = 'line',
  timeRange = '5m',
}) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
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
      (typeof item.x === 'number' || typeof item.y === 'number' || typeof item.z === 'number') && 
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
          (typeof item.x === 'number' || typeof item.y === 'number' || typeof item.z === 'number') && 
          item.timestamp
        )
        .slice(0, Math.min(20, data.length));
    }

    // Filter and add predicted data if available
    let combinedData = [...filteredData];
    
    if (predictedData && predictedData.length > 0) {
      const filteredPredictions = predictedData.filter(item => 
        item && 
        typeof item === 'object' && 
        item !== null && 
        (typeof item.x === 'number' || typeof item.y === 'number' || typeof item.z === 'number') && 
        item.timestamp
      );
      
      combinedData = [...filteredData, ...filteredPredictions];
    }

    // Sort the data by timestamp (oldest first)
    combinedData.sort((a, b) => {
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
    const labels = combinedData.map(reading => {
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

    // Extract axis values
    const xValues = combinedData.map(reading => {
      const isPredicted = predictedData.some(p => p.id === reading.id);
      const value = reading.x;
      return { 
        value: typeof value === 'number' ? value : 0,
        isPredicted 
      };
    });
    
    const yValues = combinedData.map(reading => {
      const isPredicted = predictedData.some(p => p.id === reading.id);
      const value = reading.y;
      return { 
        value: typeof value === 'number' ? value : 0,
        isPredicted 
      };
    });
    
    const zValues = combinedData.map(reading => {
      const isPredicted = predictedData.some(p => p.id === reading.id);
      const value = reading.z;
      return { 
        value: typeof value === 'number' ? value : 0,
        isPredicted 
      };
    });

    // Create datasets
    const datasets = [
      {
        label: 'X-Axis',
        data: xValues.map(item => item.value),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: chartType === 'bar' ? 'rgba(255, 99, 132, 0.5)' : 'transparent',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: xValues.map(item => item.isPredicted ? 'rgba(0, 0, 255, 0.5)' : 'rgb(255, 99, 132)'),
        pointBorderColor: 'white',
        pointBorderWidth: 1,
        segment: {
          borderDash: (ctx) => {
            const index = ctx.p0DataIndex;
            return xValues[index] && xValues[index].isPredicted ? [5, 5] : undefined;
          },
        },
      },
      {
        label: 'Y-Axis',
        data: yValues.map(item => item.value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: chartType === 'bar' ? 'rgba(75, 192, 192, 0.5)' : 'transparent',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: yValues.map(item => item.isPredicted ? 'rgba(0, 0, 255, 0.5)' : 'rgb(75, 192, 192)'),
        pointBorderColor: 'white',
        pointBorderWidth: 1,
        segment: {
          borderDash: (ctx) => {
            const index = ctx.p0DataIndex;
            return yValues[index] && yValues[index].isPredicted ? [5, 5] : undefined;
          },
        },
      },
      {
        label: 'Z-Axis',
        data: zValues.map(item => item.value),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: chartType === 'bar' ? 'rgba(53, 162, 235, 0.5)' : 'transparent',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: zValues.map(item => item.isPredicted ? 'rgba(0, 0, 255, 0.5)' : 'rgb(53, 162, 235)'),
        pointBorderColor: 'white',
        pointBorderWidth: 1,
        segment: {
          borderDash: (ctx) => {
            const index = ctx.p0DataIndex;
            return zValues[index] && zValues[index].isPredicted ? [5, 5] : undefined;
          },
        },
      }
    ];

    // Create the chart data configuration
    setChartData({
      labels,
      datasets
    });
  }, [data, predictedData, chartType, timeRange]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10
        }
      },
      y: {
        title: {
          display: true,
          text: 'Acceleration (g)',
        },
        suggestedMin: -5,
        suggestedMax: 5,
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toFixed(4);
            return label;
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 0 // Disable animation for better performance
    }
  };

  // Render appropriate chart based on chartType
  return (
    <div style={{ height: '400px', position: 'relative' }}>
      {chartData.datasets.length > 0 ? (
        chartType === 'line' ? (
          <Line data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )
      ) : (
        <div className="flex justify-center items-center h-full bg-gray-100">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
}
