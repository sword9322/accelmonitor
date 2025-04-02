'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { format, subMinutes, subHours, parseISO } from 'date-fns';

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

export default function AccelerometerChart({ data, chartType = 'line', timeRange = '5m' }) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (!data || data.length === 0) {
      // Set empty chart data
      setChartData({
        labels: [],
        datasets: []
      });
      return;
    }

    // Filter data based on timeRange
    const now = new Date();
    let filteredData = [...data];
    
    if (timeRange === '5m') {
      const fiveMinutesAgo = subMinutes(now, 5);
      filteredData = data.filter(reading => new Date(reading.timestamp) >= fiveMinutesAgo);
    } else if (timeRange === '15m') {
      const fifteenMinutesAgo = subMinutes(now, 15);
      filteredData = data.filter(reading => new Date(reading.timestamp) >= fifteenMinutesAgo);
    } else if (timeRange === '1h') {
      const oneHourAgo = subHours(now, 1);
      filteredData = data.filter(reading => new Date(reading.timestamp) >= oneHourAgo);
    } else if (timeRange === '24h') {
      const oneDayAgo = subHours(now, 24);
      filteredData = data.filter(reading => new Date(reading.timestamp) >= oneDayAgo);
    }

    // Ensure we always have some data to display even if the time filter removes everything
    if (filteredData.length === 0 && data.length > 0) {
      filteredData = data.slice(0, Math.min(20, data.length));
    }

    // Sort the data by timestamp (oldest first)
    filteredData.sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return aTime - bTime;
    });

    // Format the time labels
    const labels = filteredData.map(reading => {
      const time = reading.timestamp instanceof Date ? reading.timestamp : new Date(reading.timestamp);
      return format(time, 'HH:mm:ss');
    });

    // Extract x, y, z values
    const xValues = filteredData.map(reading => reading.x);
    const yValues = filteredData.map(reading => reading.y);
    const zValues = filteredData.map(reading => reading.z);

    // Create the chart data configuration
    setChartData({
      labels,
      datasets: [
        {
          label: 'X-Axis',
          data: xValues,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.2,
        },
        {
          label: 'Y-Axis',
          data: yValues,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.2,
        },
        {
          label: 'Z-Axis',
          data: zValues,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.2,
        },
      ],
    });
  }, [data, timeRange]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Accelerometer Readings',
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
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Acceleration (g)',
        },
        suggestedMin: -2,
        suggestedMax: 2,
      },
    },
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No accelerometer data available</p>
      </div>
    );
  }

  return (
    <div className="h-80">
      {chartType === 'line' ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
}
