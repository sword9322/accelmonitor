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
    if (!data || data.length === 0 || !axis) {
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

    // Extract axis values and calculate average
    const axisValues = filteredData.map(reading => reading[axis]);
    const average = axisValues.reduce((sum, val) => sum + val, 0) / axisValues.length;

    // Create the chart data configuration
    setChartData({
      labels,
      datasets: [
        {
          label: `${axis.toUpperCase()}-Axis`,
          data: axisValues,
          borderColor: color,
          backgroundColor: color.replace(')', ', 0.2)').replace('rgb', 'rgba'),
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 1,
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
        text: title,
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
        ticks: {
          maxTicksLimit: 8,
        }
      },
      y: {
        title: {
          display: true,
          text: 'Acceleration (g)',
        },
        suggestedMin: -1.5,
        suggestedMax: 1.5,
      },
    },
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
} 