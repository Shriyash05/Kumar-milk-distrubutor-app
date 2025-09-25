/**
 * ReportGenerationService (stable)
 * - Uses expo-file-system legacy API for file operations (write/read/copy)
 * - Uses expo-print for PDF generation
 * - Uses expo-sharing for sharing files
 *
 * Install:
 *   expo install expo-print expo-sharing
 *
 * Note:
 *  - expo-print returns a temporary uri for PDF. We copy it into documentDirectory so files persist.
 *  - If you see caching issues, run: npx expo start -c
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import aiAnalyticsService from './aiAnalyticsService';

class ReportGenerationService {
  constructor() {
    this.reportFormats = ['html', 'csv', 'json', 'pdf'];
    console.log('📄 Report Generation Service initialized (legacy FS + expo-print + expo-sharing)');
  }

  // -------------------------
  // Main entrypoint
  // -------------------------
  async generateReport(options = {}) {
    const {
      format = 'html',
      dateRange = 'week',
      filters = {},
      includeAISummary = true,
      template = 'standard'
    } = options;

    try {
      console.log('📄 Generating report with options:', options);

      // get report data from service
      const reportDataRaw = await aiAnalyticsService.generateSalesReport(dateRange, filters);
      
      console.log('📊 Report data received:', reportDataRaw);
      
      if (!reportDataRaw) {
        throw new Error('Failed to generate report data - no data received from analytics service');
      }

      const aiSummary = includeAISummary ? aiAnalyticsService.generateAISummary(reportDataRaw) : null;
      
      // Handle both old and new data structures for rawData access
      const rawDataForForecast = reportDataRaw.rawData || reportDataRaw.data?.rawData || [];
      const forecast = (aiAnalyticsService.generateForecast && typeof aiAnalyticsService.generateForecast === 'function')
        ? aiAnalyticsService.generateForecast(rawDataForForecast, dateRange)
        : null;

      const completeReport = {
        ...reportDataRaw,
        aiSummary,
        forecast,
        options,
        generatedAt: new Date().toISOString()
      };

      switch ((format || '').toLowerCase()) {
        case 'html': return await this.generateHTMLReport(completeReport, template);
        case 'csv': return await this.generateCSVReport(completeReport);
        case 'json': return await this.generateJSONReport(completeReport);
        case 'pdf': return await this.generatePDFReport(completeReport, template);
        default: return await this.generateHTMLReport(completeReport, template);
      }
    } catch (error) {
      console.error('Report generation error:', error);
      return { success: false, error: (error && error.message) || String(error), format };
    }
  }

  // -------------------------
  // HTML
  // -------------------------
  async generateHTMLReport(reportData, template = 'standard') {
    try {
      const htmlContent = this.generateHTMLContent(reportData);
      const fileName = `kumar_milk_report_${reportData.dateRange || 'period'}_${Date.now()}.html`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, htmlContent, { encoding: FileSystem.EncodingType.UTF8 });

      return {
        success: true,
        format: 'html',
        filePath,
        fileName,
        canShare: true,
        reportDataSummary: {
          period: reportData.period,
          totalOrders: reportData.metrics?.totalOrders || 0,
          totalRevenue: reportData.metrics?.totalRevenue || 0,
          generatedAt: reportData.generatedAt
        }
      };
    } catch (error) {
      console.error('HTML generation error:', error);
      return { success: false, error: (error && error.message) || String(error), format: 'html' };
    }
  }

  // -------------------------
  // CSV
  // -------------------------
  async generateCSVReport(reportData) {
    try {
      const csvContent = this.buildCSVContent(reportData);
      const fileName = `kumar_milk_report_${reportData.dateRange || 'period'}_${Date.now()}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

      return {
        success: true,
        format: 'csv',
        filePath,
        fileName,
        canShare: true,
        reportDataSummary: {
          period: reportData.period,
          totalOrders: reportData.metrics?.totalOrders || 0,
          totalRevenue: reportData.metrics?.totalRevenue || 0,
          generatedAt: reportData.generatedAt
        }
      };
    } catch (error) {
      console.error('CSV generation error:', error);
      return { success: false, error: (error && error.message) || String(error), format: 'csv' };
    }
  }

  // -------------------------
  // JSON
  // -------------------------
  async generateJSONReport(reportData) {
    try {
      const jsonContent = JSON.stringify(reportData, null, 2);
      const fileName = `kumar_milk_report_${reportData.dateRange || 'period'}_${Date.now()}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, jsonContent, { encoding: FileSystem.EncodingType.UTF8 });

      return {
        success: true,
        format: 'json',
        filePath,
        fileName,
        canShare: true,
        reportDataSummary: {
          period: reportData.period,
          totalOrders: reportData.metrics?.totalOrders || 0,
          totalRevenue: reportData.metrics?.totalRevenue || 0,
          generatedAt: reportData.generatedAt
        }
      };
    } catch (error) {
      console.error('JSON generation error:', error);
      return { success: false, error: (error && error.message) || String(error), format: 'json' };
    }
  }

  // -------------------------
  // PDF (expo-print)
  // -------------------------
  async generatePDFReport(reportData, template = 'standard') {
    try {
      const htmlContent = this.generateHTMLContent(reportData);

      // create PDF using expo-print -> returns { uri } usually pointing to a temp file
      const printResult = await Print.printToFileAsync({ html: htmlContent });
      const tempUri = printResult.uri || printResult.url || null;

      if (!tempUri) {
        throw new Error('expo-print did not return a PDF uri');
      }

      // copy the temp PDF to documentDirectory for persistence
      const fileName = `kumar_milk_report_${reportData.dateRange || 'period'}_${Date.now()}.pdf`;
      const destPath = `${FileSystem.documentDirectory}${fileName}`;

      try {
        await FileSystem.copyAsync({ from: tempUri, to: destPath });
      } catch (copyErr) {
        console.warn('PDF copy to documentDirectory failed, returning temp URI. copyErr:', copyErr);
        return {
          success: true,
          format: 'pdf',
          filePath: tempUri,
          fileName,
          canShare: true,
          reportDataSummary: {
            period: reportData.period,
            totalOrders: reportData.metrics?.totalOrders || 0,
            totalRevenue: reportData.metrics?.totalRevenue || 0,
            generatedAt: reportData.generatedAt
          }
        };
      }

      return {
        success: true,
        format: 'pdf',
        filePath: destPath,
        fileName,
        canShare: true,
        reportDataSummary: {
          period: reportData.period,
          totalOrders: reportData.metrics?.totalOrders || 0,
          totalRevenue: reportData.metrics?.totalRevenue || 0,
          generatedAt: reportData.generatedAt
        }
      };
    } catch (error) {
      console.error('PDF generation error:', error);
      return { success: false, error: (error && error.message) || String(error), format: 'pdf' };
    }
  }

  // -------------------------
  // Share helper (new)
  // -------------------------
  /**
   * shareReport accepts:
   *  - a filePath string (uri), OR
   *  - an object returned by generateReport (e.g., { filePath, fileName, ... })
   *
   * Returns { success: boolean, message?, error? }
   */
  async shareReport(target) {
    try {
      // resolve filePath
      let filePath = null;
      if (!target) return { success: false, error: 'No target provided to shareReport' };

      if (typeof target === 'string') {
        filePath = target;
      } else if (typeof target === 'object') {
        filePath = target.filePath || target.path || target.uri || null;
      }

      if (!filePath) return { success: false, error: 'Could not determine file path to share' };

      // Check if file exists (best-effort)
      const info = await FileSystem.getInfoAsync(filePath);
      if (!info.exists) {
        return { success: false, error: `File not found: ${filePath}` };
      }

      // expo-sharing: check availability and share
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(filePath);
        return { success: true, message: 'Shared via expo-sharing' };
      } else {
        // If expo-sharing not available, try opening with fallback (some platforms)
        return { success: false, error: 'Sharing API not available on this platform' };
      }
    } catch (error) {
      console.error('Share error:', error);
      return { success: false, error: (error && error.message) || String(error) };
    }
  }

  // -------------------------
  // HTML builder
  // -------------------------
  generateHTMLContent(reportData) {
    console.log('📝 Generating HTML content from reportData:', reportData);
    
    // Handle both old and new data structures
    const metrics = reportData.metrics || reportData.data?.metrics || {};
    const aiSummary = reportData.aiSummary || {};
    const period = reportData.period || reportData.data?.period || { label: 'Unknown Period' };
    
    console.log('📝 Extracted data for HTML:', { metrics, period });

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Kumar Milk Distributors - Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { background:#54a9f7; color:#fff; padding:16px; border-radius:8px; text-align:center; }
            .section { margin-top:18px; padding:12px; background:#f8f9fa; border-radius:6px; }
            .metric { display:inline-block; margin:10px; padding:12px; background:#fff; border-radius:6px; min-width:140px; text-align:center; }
            .metric-value { font-size:20px; font-weight:bold; color:#54a9f7; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Kumar Milk Distributors</h1>
            <h3>Sales Analytics Report</h3>
            <div>Period: ${period.label}</div>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>

          <div class="section">
            <h4>Key Metrics</h4>
            <div class="metric"><div class="metric-value">${metrics.totalOrders || 0}</div><div>Total Orders</div></div>
            <div class="metric"><div class="metric-value">₹${(metrics.totalRevenue||0).toFixed(2)}</div><div>Total Revenue</div></div>
            <div class="metric"><div class="metric-value">₹${(metrics.averageOrderValue||0).toFixed(2)}</div><div>Avg Order Value</div></div>
          </div>

          ${aiSummary?.summary ? `<div class="section"><h4>AI Summary</h4><p>${aiSummary.summary}</p></div>` : ''}

        </body>
      </html>
    `;
  }

  // -------------------------
  // CSV builder
  // -------------------------
  buildCSVContent(reportData) {
    const metrics = reportData.metrics || {};
    const period = reportData.period || { label: 'Unknown Period' };

    return [
      'Kumar Milk Distributors - Sales Report',
      `Period,${period.label}`,
      `Generated,${new Date().toLocaleString()}`,
      '',
      'Metric,Value',
      `Total Orders,${metrics.totalOrders || 0}`,
      `Total Revenue,${metrics.totalRevenue || 0}`,
      `Average Order Value,${(metrics.averageOrderValue||0).toFixed(2)}`
    ].join('\n');
  }

  // -------------------------
  // Auto-open report (new functionality)
  // -------------------------
  async openReport(reportResult) {
    try {
      if (!reportResult || !reportResult.success || !reportResult.filePath) {
        console.warn('Cannot open report: invalid result object');
        return { success: false, error: 'Invalid report result' };
      }

      const { filePath } = reportResult;
      console.log('📄 Opening report:', filePath);

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        console.error('Report file does not exist:', filePath);
        return { success: false, error: 'Report file not found' };
      }

      // Use expo-sharing to open the file with timeout
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        console.log('🔓 Opening report with system app...');
        
        // Add timeout to prevent hanging
        const openPromise = Sharing.shareAsync(filePath, {
          dialogTitle: 'Open Report',
          mimeType: this.getMimeType(reportResult.format),
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Open operation timed out')), 10000);
        });
        
        try {
          await Promise.race([openPromise, timeoutPromise]);
          console.log('✅ Report opening initiated successfully');
          return { success: true, message: 'Report opened successfully' };
        } catch (timeoutError) {
          console.warn('⚠️ Report opening timed out or was cancelled:', timeoutError.message);
          return { success: true, message: 'Report opening initiated (may have timed out)' };
        }
      } else {
        return { success: false, error: 'Cannot open reports on this platform' };
      }
    } catch (error) {
      console.error('Error opening report:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  getMimeType(format) {
    const mimeTypes = {
      'pdf': 'application/pdf',
      'html': 'text/html',
      'csv': 'text/csv',
      'json': 'application/json'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  // -------------------------
  // List saved reports
  // -------------------------
  async listSavedReports() {
    try {
      const dirEntries = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory); // array of filenames
      const reportFiles = [];

      for (const name of dirEntries) {
        if (!name || !name.startsWith('kumar_milk_report_')) continue;
        const uri = `${FileSystem.documentDirectory}${name}`;
        try {
          const info = await FileSystem.getInfoAsync(uri);
          reportFiles.push({
            fileName: name,
            filePath: uri,
            size: info.size || 0,
            modificationTime: info.modificationTime ? new Date(info.modificationTime).toISOString() : null
          });
        } catch (infoErr) {
          reportFiles.push({ fileName: name, filePath: uri });
        }
      }

      return reportFiles;
    } catch (error) {
      console.error('List saved reports error:', error);
      return [];
    }
  }
}

export default new ReportGenerationService();
