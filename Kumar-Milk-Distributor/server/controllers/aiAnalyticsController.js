const MobileOrder = require('../models/MobileOrder');
const Order = require('../models/Order');
const User = require('../models/User');

/**
 * AI Analytics Controller
 * Backend APIs for AI-powered analytics and reporting
 */

// -------------------------------
// Internal reusable function to generate report data
// -------------------------------
async function fetchReportData(dateRange = 'week', filters = {}) {
  const { startDate, endDate } = getDateRange(dateRange);

  const mobileOrders = await MobileOrder.find({
    createdAt: { $gte: startDate, $lte: endDate },
    ...buildFilters(filters)
  }).populate('customer', 'name email phone');

  const webOrders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('customer', 'name');

  const allOrders = [
    ...mobileOrders.map(order => ({
      id: order._id,
      customerId: order.customer?._id,
      customerName: order.customer?.name || 'Unknown',
      productName: order.productName,
      quantity: order.quantity,
      unitType: order.unitType,
      totalAmount: order.totalAmount,
      status: order.status,
      timestamp: order.createdAt,
      type: 'mobile'
    })),
    ...webOrders.map(order => ({
      id: order._id,
      customerId: order.customer?._id,
      customerName: order.shopName || order.customer?.name || 'Unknown',
      productName: 'Mixed Products',
      quantity: calculateTotalCrates(order),
      unitType: 'crate',
      totalAmount: order.totalAmount,
      status: order.status,
      timestamp: order.createdAt,
      type: 'web'
    }))
  ];

  const metrics = calculateSalesMetrics(allOrders);
  const trends = analyzeTrends(allOrders, dateRange);
  const insights = generateAIInsights(metrics, trends, allOrders);

  return {
    reportId: `report_${Date.now()}`,
    dateRange,
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      label: getPeriodLabel(dateRange)
    },
    generatedAt: new Date().toISOString(),
    metrics,
    trends,
    insights,
    topProducts: getTopProducts(allOrders),
    customerInsights: getCustomerInsights(allOrders),
    rawData: allOrders
  };
}

// -------------------------------
// Route Handlers
// -------------------------------

// Generate custom report (supports format & AI summary)
const generateCustomReport = async (req, res) => {
  try {
    let { format = 'json', dateRange = 'week', filters = {}, includeAISummary = true } = req.body;

    if (!['json', 'html', 'csv'].includes(format)) format = 'json';

    console.log('📊 Generating custom report:', { format, dateRange });

    // Fetch report data
    const reportData = await fetchReportData(dateRange, filters);

    // Optionally include AI summary
    if (!includeAISummary) reportData.insights = [];

    res.json({
      success: true,
      report: {
        format,
        dateRange,
        generatedAt: new Date().toISOString(),
        fileName: `kumar_milk_report_${dateRange}_${Date.now()}.${format}`,
        canShare: true,
        data: reportData
      }
    });

  } catch (error) {
    console.error('Custom report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom report',
      error: error.message
    });
  }
};

// Process AI natural language query
const processNaturalLanguageQuery = async (req, res) => {
  // ...keep your existing implementation
};

// Generate dashboard insights
const getDashboardInsights = async (req, res) => {
  // ...keep your existing implementation
};

// -------------------------------
// Helper Functions (unchanged)
// -------------------------------
function getDateRange(dateRange) { /* same as before */ }
function buildFilters(customFilters) { /* same as before */ }
function calculateTotalCrates(order) { /* same as before */ }
function calculateSalesMetrics(orders) { /* same as before */ }
function analyzeTrends(orders, period) { /* same as before */ }
function generateAIInsights(metrics, trends, orders) { /* same as before */ }
function getTopProducts(orders) { /* same as before */ }
function getCustomerInsights(orders) { /* same as before */ }
function classifyQueryIntent(query) { /* same as before */ }
function extractParameters(query, intentType) { /* same as before */ }
function getPeriodLabel(dateRange) { /* same as before */ }
async function handleTopProductsQuery(intent) { /* same as before */ }
async function handleSalesPeriodQuery(intent) { /* same as before */ }
async function handleCustomerQuery(intent) { /* same as before */ }
async function handleRevenueQuery(intent) { /* same as before */ }

module.exports = {
  generateCustomReport,
  generateSalesReport: fetchReportData, // export reusable internal function
  processNaturalLanguageQuery,
  getDashboardInsights
};
