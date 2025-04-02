/**
 * Report Service
 * 
 * Handles report generation for accelerometer data with statistics
 * and provides a download mechanism.
 */

import accelerometerService from './accelerometerService';

const reportService = {
  /**
   * Generate report data for a specified time interval
   * 
   * @param {string} timeInterval - Time interval ('10m', '30m', '60m', etc.)
   * @param {Array} data - Accelerometer data
   * @returns {Object} - Report data with statistics
   */
  generateReportData: (timeInterval, data) => {
    if (!data || data.length === 0) {
      return {
        timeInterval,
        timestamp: new Date().toISOString(),
        stats: null,
        sampleCount: 0
      };
    }

    // Filter data based on time interval
    const filteredData = reportService.filterDataByTimeInterval(data, timeInterval);
    
    // Calculate statistics for the filtered data
    const stats = accelerometerService.calculateStatistics(filteredData);

    return {
      timeInterval,
      timestamp: new Date().toISOString(),
      stats,
      sampleCount: filteredData.length,
      rawData: filteredData
    };
  },

  /**
   * Filter data by time interval
   * 
   * @param {Array} data - Full dataset
   * @param {string} timeInterval - Time interval (e.g., '10m', '30m', '60m')
   * @returns {Array} - Filtered data
   */
  filterDataByTimeInterval: (data, timeInterval) => {
    if (!data || data.length === 0) return [];

    const now = Date.now();
    let timeThreshold;

    // Parse the time interval
    const match = timeInterval.match(/^(\d+)([mh])$/);
    if (!match) return data; // Return all data if format is invalid

    const [, value, unit] = match;
    const numValue = parseInt(value, 10);

    // Calculate threshold based on unit (minutes or hours)
    if (unit === 'm') {
      timeThreshold = now - (numValue * 60 * 1000);
    } else if (unit === 'h') {
      timeThreshold = now - (numValue * 60 * 60 * 1000);
    } else {
      timeThreshold = now - (30 * 60 * 1000); // Default: 30 minutes
    }

    // Filter data to only include entries newer than the threshold
    return data.filter(entry => {
      const entryTimestamp = entry.timestamp instanceof Date 
        ? entry.timestamp.getTime() 
        : new Date(entry.timestamp * 1000).getTime();
      
      return entryTimestamp >= timeThreshold;
    });
  },

  /**
   * Generate and download a CSV report
   * 
   * @param {Object} reportData - Report data object
   * @returns {string} - CSV content as string
   */
  generateCSVReport: (reportData) => {
    if (!reportData || !reportData.stats) {
      return 'No data available for report';
    }

    // Build CSV header
    let csvContent = 'AccelMonitor Report\n';
    csvContent += `Generated: ${new Date().toLocaleString()}\n`;
    csvContent += `Time Interval: ${reportData.timeInterval}\n`;
    csvContent += `Sample Count: ${reportData.sampleCount}\n\n`;

    // Add statistics
    csvContent += 'STATISTICS\n';
    csvContent += 'Axis,Min,Max,Average,StdDev\n';
    csvContent += `X,${reportData.stats.x.min},${reportData.stats.x.max},${reportData.stats.x.avg},${reportData.stats.x.stdDev}\n`;
    csvContent += `Y,${reportData.stats.y.min},${reportData.stats.y.max},${reportData.stats.y.avg},${reportData.stats.y.stdDev}\n`;
    csvContent += `Z,${reportData.stats.z.min},${reportData.stats.z.max},${reportData.stats.z.avg},${reportData.stats.z.stdDev}\n\n`;

    // Add raw data if available
    if (reportData.rawData && reportData.rawData.length > 0) {
      csvContent += 'RAW DATA\n';
      csvContent += 'Timestamp,X,Y,Z\n';
      
      reportData.rawData.forEach(entry => {
        const timestamp = entry.timestamp instanceof Date 
          ? entry.timestamp.toISOString() 
          : new Date(entry.timestamp * 1000).toISOString();
        
        csvContent += `${timestamp},${entry.x},${entry.y},${entry.z}\n`;
      });
    }

    return csvContent;
  },

  /**
   * Trigger download of report as a CSV file
   * 
   * @param {string} csvContent - CSV content as string
   * @param {string} filename - Filename for download
   */
  downloadCSV: (csvContent, filename = 'accel-monitor-report.csv') => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default reportService; 