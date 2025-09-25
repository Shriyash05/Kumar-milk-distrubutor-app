/**
 * AI-Powered Sales Analysis Service
 * Provides intelligent sales insights, trend analysis, and natural language summaries
 */

import * as SecureStore from 'expo-secure-store';
import api from './api';

class AIAnalyticsService {
  constructor() {
    this.salesData = [];
    this.customers = [];
    this.products = [];
    
    // AI Model configurations
    this.models = {
      trendAnalysis: {
        minDataPoints: 7,
        significanceThreshold: 0.1, // 10% change considered significant
        anomalyThreshold: 2.0 // Standard deviations for anomaly detection
      },
      nlg: {
        templates: this.initializeNLGTemplates(),
        insights: this.initializeInsightTemplates()
      }
    };

    this.initialize();
  }

  async initialize() {
    try {
      await this.loadSalesData();
      console.log('🤖 AI Analytics Service initialized');
    } catch (error) {
      console.error('AI Analytics initialization error:', error);
    }
  }

  // ========================
  // Data Loading & Preparation
  // ========================

  async loadSalesData() {
    try {
      console.log('🌐 Loading sales data from database via API...');
      
      // Get dashboard insights which includes order data
      const response = await api.getDashboardInsights();
      
      if (response && response.success) {
        console.log('✅ Loaded analytics data from database API');
        
        // Extract raw orders data from the insights response
        const rawData = response.insights?.rawData || [];
        this.salesData = rawData;
        
        console.log(`🤖 Loaded ${this.salesData.length} orders for AI analysis (database)`);
        return response.insights;
      } else {
        console.log('⚠️ Failed to load data from API, no data available');
        this.salesData = [];
        this.customers = [];
        this.products = [];
      }
    } catch (error) {
      console.error('Error loading sales data from database:', error);
      // Initialize empty arrays if API fails
      this.salesData = [];
      this.customers = [];
      this.products = [];
    }
  }

  // ========================
  // Sales Report Generation
  // ========================

  async generateSalesReport(dateRange = 'week', customFilters = {}) {
    try {
      console.log(`📊 Starting sales report generation for ${dateRange} from database`);
      
      // Use API to get analytics report from database
      const response = await api.getAnalyticsReport(dateRange, customFilters);
      
      if (response && response.success) {
        console.log('✅ Generated sales report from database API');
        return response.data || response.reportData;
      } else {
        console.log('⚠️ Failed to generate report from API, using fallback');
        
        // If API fails, try to use cached data if available
        if (this.salesData && this.salesData.length > 0) {
          console.log('💾 Using cached data for report generation...');
          
          const filteredData = this.filterDataByDateRange(dateRange, customFilters);
          const metrics = this.calculateSalesMetrics(filteredData);
          const trends = this.analyzeTrends(filteredData, dateRange);
          const topProducts = this.getTopProducts(filteredData);
          const customerAnalysis = this.analyzeCustomerBehavior(filteredData);
          
          return {
            reportId: `report_${Date.now()}`,
            dateRange: dateRange,
            period: this.getDateRangePeriod(dateRange),
            generatedAt: new Date().toISOString(),
            metrics,
            trends,
            topProducts,
            customerAnalysis,
            dailySales: this.groupByDay(filteredData),
            rawData: filteredData
          };
        }
        
        // Return empty report if no data available
        return this.createEmptyReport(dateRange);
      }
    } catch (error) {
      console.error('Error generating sales report from database:', error);
      return this.createEmptyReport(dateRange, error.message);
    }
  }
  
  createEmptyReport(dateRange, errorMessage = null) {
    return {
      reportId: `report_${Date.now()}`,
      dateRange: dateRange,
      period: this.getDateRangePeriod(dateRange),
      generatedAt: new Date().toISOString(),
      metrics: { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
      trends: {},
      topProducts: { topPerformers: [], worstPerformers: [] },
      customerAnalysis: { totalCustomers: 0, repeatCustomers: 0, topCustomers: [] },
      dailySales: {},
      rawData: [],
      error: errorMessage
    };
  }

  filterDataByDateRange(dateRange, customFilters = {}) {
    const now = new Date();
    let startDate, endDate = now;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        startDate = customFilters.startDate ? new Date(customFilters.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = customFilters.endDate ? new Date(customFilters.endDate) : now;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return this.salesData.filter(order => {
      const orderDate = new Date(order.timestamp || order.orderDate || order.createdAt);
      const inDateRange = orderDate >= startDate && orderDate <= endDate;
      
      // Apply custom filters
      if (customFilters.productId && !this.orderContainsProduct(order, customFilters.productId)) {
        return false;
      }
      
      if (customFilters.customerId && order.customerId !== customFilters.customerId) {
        return false;
      }
      
      if (customFilters.status && order.status !== customFilters.status) {
        return false;
      }
      
      if (customFilters.minAmount && parseFloat(order.totalAmount || 0) < customFilters.minAmount) {
        return false;
      }

      return inDateRange;
    });
  }

  orderContainsProduct(order, productId) {
    if (order.items && Array.isArray(order.items)) {
      return order.items.some(item => item.productId === productId || item.product?._id === productId);
    }
    return order.productId === productId;
  }

  calculateSalesMetrics(data) {
    const totalOrders = data.length;
    const totalRevenue = data.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const statusCounts = data.reduce((counts, order) => {
      const status = order.status || 'pending';
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});

    const dailySales = this.groupByDay(data);
    const peakDay = this.findPeakDay(dailySales);
    
    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusBreakdown: statusCounts,
      dailySales,
      peakDay,
      conversionRate: this.calculateConversionRate(data),
      growthRate: this.calculateGrowthRate(data)
    };
  }

  // ========================
  // Trend Analysis
  // ========================

  analyzeTrends(data, period) {
    const trends = {
      salesTrend: this.calculateSalesTrend(data),
      productTrends: this.analyzeProductTrends(data),
      temporalTrends: this.analyzeTemporalTrends(data),
      customerTrends: this.analyzeCustomerTrends(data)
    };

    return trends;
  }

  calculateSalesTrend(data) {
    const dailySales = this.groupByDay(data);
    const days = Object.keys(dailySales).sort();
    
    if (days.length < 2) {
      return { trend: 'insufficient_data', change: 0, description: 'Need more data for trend analysis' };
    }

    const revenues = (days || []).map(day => dailySales[day]?.revenue || 0);
    const slope = this.calculateLinearRegression(revenues).slope;
    
    let trend, description;
    if (slope > 0.1) {
      trend = 'increasing';
      description = `Sales are trending upward with an average daily increase of ₹${slope.toFixed(2)}`;
    } else if (slope < -0.1) {
      trend = 'decreasing';
      description = `Sales are trending downward with an average daily decrease of ₹${Math.abs(slope).toFixed(2)}`;
    } else {
      trend = 'stable';
      description = 'Sales are relatively stable with minimal day-to-day variation';
    }

    return {
      trend,
      change: slope,
      description,
      confidence: this.calculateTrendConfidence(revenues)
    };
  }

  analyzeProductTrends(data) {
    const productSales = {};
    
    data.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const productId = item.productId || item.product?._id;
          const productName = item.productName || item.product?.name;
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = { 
                name: productName, 
                quantity: 0, 
                revenue: 0,
                orders: 0 
              };
            }
            productSales[productId].quantity += item.quantity || 0;
            productSales[productId].revenue += item.totalPrice || 0;
            productSales[productId].orders += 1;
          }
        });
      }
    });

    // Sort by revenue
    const sortedProducts = Object.entries(productSales || {})
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

    return {
      topPerformers: sortedProducts.slice(0, 5),
      totalUniqueProducts: sortedProducts.length,
      concentrationRatio: this.calculateProductConcentration(sortedProducts)
    };
  }

  // ========================
  // Anomaly Detection
  // ========================

  detectAnomalies(data) {
    const anomalies = [];
    
    // Sales volume anomalies
    const salesAnomalies = this.detectSalesAnomalies(data);
    anomalies.push(...salesAnomalies);
    
    // Product anomalies
    const productAnomalies = this.detectProductAnomalies(data);
    anomalies.push(...productAnomalies);
    
    // Customer behavior anomalies
    const customerAnomalies = this.detectCustomerAnomalies(data);
    anomalies.push(...customerAnomalies);

    return anomalies;
  }

  detectSalesAnomalies(data) {
    const dailySales = this.groupByDay(data);
    const revenues = Object.values(dailySales || {}).map(day => day?.revenue || 0);
    
    if (revenues.length < 3) return [];
    
    const mean = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;
    const stdDev = this.calculateStandardDeviation(revenues);
    
    const anomalies = [];
    Object.entries(dailySales).forEach(([date, dayData]) => {
      const zScore = Math.abs((dayData.revenue - mean) / stdDev);
      if (zScore > this.models.trendAnalysis.anomalyThreshold) {
        anomalies.push({
          type: 'sales_anomaly',
          severity: zScore > 3 ? 'high' : 'medium',
          date: date,
          value: dayData.revenue,
          expected: mean,
          description: dayData.revenue > mean 
            ? `Unusually high sales on ${date}: ₹${dayData.revenue.toFixed(2)} (${((dayData.revenue - mean) / mean * 100).toFixed(1)}% above average)`
            : `Unusually low sales on ${date}: ₹${dayData.revenue.toFixed(2)} (${((mean - dayData.revenue) / mean * 100).toFixed(1)}% below average)`
        });
      }
    });
    
    return anomalies;
  }

  detectProductAnomalies(data) {
    const anomalies = [];
    const productPerformance = this.analyzeProductTrends(data);
    
    // Detect sudden stockouts or demand spikes
    productPerformance.topPerformers.forEach(product => {
      if (product.orders > 50 && product.quantity / product.orders < 1.5) {
        anomalies.push({
          type: 'high_demand',
          severity: 'medium',
          productId: product.id,
          productName: product.name,
          description: `High demand detected for ${product.name}: ${product.orders} orders with low average quantity per order`
        });
      }
    });
    
    return anomalies;
  }

  detectCustomerAnomalies(data) {
    const anomalies = [];
    const customerFreq = {};
    
    data.forEach(order => {
      const customerId = order.customerId || order.customerName;
      if (customerId) {
        customerFreq[customerId] = (customerFreq[customerId] || 0) + 1;
      }
    });
    
    const frequencies = Object.values(customerFreq);
    if (frequencies.length === 0) return anomalies;
    
    const maxFreq = Math.max(...frequencies);
    if (maxFreq > 10) {
      const highVolumeCustomers = Object.entries(customerFreq || {})
        .filter(([_, freq]) => freq > 8)
        .map(([customerId, freq]) => ({ customerId, orders: freq }));
        
      if (highVolumeCustomers.length > 0) {
        anomalies.push({
          type: 'high_volume_customer',
          severity: 'low',
          customers: highVolumeCustomers,
          description: `${highVolumeCustomers.length} customer(s) placed more than 8 orders in this period`
        });
      }
    }
    
    return anomalies;
  }

  // ========================
  // AI Natural Language Generation
  // ========================

  generateAISummary(reportData) {
    const summary = this.buildNaturalLanguageSummary(reportData);
    const insights = this.generateInsights(reportData);
    const recommendations = this.generateRecommendations(reportData);
    
    return {
      summary,
      insights,
      recommendations,
      generatedAt: new Date().toISOString(),
      confidence: this.calculateSummaryConfidence(reportData)
    };
  }

  buildNaturalLanguageSummary(reportData) {
    // Add null safety checks and handle both old and new API response formats
    console.log('📝 Building summary from reportData:', reportData);
    
    const metrics = reportData?.metrics || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 };
    const trends = reportData?.trends || {};
    const anomalies = reportData?.anomalies || [];
    const topProducts = reportData?.topProducts || (Array.isArray(reportData?.topProducts) ? reportData.topProducts : []);
    const templates = this.models?.nlg?.templates || {};
    
    // Convert topProducts array to expected format if needed
    const topPerformers = Array.isArray(topProducts) ? topProducts : (topProducts?.topPerformers || []);
    
    let summary = [];
    
    // Overview
    if (!metrics || metrics.totalOrders === 0) {
      return "No orders were recorded in this period. Consider reviewing your marketing strategy or checking for technical issues.";
    }
    
    // Check if templates exist
    if (templates.overview) {
      summary.push(templates.overview
        .replace('{period}', this.getPeriodText(reportData.dateRange) || 'this period')
        .replace('{totalOrders}', metrics.totalOrders || 0)
        .replace('{totalRevenue}', this.formatCurrency(metrics.totalRevenue || 0))
        .replace('{avgOrderValue}', this.formatCurrency(metrics.averageOrderValue || 0))
      );
    } else {
      summary.push(`During ${this.getPeriodText(reportData.dateRange) || 'this period'}, you had ${metrics.totalOrders || 0} orders with total revenue of ${this.formatCurrency(metrics.totalRevenue || 0)}.`);
    }
    
    // Growth
    if (metrics.growthRate !== null && metrics.growthRate !== undefined) {
      const growthText = metrics.growthRate > 0 
        ? `up ${(metrics.growthRate * 100).toFixed(1)}%`
        : `down ${Math.abs(metrics.growthRate * 100).toFixed(1)}%`;
      summary.push(`Sales are ${growthText} compared to the previous period.`);
    }
    
    // Top products
    if (topPerformers && topPerformers.length > 0) {
      const topProduct = topPerformers[0];
      if (topProduct && topProduct.name) {
        summary.push(`${topProduct.name} was your best-selling product with ${topProduct.quantity || 0} units sold and ${this.formatCurrency(topProduct.revenue || 0)} in revenue.`);
      }
    }
    
    // Trends
    if (trends?.salesTrend && trends.salesTrend.description) {
      summary.push(trends.salesTrend.description);
    }
    
    // Peak day
    if (metrics?.peakDay && metrics.peakDay.day) {
      summary.push(`${metrics.peakDay.day} was your busiest day with ${metrics.peakDay.orders || 0} orders and ${this.formatCurrency(metrics.peakDay.revenue || 0)} in sales.`);
    }
    
    // Anomalies
    if (anomalies && Array.isArray(anomalies) && anomalies.length > 0) {
      const highPriorityAnomalies = anomalies.filter(a => a && a.severity === 'high');
      if (highPriorityAnomalies.length > 0) {
        summary.push(`⚠️ Attention needed: ${highPriorityAnomalies[0].description || 'Anomaly detected'}`);
      }
    }
    
    return summary.length > 0 ? summary.join(' ') : 'No insights available for this period.';
  }

  generateInsights(reportData) {
    const insights = [];
    
    // Add null safety checks
    const metrics = reportData?.metrics || {};
    const trends = reportData?.trends || {};
    const anomalies = reportData?.anomalies || [];
    const topProducts = reportData?.topProducts || (Array.isArray(reportData?.topProducts) ? reportData.topProducts : []);
    const customerInsights = reportData?.customerInsights || reportData?.customerAnalysis || {};
    
    // Convert topProducts array to expected format if needed
    const topPerformers = Array.isArray(topProducts) ? topProducts : (topProducts?.topPerformers || []);
    
    // Revenue insights
    if (metrics.averageOrderValue && metrics.averageOrderValue > 100) {
      insights.push({
        type: 'positive',
        category: 'revenue',
        text: `Strong average order value of ${this.formatCurrency(metrics.averageOrderValue)} indicates good customer spending patterns.`
      });
    }
    
    // Product insights
    if (topPerformers && topPerformers.length > 0) {
      const topProduct = topPerformers[0];
      insights.push({
        type: 'positive',
        category: 'products',
        text: `${topProduct?.name || 'Your top product'} is performing well with ${this.formatCurrency(topProduct?.revenue || 0)} in revenue.`
      });
    }
    
    // Customer insights
    if (customerInsights && customerInsights.repeatCustomerRate && customerInsights.repeatCustomerRate > 0.6) {
      insights.push({
        type: 'positive',
        category: 'customers',
        text: `Excellent customer retention with ${(customerInsights.repeatCustomerRate * 100).toFixed(1)}% of customers making repeat purchases.`
      });
    }
    
    // Trend insights
    if (trends?.salesTrend && trends.salesTrend.trend === 'increasing' && trends.salesTrend.confidence > 0.7) {
      insights.push({
        type: 'positive',
        category: 'trends',
        text: 'Strong upward sales trend detected. This momentum suggests effective business strategies.'
      });
    }
    
    // Add a fallback insight if no insights were generated
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        category: 'general',
        text: 'Continue monitoring your sales data to generate more specific insights.'
      });
    }
    
    return insights;
  }

  generateRecommendations(reportData) {
    const recommendations = [];
    
    // Add null safety checks
    const metrics = reportData?.metrics || {};
    const trends = reportData?.trends || {};
    const anomalies = reportData?.anomalies || [];
    const topProducts = reportData?.topProducts || (Array.isArray(reportData?.topProducts) ? reportData.topProducts : []);
    
    // Convert topProducts array to expected format if needed
    const topPerformers = Array.isArray(topProducts) ? topProducts : (topProducts?.topPerformers || []);
    
    // Inventory recommendations
    if (topProducts?.topPerformers && Array.isArray(topProducts.topPerformers) && topProducts.topPerformers.length > 0) {
      const topProduct = topProducts.topPerformers[0];
      if (topProduct && topProduct.name) {
        recommendations.push({
          priority: 'high',
          category: 'inventory',
          action: `Ensure adequate stock of ${topProduct.name}`,
          reason: 'This is your top-selling product and stockouts could significantly impact revenue.',
          expectedImpact: 'Prevent revenue loss from stockouts'
        });
      }
    }
    
    // Marketing recommendations
    if (metrics?.peakDay && metrics?.dailySales) {
      const lowDays = Object.entries(metrics.dailySales || {})
        .filter(([_, data]) => data && data.orders && data.orders < (metrics.peakDay?.orders || 0) * 0.5)
        .map(([day, _]) => day);
        
      if (lowDays.length > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'marketing',
          action: 'Run targeted promotions on low-sales days',
          reason: `Sales on ${lowDays.join(', ')} are significantly lower than peak days.`,
          expectedImpact: 'Increase overall weekly sales by 10-15%'
        });
      }
    }
    
    // Operational recommendations
    if (anomalies && Array.isArray(anomalies) && anomalies.some(a => a && a.type === 'sales_anomaly' && a.severity === 'high')) {
      recommendations.push({
        priority: 'high',
        category: 'operations',
        action: 'Investigate sales anomalies',
        reason: 'Unusual sales patterns detected that may indicate operational issues or opportunities.',
        expectedImpact: 'Stabilize sales performance and identify growth opportunities'
      });
    }
    
    // Add a fallback recommendation if no recommendations were generated
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'low',
        category: 'general',
        action: 'Continue monitoring business metrics',
        reason: 'Regular monitoring helps identify opportunities for improvement.',
        expectedImpact: 'Better decision making and business optimization'
      });
    }
    
    return recommendations;
  }

  // ========================
  // Forecasting
  // ========================

  generateForecast(historicalData, period = 'week') {
    const forecast = {
      period,
      predictions: {},
      confidence: 0,
      methodology: 'linear_regression_with_seasonal_adjustment'
    };
    
    // Sales forecast
    forecast.predictions.sales = this.forecastSales(historicalData, period);
    
    // Product demand forecast
    forecast.predictions.products = this.forecastProductDemand(historicalData, period);
    
    // Overall confidence
    forecast.confidence = this.calculateForecastConfidence(historicalData);
    
    return forecast;
  }

  forecastSales(data, period) {
    const dailySales = this.groupByDay(data);
    const days = Object.keys(dailySales).sort();
    
    if (days.length < 7) {
      return {
        value: 0,
        confidence: 'low',
        note: 'Insufficient historical data for accurate forecasting'
      };
    }
    
    const revenues = (days || []).map(day => dailySales[day]?.revenue || 0);
    const trend = this.calculateLinearRegression(revenues);
    const seasonal = this.calculateSeasonality(dailySales);
    
    const forecastDays = period === 'week' ? 7 : period === 'month' ? 30 : 1;
    const baseForecast = trend.slope * (revenues.length + forecastDays) + trend.intercept;
    const seasonalAdjustment = seasonal.avgMultiplier || 1;
    
    const forecastValue = baseForecast * seasonalAdjustment;
    
    return {
      value: Math.max(0, forecastValue),
      range: {
        low: forecastValue * 0.8,
        high: forecastValue * 1.2
      },
      confidence: trend.rSquared > 0.5 ? 'high' : trend.rSquared > 0.3 ? 'medium' : 'low',
      factors: {
        trend: trend.slope > 0 ? 'positive' : 'negative',
        seasonal: seasonal.strength || 'none'
      }
    };
  }

  // ========================
  // Predefined Query Options & Suggestions
  // ========================

  getPredefinedQueries() {
    return {
      categories: [
        {
          title: '📊 Sales Analytics',
          icon: '💰',
          color: '#4CAF50',
          queries: [
            'What were my sales this week?',
            'Show me today\'s sales summary',
            'How much revenue did I make this month?',
            'Compare this week\'s sales to last week',
            'What\'s my average order value?',
            'Show me sales trends for the past month'
          ]
        },
        {
          title: '🥛 Product Insights',
          icon: '📈',
          color: '#2196F3',
          queries: [
            'Which are my top selling products?',
            'Show me product performance this month',
            'Which products need more inventory?',
            'What\'s my best performing milk type?',
            'Show me product sales breakdown',
            'Which products have the highest profit margin?'
          ]
        },
        {
          title: '👥 Customer Analytics',
          icon: '🏆',
          color: '#FF9800',
          queries: [
            'Who are my top customers?',
            'Show me customer retention rate',
            'How many new customers this month?',
            'Which customers order most frequently?',
            'Show me customer spending patterns',
            'What\'s my customer lifetime value?'
          ]
        },
        {
          title: '📋 Order Analytics',
          icon: '📦',
          color: '#9C27B0',
          queries: [
            'How many orders today?',
            'Show me pending orders',
            'What\'s my order fulfillment rate?',
            'Show me delivery performance',
            'Which days have the most orders?',
            'How many cancelled orders this week?'
          ]
        },
        {
          title: '🔮 Forecasting',
          icon: '⭐',
          color: '#607D8B',
          queries: [
            'Predict next week\'s sales',
            'Forecast product demand',
            'What will be my revenue next month?',
            'Show me seasonal trends',
            'Predict customer growth',
            'Forecast inventory needs'
          ]
        }
      ],
      quickActions: [
        { text: 'Sales Today', query: 'Show me today\'s sales summary', icon: '📊', color: '#4CAF50' },
        { text: 'Top Products', query: 'Which are my top selling products this week?', icon: '🏆', color: '#2196F3' },
        { text: 'Best Customers', query: 'Who are my top customers this month?', icon: '👥', color: '#FF9800' },
        { text: 'Orders Status', query: 'How many pending orders do I have?', icon: '📋', color: '#9C27B0' },
        { text: 'Weekly Summary', query: 'Give me a complete summary of this week\'s business', icon: '📈', color: '#673AB7' },
        { text: 'Revenue Forecast', query: 'Predict my revenue for next week', icon: '🔮', color: '#607D8B' }
      ],
      suggestions: [
        'What were my sales yesterday?',
        'Show me the best selling product',
        'How many orders are pending?',
        'Who is my top customer?',
        'What\'s my profit this month?',
        'Show me delivery statistics'
      ]
    };
  }

  getRandomSuggestions(count = 3) {
    const queries = this.getPredefinedQueries();
    const allQueries = queries.categories.flatMap(cat => cat.queries);
    const shuffled = allQueries.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // ========================
  // Conversational AI Queries
  // ========================

  async processNaturalLanguageQuery(query) {
    console.log('🔍 Processing AI query via database API:', query);
    
    // Validate input first
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        type: 'error',
        text: 'Please provide a valid question to ask the AI assistant.',
        error: 'Invalid query input'
      };
    }
    
    try {
      // First try to process the query via the server's database API
      console.log('🌐 Attempting to process query via server API...');
      const response = await api.processAIQuery(query.trim());
      
      if (response && response.success) {
        console.log('✅ AI query processed successfully via database API');
        console.log('📊 Response from API:', JSON.stringify(response, null, 2));
        return {
          type: 'answer',
          text: response.answer || response.result || 'I processed your query but couldn\'t generate a response.',
          data: response.data || response.responseData || {},
          intent: response.intent,
          confidence: response.confidence
        };
      } else {
        console.log('⚠️ API query processing failed, using local fallback');
        console.log('📊 Failed API response:', JSON.stringify(response, null, 2));
        // Fallback to local processing
        return await this._processQueryWithTimeout(query.trim());
      }
    } catch (error) {
      console.error('Error processing query via API:', error);
      
      // Try local fallback on API failure
      try {
        console.log('🔄 Attempting local query processing as fallback...');
        return await this._processQueryWithTimeout(query.trim());
      } catch (localError) {
        console.error('Local query processing also failed:', localError);
        
        // Return a safe, user-friendly error response
        return {
          type: 'error',
          text: `I'm having trouble processing your question right now. Please try asking something simpler like:\n\n• "What were my sales this week?"\n• "Show me top products"\n• "How many orders today?"`
        };
      }
    }
  }
  
  async _processQueryWithTimeout(query) {
    // Add circuit breaker to prevent infinite loops
    if (this._processingQuery) {
      console.log('🚫 Query already in progress, preventing duplicate processing');
      return {
        type: 'error',
        text: 'Please wait for the current query to complete before asking another question.'
      };
    }
    
    this._processingQuery = true;
    
    try {
      // Force strict local processing to prevent black screen
      console.log('💾 Processing query locally with strict safety measures...');
      
      // Validate query length to prevent memory issues
      if (query.length > 200) {
        return {
          type: 'error',
          text: 'Please ask a shorter question (under 200 characters).'
        };
      }
      
      const normalizedQuery = query.toLowerCase().trim();
      const intent = this.classifyQueryIntent(normalizedQuery);
      
      console.log('🧠 Query intent classified as:', intent.type);
      
      // Add timeout protection for each handler
      const handlerPromise = this._executeQueryHandler(intent, normalizedQuery);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query handler timeout')), 5000)
      );
      
      const result = await Promise.race([handlerPromise, timeoutPromise]);
      
      // Validate result structure
      if (!result || typeof result !== 'object' || !result.type) {
        throw new Error('Invalid query result structure');
      }
      
      return result;
      
    } catch (error) {
      console.error('Error in _processQueryWithTimeout:', error);
      return {
        type: 'error',
        text: 'I encountered an error processing your question. Please try a simpler question like "show sales" or "top products".'
      };
    } finally {
      // Always reset the processing flag
      this._processingQuery = false;
    }
  }
  
  async _executeQueryHandler(intent, normalizedQuery) {
    switch (intent.type) {
      case 'top_products':
        return await this.handleTopProductsQuery(intent);
      case 'sales_period':
        return await this.handleSalesPeriodQuery(intent);
      case 'customer_insights':
        return await this.handleCustomerQuery(intent);
      case 'revenue_analysis':
        return await this.handleRevenueQuery(intent);
      case 'forecast':
        return await this.handleForecastQuery(intent);
      default:
        return this.handleGenericQuery(normalizedQuery);
    }
  }

  classifyQueryIntent(query) {
    const patterns = {
      top_products: /(?:top|best|most|popular).+(?:product|item|milk)/i,
      sales_period: /(?:sales|revenue|orders).+(?:last|this|yesterday|today|week|month|year)/i,
      customer_insights: /(?:customer|client|buyer).+(?:most|best|frequent|loyal)/i,
      revenue_analysis: /(?:revenue|money|earnings|income|profit|trending|trend)/i,
      forecast: /(?:predict|forecast|estimate|expect|future|next)/i
    };
    
    console.log('🔍 Classifying query:', query);
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(query)) {
        console.log(`✅ Matched pattern '${type}' for query: ${query}`);
        return { 
          type, 
          confidence: 0.8,
          extractedParams: this.extractParameters(query, type)
        };
      }
    }
    
    console.log(`⌛ No pattern matched for query: ${query}`);
    return { type: 'unknown', confidence: 0.1, extractedParams: {} };
  }

  extractParameters(query, intentType) {
    const params = {};
    
    // Time period extraction
    if (query.includes('yesterday')) params.period = 'yesterday';
    else if (query.includes('today')) params.period = 'today';
    else if (query.includes('this week')) params.period = 'week';
    else if (query.includes('last week')) params.period = 'lastWeek';
    else if (query.includes('this month')) params.period = 'month';
    else if (query.includes('last month')) params.period = 'lastMonth';
    
    // Number extraction
    const numberMatch = query.match(/\d+/);
    if (numberMatch) params.number = parseInt(numberMatch[0]);
    
    return params;
  }

  async handleTopProductsQuery(intent) {
    try {
      const period = intent.extractedParams?.period || 'month';
      const limit = intent.extractedParams?.number || 5;
      
      // Prevent infinite loops - use cached data if available
      let reportData;
      if (this.cachedReportData && this.cachedReportData.dateRange === period) {
        console.log('Using cached report data to prevent circular calls');
        reportData = this.cachedReportData;
      } else {
        reportData = await this.generateSalesReport(period);
        this.cachedReportData = reportData; // Cache for future use
      }
      
      // Add null safety checks
      if (!reportData || !reportData.topProducts || !reportData.topProducts.topPerformers) {
        return {
          type: 'answer',
          text: `No product data available for the ${period} period. Please ensure you have sales data recorded.`,
          data: []
        };
      }
      
      const topProducts = reportData.topProducts.topPerformers.slice(0, limit);
      
      if (topProducts.length === 0) {
        return {
          type: 'answer',
          text: `No product sales found for the ${period} period.`,
          data: []
        };
      }
      
      const response = `Here are the top ${topProducts.length} products for the ${period}:\n\n` +
        (topProducts || []).map((product, index) => 
          `${index + 1}. ${product?.name || 'Unknown Product'}: ${product?.quantity || 0} units sold, ${this.formatCurrency(product?.revenue || 0)} revenue`
        ).join('\n');
      
      return {
        type: 'answer',
        text: response,
        data: topProducts
      };
    } catch (error) {
      console.error('Error in handleTopProductsQuery:', error);
      return {
        type: 'error',
        text: 'I encountered an error while fetching product data. Please try again later.',
        data: []
      };
    }
  }

  async handleSalesPeriodQuery(intent) {
    try {
      const period = intent.extractedParams?.period || 'week';
      const reportData = await this.generateSalesReport(period);
      
      // Add null safety checks
      const metrics = reportData?.metrics || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 };
      
      const response = `Sales summary for the ${period}:\n\n` +
        `📊 Total Orders: ${metrics.totalOrders || 0}\n` +
        `💰 Total Revenue: ${this.formatCurrency(metrics.totalRevenue || 0)}\n` +
        `📈 Average Order Value: ${this.formatCurrency(metrics.averageOrderValue || 0)}\n` +
        `⭐ Peak Day: ${metrics.peakDay ? `${metrics.peakDay.day} with ${metrics.peakDay.orders} orders` : 'No peak day data'}`;
      
      return {
        type: 'answer',
        text: response,
        data: reportData || { metrics }
      };
    } catch (error) {
      console.error('Error in handleSalesPeriodQuery:', error);
      return {
        type: 'error',
        text: 'I encountered an error while fetching sales data. Please try again later.',
        data: {}
      };
    }
  }

  async handleCustomerQuery(intent) {
    try {
      console.log('👥 Processing customer insights query...');
      const reportData = await this.generateSalesReport('month');
      
      if (!reportData || !reportData.customerAnalysis) {
        return {
          type: 'answer',
          text: 'No customer data available for analysis. Please ensure you have customer information in your orders.',
          data: {}
        };
      }
      
      const customerData = reportData.customerAnalysis;
      const response = `Customer Insights:\n\n` +
        `👥 Total Customers: ${customerData.totalCustomers || 0}\n` +
        `🔄 Repeat Customers: ${customerData.repeatCustomers || 0} (${Math.round((customerData.repeatCustomerRate || 0) * 100)}% retention)\n` +
        `📊 Average Orders per Customer: ${Math.round(customerData.avgOrdersPerCustomer || 0)}\n\n` +
        `Top Customers:\n` +
        (customerData.topCustomers || []).slice(0, 3).map((customer, index) => 
          `${index + 1}. ${customer.name || 'Unknown'}: ${customer.orders || 0} orders, ${this.formatCurrency(customer.revenue || 0)}`
        ).join('\n');
      
      return {
        type: 'answer',
        text: response,
        data: customerData
      };
    } catch (error) {
      console.error('Error in handleCustomerQuery:', error);
      return {
        type: 'error',
        text: 'I encountered an error while analyzing customer data. Please try again later.',
        data: {}
      };
    }
  }

  async handleRevenueQuery(intent) {
    try {
      console.log('💰 Processing revenue analysis query...');
      const period = intent.extractedParams?.period || 'month';
      const reportData = await this.generateSalesReport(period);
      
      if (!reportData || !reportData.metrics) {
        return {
          type: 'answer',
          text: `No revenue data available for the ${period} period.`,
          data: {}
        };
      }
      
      const metrics = reportData.metrics;
      const dailySales = reportData.dailySales || {};
      const days = Object.keys(dailySales).sort();
      
      // Calculate trend
      let trendText = '';
      if (days.length > 1) {
        const revenueValues = days.map(day => dailySales[day]?.revenue || 0);
        const trend = this.calculateTrendDirection(revenueValues);
        const trendEmoji = trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️';
        trendText = `\n${trendEmoji} Revenue Trend: ${trend}`;
      }
      
      const response = `Revenue Analysis for ${this.getPeriodText(period)}:\n\n` +
        `💰 Total Revenue: ${this.formatCurrency(metrics.totalRevenue || 0)}\n` +
        `📈 Average Order Value: ${this.formatCurrency(metrics.averageOrderValue || 0)}\n` +
        `📊 Orders: ${metrics.totalOrders || 0}\n` +
        `💳 Revenue per Order: ${this.formatCurrency((metrics.totalRevenue || 0) / (metrics.totalOrders || 1))}` +
        trendText;
      
      return {
        type: 'answer',
        text: response,
        data: { ...metrics, trend: days.length > 1 ? this.calculateTrendDirection(days.map(day => dailySales[day]?.revenue || 0)) : 'stable' }
      };
    } catch (error) {
      console.error('Error in handleRevenueQuery:', error);
      return {
        type: 'error',
        text: 'I encountered an error while analyzing revenue data. Please try again later.',
        data: {}
      };
    }
  }

  async handleForecastQuery(intent) {
    try {
      console.log('🔮 Processing forecast query...');
      const period = intent.extractedParams?.period || 'week';
      const reportData = await this.generateSalesReport('month'); // Use longer period for better forecasting
      
      if (!reportData || !reportData.dailySales || Object.keys(reportData.dailySales).length < 7) {
        return {
          type: 'answer',
          text: 'I need at least a week of sales data to generate reliable forecasts. Please check back when you have more historical data.',
          data: {}
        };
      }
      
      const dailySales = reportData.dailySales;
      const days = Object.keys(dailySales).sort();
      const revenueValues = days.map(day => dailySales[day]?.revenue || 0);
      const orderValues = days.map(day => dailySales[day]?.orders || 0);
      
      // Simple trend-based forecast
      const revenueRegression = this.calculateLinearRegression(revenueValues);
      const orderRegression = this.calculateLinearRegression(orderValues);
      
      // Forecast next period
      const nextPeriodRevenue = Math.max(0, revenueRegression.slope * revenueValues.length + revenueRegression.intercept);
      const nextPeriodOrders = Math.max(0, Math.round(orderRegression.slope * orderValues.length + orderRegression.intercept));
      
      const confidence = revenueRegression.rSquared > 0.7 ? 'High' : revenueRegression.rSquared > 0.4 ? 'Medium' : 'Low';
      
      const response = `Sales Forecast:\n\n` +
        `🔮 Predicted ${period} Revenue: ${this.formatCurrency(nextPeriodRevenue)}\n` +
        `📊 Predicted Orders: ${nextPeriodOrders}\n` +
        `🎯 Confidence Level: ${confidence}\n\n` +
        `Based on ${days.length} days of historical data.` +
        (confidence === 'Low' ? '\n\n⚠️ More data needed for accurate predictions.' : '');
      
      return {
        type: 'answer',
        text: response,
        data: {
          forecastRevenue: nextPeriodRevenue,
          forecastOrders: nextPeriodOrders,
          confidence: confidence.toLowerCase(),
          rSquared: revenueRegression.rSquared,
          dataPoints: days.length
        }
      };
    } catch (error) {
      console.error('Error in handleForecastQuery:', error);
      return {
        type: 'error',
        text: 'I encountered an error while generating forecasts. Please try again later.',
        data: {}
      };
    }
  }

  // Generic query handler for unclassified queries
  handleGenericQuery(query) {
    try {
      console.log('🤖 Handling generic query:', query);
      
      // Get predefined queries for better suggestions
      const predefinedQueries = this.getPredefinedQueries();
      const randomSuggestions = this.getRandomSuggestions(5);
      
      // Create contextual response based on common keywords
      let contextualHelp = '';
      const queryLower = query.toLowerCase();
      
      if (queryLower.includes('help') || queryLower.includes('what can you do')) {
        contextualHelp = 'I can help you analyze your business data in many ways:\n\n• Sales Analytics: Revenue, trends, growth\n• Product Insights: Best sellers, inventory\n• Customer Analytics: Top customers, retention\n• Order Management: Status, fulfillment\n• Forecasting: Predict future sales\n\n';
      } else if (queryLower.includes('example') || queryLower.includes('sample')) {
        contextualHelp = 'Here are some example questions you can ask:\n\n';
      } else {
        contextualHelp = `I understand you're asking about "${query}", but I need more specific information.\n\n`;
      }
      
      const response = contextualHelp + `Try these specific questions:\n\n${randomSuggestions.map(s => `• ${s}`).join('\n')}\n\nYou can also browse categories in the welcome screen by clearing the chat!`;
      
      return {
        type: 'answer',
        text: response,
        data: {
          suggestedQueries: randomSuggestions,
          originalQuery: query,
          categories: predefinedQueries.categories.map(cat => cat.title)
        }
      };
    } catch (error) {
      console.error('Error in handleGenericQuery:', error);
      return {
        type: 'error',
        text: 'I\'m having trouble understanding your question. Please try asking something simpler like "show sales" or "top products".',
        data: {}
      };
    }
  }

  // ========================
  // Utility Functions
  // ========================

  initializeNLGTemplates() {
    return {
      overview: "During the {period}, you processed {totalOrders} orders generating {totalRevenue} in total revenue, with an average order value of {avgOrderValue}.",
      growth: "Sales {direction} by {percentage}% compared to the previous {period}.",
      topProduct: "{productName} was your best-performing product with {quantity} units sold and {revenue} in revenue.",
      peakDay: "{day} was your busiest day with {orders} orders totaling {revenue}."
    };
  }

  initializeInsightTemplates() {
    return {
      highGrowth: "Excellent growth momentum! Your sales are trending upward.",
      declining: "Sales are declining. Consider reviewing your strategy.",
      stable: "Steady performance with consistent sales patterns.",
      seasonal: "Seasonal patterns detected in your sales data."
    };
  }

  groupByDay(data) {
    const grouped = {};
    
    data.forEach(order => {
      const date = new Date(order.timestamp || order.orderDate || order.createdAt);
      const dayKey = date.toLocaleDateString();
      
      if (!grouped[dayKey]) {
        grouped[dayKey] = { orders: 0, revenue: 0, items: 0 };
      }
      
      grouped[dayKey].orders += 1;
      grouped[dayKey].revenue += parseFloat(order.totalAmount || 0);
      
      if (order.items && Array.isArray(order.items)) {
        grouped[dayKey].items += order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      } else {
        grouped[dayKey].items += parseInt(order.quantity || order.totalItems || 1);
      }
    });
    
    return grouped;
  }

  findPeakDay(dailySales) {
    const days = Object.entries(dailySales);
    if (days.length === 0) return null;
    
    const peakDay = days.reduce((peak, [day, data]) => 
      data.orders > peak.orders ? { day, ...data } : peak, 
      { day: '', orders: 0, revenue: 0 }
    );
    
    return peakDay.orders > 0 ? peakDay : null;
  }

  calculateLinearRegression(values) {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };
    
    const xValues = (values || []).map((_, i) => i);
    const xSum = xValues.reduce((sum, x) => sum + x, 0);
    const ySum = values.reduce((sum, y) => sum + y, 0);
    const xySum = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const x2Sum = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;
    
    // Calculate R-squared
    const yMean = ySum / n;
    const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = values.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);
    
    return { slope, intercept, rSquared };
  }

  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  getPeriodText(period) {
    const periodMap = {
      'today': 'today',
      'week': 'past week',
      'month': 'past month',
      'quarter': 'past quarter',
      'year': 'past year'
    };
    return periodMap[period] || period;
  }

  getDateRangePeriod(dateRange) {
    const now = new Date();
    let startDate, endDate = now;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      label: this.getPeriodText(dateRange)
    };
  }

  calculateConversionRate(data) {
    const totalOrders = data.length;
    const completedOrders = data.filter(order => 
      order.status === 'delivered' || order.status === 'completed'
    ).length;
    
    return totalOrders > 0 ? completedOrders / totalOrders : 0;
  }

  calculateGrowthRate(currentData) {
    // This would compare with previous period data
    // For now, return null as we need historical comparison
    return null;
  }

  analyzeTemporalTrends(data) {
    const hourlyPattern = {};
    const weeklyPattern = {};
    
    data.forEach(order => {
      const date = new Date(order.timestamp || order.orderDate || order.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      
      hourlyPattern[hour] = (hourlyPattern[hour] || 0) + 1;
      weeklyPattern[dayOfWeek] = (weeklyPattern[dayOfWeek] || 0) + 1;
    });
    
    return {
      peakHours: this.findTopEntries(hourlyPattern, 3),
      peakDaysOfWeek: this.findTopEntries(weeklyPattern, 3),
      patterns: {
        hourly: hourlyPattern,
        weekly: weeklyPattern
      }
    };
  }

  analyzeCustomerBehavior(data) {
    const customerData = {};
    
    data.forEach(order => {
      const customerId = order.customerId || order.customerName;
      if (customerId) {
        if (!customerData[customerId]) {
          customerData[customerId] = { orders: 0, revenue: 0, avgOrderValue: 0 };
        }
        customerData[customerId].orders += 1;
        customerData[customerId].revenue += parseFloat(order.totalAmount || 0);
      }
    });
    
    // Calculate average order values
    Object.keys(customerData).forEach(customerId => {
      const customer = customerData[customerId];
      customer.avgOrderValue = customer.orders > 0 ? customer.revenue / customer.orders : 0;
    });
    
    const customers = Object.values(customerData);
    const repeatCustomers = customers.filter(c => c.orders > 1).length;
    const totalCustomers = customers.length;
    
    return {
      totalCustomers,
      repeatCustomers,
      repeatCustomerRate: totalCustomers > 0 ? repeatCustomers / totalCustomers : 0,
      topCustomers: customers
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      avgOrdersPerCustomer: totalCustomers > 0 
        ? customers.reduce((sum, c) => sum + c.orders, 0) / totalCustomers 
        : 0
    };
  }

  // Missing function: analyzeCustomerTrends
  analyzeCustomerTrends(data) {
    const customerData = {};
    const timeWindows = {};
    
    // Group orders by time windows for trend analysis
    data.forEach(order => {
      const customerId = order.customerId || order.customerName;
      const orderDate = new Date(order.timestamp || order.orderDate || order.createdAt);
      const weekKey = this.getWeekKey(orderDate);
      
      if (customerId) {
        if (!customerData[customerId]) {
          customerData[customerId] = { 
            orders: 0, 
            revenue: 0, 
            firstOrder: orderDate,
            lastOrder: orderDate,
            ordersByWeek: {}
          };
        }
        
        customerData[customerId].orders += 1;
        customerData[customerId].revenue += parseFloat(order.totalAmount || 0);
        customerData[customerId].ordersByWeek[weekKey] = (customerData[customerId].ordersByWeek[weekKey] || 0) + 1;
        
        if (orderDate < customerData[customerId].firstOrder) {
          customerData[customerId].firstOrder = orderDate;
        }
        if (orderDate > customerData[customerId].lastOrder) {
          customerData[customerId].lastOrder = orderDate;
        }
      }
      
      // Track overall weekly trends
      if (!timeWindows[weekKey]) {
        timeWindows[weekKey] = { customers: new Set(), orders: 0, revenue: 0 };
      }
      timeWindows[weekKey].customers.add(customerId);
      timeWindows[weekKey].orders += 1;
      timeWindows[weekKey].revenue += parseFloat(order.totalAmount || 0);
    });
    
    // Calculate customer metrics
    const customers = Object.values(customerData);
    const newCustomers = customers.filter(c => c.orders === 1).length;
    const returningCustomers = customers.filter(c => c.orders > 1).length;
    
    // Calculate customer lifetime value trends
    const avgLifetimeValue = customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.revenue, 0) / customers.length 
      : 0;
    
    // Weekly customer acquisition trends
    const weeklyTrends = Object.entries(timeWindows || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        uniqueCustomers: data?.customers?.size || 0,
        orders: data?.orders || 0,
        revenue: data?.revenue || 0,
        avgOrderValue: (data?.orders || 0) > 0 ? (data?.revenue || 0) / (data?.orders || 1) : 0
      }));
    
    return {
      newCustomers,
      returningCustomers,
      customerRetentionRate: customers.length > 0 ? returningCustomers / customers.length : 0,
      avgLifetimeValue,
      weeklyTrends,
      topLoyalCustomers: customers
        .filter(c => c.orders > 2)
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5),
      customerAcquisitionTrend: (weeklyTrends || []).length > 1 
        ? this.calculateTrendDirection((weeklyTrends || []).map(w => w?.uniqueCustomers || 0))
        : 'stable'
    };
  }

  // Helper function to get week key for grouping
  getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
    const month = date.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}-W${week}`;
  }

  // Missing function: getTopProducts - CRITICAL FIX
  getTopProducts(data) {
    console.log('📊 Calculating top products from', data.length, 'orders');
    
    if (!data || data.length === 0) {
      return { topPerformers: [], worstPerformers: [], concentrationRatio: 0 };
    }
    
    const productStats = {};
    
    // Aggregate product data from all orders
    data.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        // Handle multi-product orders
        order.items.forEach(item => {
          const productName = item.productName || item.name || 'Unknown Product';
          if (!productStats[productName]) {
            productStats[productName] = {
              name: productName,
              quantity: 0,
              revenue: 0,
              orders: 0
            };
          }
          
          productStats[productName].quantity += parseInt(item.quantity || 0);
          productStats[productName].revenue += parseFloat(item.totalPrice || item.price || 0);
          productStats[productName].orders += 1;
        });
      } else {
        // Handle single-product orders (legacy format)
        const productName = order.productName || order.product || 'Unknown Product';
        if (!productStats[productName]) {
          productStats[productName] = {
            name: productName,
            quantity: 0,
            revenue: 0,
            orders: 0
          };
        }
        
        productStats[productName].quantity += parseInt(order.quantity || order.totalItems || 1);
        productStats[productName].revenue += parseFloat(order.totalAmount || 0);
        productStats[productName].orders += 1;
      }
    });
    
    // Convert to array and sort by revenue
    const allProducts = Object.values(productStats);
    const topPerformers = allProducts
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10
      
    const worstPerformers = allProducts
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 5); // Bottom 5
    
    // Calculate concentration ratio (top 20% products' share of total revenue)
    const totalRevenue = allProducts.reduce((sum, p) => sum + p.revenue, 0);
    const top20PercentCount = Math.ceil(allProducts.length * 0.2);
    const top20PercentRevenue = topPerformers
      .slice(0, top20PercentCount)
      .reduce((sum, p) => sum + p.revenue, 0);
    const concentrationRatio = totalRevenue > 0 ? top20PercentRevenue / totalRevenue : 0;
    
    console.log('✅ Top products calculated:', topPerformers.length, 'top performers found');
    
    return {
      topPerformers,
      worstPerformers,
      concentrationRatio,
      totalProducts: allProducts.length,
      totalRevenue
    };
  }

  // Missing function: calculateSummaryConfidence - CRITICAL FIX
  calculateSummaryConfidence(reportData) {
    try {
      // Add null safety checks
      if (!reportData) {
        return { overall: 0.1, factors: { dataQuality: 'poor', reason: 'No report data' } };
      }
      
      const metrics = reportData.metrics || {};
      const trends = reportData.trends || {};
      const rawData = reportData.rawData || [];
      
      let confidenceScore = 0;
      const factors = {};
      
      // Data quality factor (40% of confidence)
      const dataPoints = rawData.length || 0;
      if (dataPoints >= 30) {
        factors.dataQuality = 'excellent';
        confidenceScore += 0.4;
      } else if (dataPoints >= 10) {
        factors.dataQuality = 'good';
        confidenceScore += 0.25;
      } else if (dataPoints >= 5) {
        factors.dataQuality = 'fair';
        confidenceScore += 0.15;
      } else {
        factors.dataQuality = 'poor';
        confidenceScore += 0.05;
      }
      
      // Completeness factor (30% of confidence)
      const hasOrders = (metrics.totalOrders || 0) > 0;
      const hasRevenue = (metrics.totalRevenue || 0) > 0;
      const hasTrends = trends && Object.keys(trends).length > 0;
      
      const completenessScore = [hasOrders, hasRevenue, hasTrends].filter(Boolean).length / 3;
      factors.completeness = completenessScore > 0.8 ? 'high' : completenessScore > 0.5 ? 'medium' : 'low';
      confidenceScore += completenessScore * 0.3;
      
      // Consistency factor (20% of confidence)
      if (hasOrders && hasRevenue && metrics.totalOrders > 0) {
        const avgOrderValue = metrics.totalRevenue / metrics.totalOrders;
        const isReasonableAOV = avgOrderValue > 10 && avgOrderValue < 10000; // Reasonable range
        factors.consistency = isReasonableAOV ? 'high' : 'medium';
        confidenceScore += isReasonableAOV ? 0.2 : 0.1;
      } else {
        factors.consistency = 'low';
        confidenceScore += 0.05;
      }
      
      // Recency factor (10% of confidence)
      if (rawData.length > 0) {
        const latestOrder = rawData.reduce((latest, order) => {
          const orderDate = new Date(order.timestamp || order.orderDate || order.createdAt);
          return orderDate > latest ? orderDate : latest;
        }, new Date(0));
        
        const daysSinceLatest = (new Date() - latestOrder) / (1000 * 60 * 60 * 24);
        if (daysSinceLatest <= 1) {
          factors.recency = 'fresh';
          confidenceScore += 0.1;
        } else if (daysSinceLatest <= 7) {
          factors.recency = 'recent';
          confidenceScore += 0.08;
        } else if (daysSinceLatest <= 30) {
          factors.recency = 'moderate';
          confidenceScore += 0.05;
        } else {
          factors.recency = 'stale';
          confidenceScore += 0.02;
        }
      } else {
        factors.recency = 'none';
      }
      
      // Ensure confidence is between 0 and 1
      confidenceScore = Math.max(0, Math.min(1, confidenceScore));
      
      return {
        overall: Math.round(confidenceScore * 100) / 100, // Round to 2 decimal places
        factors,
        dataPoints,
        recommendation: confidenceScore > 0.7 ? 'Highly reliable insights' :
                       confidenceScore > 0.4 ? 'Moderately reliable insights' :
                       'Insights have low reliability, more data needed'
      };
    } catch (error) {
      console.error('Error calculating summary confidence:', error);
      return {
        overall: 0.1,
        factors: { error: 'Calculation failed' },
        dataPoints: 0,
        recommendation: 'Unable to assess reliability'
      };
    }
  }

  // Helper function to calculate trend direction
  calculateTrendDirection(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  calculateProductConcentration(sortedProducts) {
    if (sortedProducts.length === 0) return 0;
    
    const totalRevenue = sortedProducts.reduce((sum, product) => sum + product.revenue, 0);
    const top20PercentCount = Math.ceil(sortedProducts.length * 0.2);
    const top20PercentRevenue = sortedProducts
      .slice(0, top20PercentCount)
      .reduce((sum, product) => sum + product.revenue, 0);
    
    return totalRevenue > 0 ? top20PercentRevenue / totalRevenue : 0;
  }

  calculateSeasonality(dailySales) {
    const days = Object.keys(dailySales).sort();
    if (days.length < 7) return { avgMultiplier: 1, strength: 'none' };
    
    // Simple weekly seasonality calculation
    const weeklyPattern = {};
    days.forEach(day => {
      const date = new Date(day);
      const dayOfWeek = date.getDay();
      
      if (!weeklyPattern[dayOfWeek]) {
        weeklyPattern[dayOfWeek] = { total: 0, count: 0 };
      }
      
      weeklyPattern[dayOfWeek].total += dailySales[day].revenue;
      weeklyPattern[dayOfWeek].count += 1;
    });
    
    const avgRevenues = Object.keys(weeklyPattern || {}).map(day => {
      const pattern = weeklyPattern[day];
      return pattern?.count > 0 ? (pattern?.total || 0) / (pattern?.count || 1) : 0;
    });
    
    const overallAvg = avgRevenues.reduce((sum, avg) => sum + avg, 0) / avgRevenues.length;
    const variance = avgRevenues.reduce((sum, avg) => sum + Math.pow(avg - overallAvg, 2), 0) / avgRevenues.length;
    const strength = variance > overallAvg * 0.1 ? 'strong' : variance > overallAvg * 0.05 ? 'moderate' : 'weak';
    
    return {
      avgMultiplier: overallAvg > 0 ? Math.max(...avgRevenues) / overallAvg : 1,
      strength,
      pattern: weeklyPattern
    };
  }

  calculateTrendConfidence(values) {
    if (values.length < 3) return 0;
    
    const regression = this.calculateLinearRegression(values);
    return Math.min(regression.rSquared, 1);
  }

  calculateForecastConfidence(data) {
    if (data.length < 7) return 'low';
    if (data.length < 30) return 'medium';
    return 'high';
  }

  findTopEntries(object, count) {
    return Object.entries(object || {})
      .sort(([,a], [,b]) => (b || 0) - (a || 0))
      .slice(0, count)
      .map(([key, value]) => ({ key, value: value || 0 }));
  }

  forecastProductDemand(data, period) {
    const productDemand = {};
    
    data.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const productId = item.productId || item.product?._id;
          const productName = item.productName || item.product?.name;
          if (productId) {
            if (!productDemand[productId]) {
              productDemand[productId] = { name: productName, quantities: [] };
            }
            productDemand[productId].quantities.push(item.quantity || 0);
          }
        });
      }
    });
    
    const forecasts = {};
    Object.entries(productDemand).forEach(([productId, data]) => {
      const quantities = data.quantities;
      if (quantities.length < 3) {
        forecasts[productId] = {
          name: data.name,
          forecast: 0,
          confidence: 'low',
          note: 'Insufficient historical data'
        };
        return;
      }
      
      // Simple average-based forecast
      const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;
      const variance = quantities.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / quantities.length;
      const stdDev = Math.sqrt(variance);
      
      forecasts[productId] = {
        name: data.name,
        forecast: avg,
        range: { low: Math.max(0, avg - stdDev), high: avg + stdDev },
        confidence: stdDev / avg < 0.3 ? 'high' : stdDev / avg < 0.6 ? 'medium' : 'low'
      };
    });
    
    return forecasts;
  }

  // ========================
  // Placeholder API + User role (mocked for now)
  // ========================

  async getUserRole() {
    try {
      const role = await SecureStore.getItemAsync('userRole');
      return role || 'user';
    } catch {
      return 'user';
    }
  }
  
  // Generate quick insights for dashboard
  async generateQuickInsights() {
    try {
      console.log('📊 Generating quick insights from database...');
      
      // Get dashboard insights from API
      const response = await api.getDashboardInsights();
      
      if (response && response.success) {
        console.log('✅ Generated quick insights from database API');
        
        const insights = response.insights;
        
        return [
          {
            title: 'Total Revenue',
            value: `₹${(insights.summary?.totalRevenue || 0).toLocaleString()}`,
            trend: insights.trends?.revenue || 'stable',
            icon: '💰',
            color: '#4CAF50'
          },
          {
            title: 'Total Orders',
            value: (insights.summary?.totalOrders || 0).toString(),
            trend: insights.trends?.orders || 'stable',
            icon: '📎',
            color: '#2196F3'
          },
          {
            title: 'Avg Order Value',
            value: `₹${(insights.summary?.averageOrderValue || 0).toFixed(0)}`,
            trend: 'stable',
            icon: '📈',
            color: '#FF9800'
          },
          {
            title: 'Top Product',
            value: insights.summary?.topProduct || 'No data',
            trend: 'neutral',
            icon: '🥛',
            color: '#9C27B0'
          }
        ];
      } else {
        console.log('⚠️ Failed to get insights from API');
        return this.getDefaultInsights();
      }
    } catch (error) {
      console.error('Error generating quick insights:', error);
      return this.getDefaultInsights();
    }
  }
  
  getDefaultInsights() {
    return [
      {
        title: 'Total Revenue',
        value: '₹0',
        trend: 'stable',
        icon: '💰',
        color: '#4CAF50'
      },
      {
        title: 'Total Orders',
        value: '0',
        trend: 'stable',
        icon: '📎',
        color: '#2196F3'
      },
      {
        title: 'Avg Order Value',
        value: '₹0',
        trend: 'stable',
        icon: '📈',
        color: '#FF9800'
      },
      {
        title: 'Top Product',
        value: 'No data',
        trend: 'neutral',
        icon: '🥛',
        color: '#9C27B0'
      }
    ];
  }
}

// Create and export an instance instead of the class
const aiAnalyticsService = new AIAnalyticsService();
export default aiAnalyticsService;
