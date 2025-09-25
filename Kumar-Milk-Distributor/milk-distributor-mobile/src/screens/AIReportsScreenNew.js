import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import aiAnalyticsService from '../services/aiAnalyticsService';
import reportGenerationService from '../services/reportGenerationService';
import AuthGuard from '../components/AuthGuard';

const AIReportsScreenNew = ({ navigation }) => {
  // Main state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickInsights, setQuickInsights] = useState(null);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatQuery, setChatQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Report state
  const [reports, setReports] = useState([]);
  const [reportConfig, setReportConfig] = useState({
    dateRange: 'week',
    format: 'pdf',
    includeAISummary: true
  });

  const chatScrollRef = useRef();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle app state changes (when returning from PDF viewer)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('📱 App state changed to:', nextAppState);
      if (nextAppState === 'active') {
        // User returned to app (possibly from PDF viewer)
        console.log('🔄 App became active, ensuring loading state is reset');
        setLoading(false); // Ensure loading spinner is stopped
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadQuickInsights(),
        loadSavedReports()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load insights
  const loadQuickInsights = async () => {
    try {
      console.log('🔍 Loading AI insights...');
      const reportData = await aiAnalyticsService.generateSalesReport('week');
      
      if (!reportData) {
        setQuickInsights({
          reportData: { metrics: {} },
          aiSummary: { summary: 'No data available', insights: [], recommendations: [] }
        });
        return;
      }
      
      const aiSummary = aiAnalyticsService.generateAISummary(reportData);
      setQuickInsights({ reportData, aiSummary: aiSummary || {} });
      console.log('✅ Quick insights loaded');
    } catch (error) {
      console.error('Error loading insights:', error);
      setQuickInsights({
        reportData: { metrics: {} },
        aiSummary: { summary: 'Error loading insights', insights: [], recommendations: [] }
      });
    }
  };

  // Load saved reports
  const loadSavedReports = async () => {
    try {
      const savedReports = await reportGenerationService.listSavedReports();
      setReports(savedReports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // Generate report
  const generateReport = async () => {
    try {
      setLoading(true);
      console.log('📝 Starting report generation...');
      
      const result = await reportGenerationService.generateReport(reportConfig);
      console.log('📝 Report generation result:', result);
      
      if (result.success) {
        // First show success toast
        Toast.show({
          type: 'success',
          text1: 'Report Generated',
          text2: `${reportConfig.format.toUpperCase()} report created successfully`,
        });
        
        // Update saved reports list
        await loadSavedReports();
        
        // Set loading to false BEFORE attempting to open report
        setLoading(false);
        
        // Auto-open the report after a small delay (non-blocking)
        setTimeout(async () => {
          try {
            console.log('📝 Attempting to auto-open report...');
            const openResult = await reportGenerationService.openReport(result);
            if (openResult.success) {
              console.log('✅ Report opened automatically');
            } else {
              console.log('⚠️ Failed to auto-open report:', openResult.error);
              // Show additional toast about manual access
              Toast.show({
                type: 'info',
                text1: 'Report Saved',
                text2: 'Tap on the report below to open it',
                visibilityTime: 4000,
              });
            }
          } catch (openError) {
            console.error('Error auto-opening report:', openError);
          }
        }, 500); // Small delay to ensure UI updates first
        
      } else {
        Toast.show({
          type: 'error',
          text1: 'Generation Failed',
          text2: result.error || 'Failed to generate report',
        });
      }
    } catch (error) {
      console.error('Report generation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: 'Failed to generate report',
      });
    } finally {
      // Ensure loading is always set to false
      setLoading(false);
      console.log('📝 Report generation process completed');
    }
  };

  // Open/Share report
  const shareReport = async (report) => {
    try {
      // First try to open the report directly
      const openResult = await reportGenerationService.openReport({
        success: true,
        filePath: report.filePath,
        format: report.fileName.split('.').pop() // Extract format from filename
      });
      
      if (openResult.success) {
        console.log('✅ Report opened successfully');
      } else {
        // If opening fails, fall back to sharing
        console.log('🔄 Opening failed, trying to share:', openResult.error);
        await reportGenerationService.shareReport(report);
        Toast.show({
          type: 'success',
          text1: 'Report Shared',
          text2: 'Report shared successfully',
        });
      }
    } catch (error) {
      console.error('Report access error:', error);
      Toast.show({
        type: 'error',
        text1: 'Access Failed',
        text2: 'Failed to open report',
      });
    }
  };

  // Send chat message
  const sendChatMessage = async () => {
    if (!chatQuery.trim()) return;
    
    const userMessage = { type: 'user', text: chatQuery, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    setChatLoading(true);
    
    const query = chatQuery;
    setChatQuery('');
    
    try {
      console.log('🤖 Processing AI query:', query);
      const response = await aiAnalyticsService.processNaturalLanguageQuery(query);
      
      const aiMessage = {
        type: 'ai',
        text: response?.text || 'Sorry, I could not process your request.',
        data: response?.data || null,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('Chat query error:', error);
      
      const errorMessage = {
        type: 'ai',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  // Quick query
  const sendQuickQuery = (query) => {
    setChatQuery(query);
    setTimeout(() => {
      sendChatMessage();
    }, 100);
  };

  // Render welcome message with predefined options
  const renderWelcomeMessage = () => {
    const predefinedQueries = aiAnalyticsService.getPredefinedQueries();
    
    return (
      <View style={styles.welcomeMessage}>
        <Text style={styles.welcomeText}>
          👋 Hi! I'm your AI business assistant. Ask me anything about your sales data!
        </Text>
        
        {/* Quick Action Buttons */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {predefinedQueries.quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionButton, { backgroundColor: action.color + '15', borderColor: action.color }]}
              onPress={() => sendQuickQuery(action.query)}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={[styles.quickActionText, { color: action.color }]}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Query Categories */}
        <Text style={styles.sectionHeader}>Browse by Category</Text>
        {predefinedQueries.categories.map((category, categoryIndex) => (
          <View key={categoryIndex} style={styles.queryCategory}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => {
                // Toggle category expansion (we'll implement this state if needed)
                // For now, just show first 2 queries
              }}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={[styles.categoryBadge, { backgroundColor: category.color }]}>
                {category.queries.length}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.categoryQueries}>
              {category.queries.slice(0, 2).map((query, queryIndex) => (
                <TouchableOpacity
                  key={queryIndex}
                  style={styles.categoryQueryButton}
                  onPress={() => sendQuickQuery(query)}
                >
                  <Text style={styles.categoryQueryText}>{query}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#54a9f7" />
                </TouchableOpacity>
              ))}
              {category.queries.length > 2 && (
                <Text style={styles.moreQueriesText}>
                  +{category.queries.length - 2} more questions...
                </Text>
              )}
            </View>
          </View>
        ))}
        
        {/* Random Suggestions */}
        <Text style={styles.sectionHeader}>Try asking:</Text>
        <View style={styles.suggestionButtons}>
          {aiAnalyticsService.getRandomSuggestions(3).map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionButton}
              onPress={() => sendQuickQuery(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Open chat
  const openChat = () => {
    setShowChat(true);
  };

  // Close chat
  const closeChat = () => {
    setShowChat(false);
  };

  // Render insights card
  const renderInsightsCard = () => {
    if (!quickInsights) return null;
    
    const { reportData, aiSummary } = quickInsights;
    const metrics = reportData?.metrics || {};
    const summary = aiSummary || {};
    
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.insightsCard}>
        <View style={styles.insightsHeader}>
          <Text style={styles.insightsIcon}>🤖</Text>
          <Text style={styles.insightsTitle}>AI Weekly Insights</Text>
          <Text style={styles.confidenceScore}>
            {Math.round((summary.confidence || 0.8) * 100)}% confident
          </Text>
        </View>
        
        <Text style={styles.insightsSummary}>
          {summary.summary || 'AI insights are being processed...'}
        </Text>
        
        <View style={styles.quickMetrics}>
          <View style={styles.quickMetric}>
            <Text style={styles.metricValue}>{metrics.totalOrders || 0}</Text>
            <Text style={styles.metricLabel}>Orders</Text>
          </View>
          <View style={styles.quickMetric}>
            <Text style={styles.metricValue}>₹{Math.round(metrics.totalRevenue || 0)}</Text>
            <Text style={styles.metricLabel}>Revenue</Text>
          </View>
          <View style={styles.quickMetric}>
            <Text style={styles.metricValue}>₹{Math.round(metrics.averageOrderValue || 0)}</Text>
            <Text style={styles.metricLabel}>Avg Order</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.viewInsightsButton} onPress={openChat}>
          <Text style={styles.viewInsightsText}>Ask AI Questions</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
    );
  };

  // Render report options
  const renderReportOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Generate Reports</Text>
      
      <View style={styles.reportOptions}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Date Range:</Text>
          <View style={styles.optionButtons}>
            {['today', 'week', 'month', 'quarter'].map(range => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.optionButton,
                  reportConfig.dateRange === range && styles.optionButtonActive
                ]}
                onPress={() => setReportConfig(prev => ({ ...prev, dateRange: range }))}
              >
                <Text style={[
                  styles.optionButtonText,
                  reportConfig.dateRange === range && styles.optionButtonTextActive
                ]}>
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Format:</Text>
          <View style={styles.optionButtons}>
            {['pdf', 'csv', 'html'].map(format => (
              <TouchableOpacity
                key={format}
                style={[
                  styles.optionButton,
                  reportConfig.format === format && styles.optionButtonActive
                ]}
                onPress={() => setReportConfig(prev => ({ ...prev, format }))}
              >
                <Text style={[
                  styles.optionButtonText,
                  reportConfig.format === format && styles.optionButtonTextActive
                ]}>
                  {format.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.generateButton} onPress={generateReport} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.generateButtonText}>Generate Report</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render saved reports
  const renderSavedReports = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📁 Saved Reports</Text>
      
      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No reports generated yet</Text>
        </View>
      ) : (
        <View style={styles.reportsList}>
          {reports.slice(0, 5).map((report, index) => (
            <View key={index} style={styles.reportItem}>
              <View style={styles.reportIcon}>
                <Ionicons 
                  name={report.format === 'pdf' ? 'document-text' : 'grid'} 
                  size={24} 
                  color="#54a9f7" 
                />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportName}>{report.fileName}</Text>
                <Text style={styles.reportDetails}>
                  {report.format?.toUpperCase()} • {(report.size / 1024)?.toFixed(1)}KB
                </Text>
              </View>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => shareReport(report)}
              >
                <Ionicons name="share-outline" size={20} color="#54a9f7" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Render chat interface
  const renderChatInterface = () => (
    <Modal visible={showChat} animationType="slide" transparent={false}>
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.chatContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>🤖 AI Business Assistant</Text>
            <TouchableOpacity onPress={closeChat}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.chatMessages}
            ref={chatScrollRef}
            showsVerticalScrollIndicator={false}
          >
            {chatHistory.length === 0 && renderWelcomeMessage()}

            {chatHistory.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.messageContainer,
                  message.type === 'user' ? styles.userMessage : styles.aiMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.type === 'user' ? styles.userMessageText : styles.aiMessageText
                ]}>
                  {message.text}
                </Text>
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            ))}

            {chatLoading && (
              <View style={[styles.messageContainer, styles.aiMessage]}>
                <ActivityIndicator color="#54a9f7" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* Quick shortcuts bar when there are messages */}
          {chatHistory.length > 0 && (
            <View style={styles.quickShortcutsBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shortcutsScroll}>
                {aiAnalyticsService.getPredefinedQueries().quickActions.slice(0, 4).map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.shortcutButton, { borderColor: action.color }]}
                    onPress={() => sendQuickQuery(action.query)}
                  >
                    <Text style={styles.shortcutIcon}>{action.icon}</Text>
                    <Text style={styles.shortcutText}>{action.text}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity 
                  style={styles.moreShortcutsButton}
                  onPress={() => {
                    // Clear chat to show welcome screen again
                    setChatHistory([]);
                  }}
                >
                  <Ionicons name="add" size={16} color="#54a9f7" />
                  <Text style={styles.moreShortcutsText}>More</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              value={chatQuery}
              onChangeText={setChatQuery}
              placeholder="Ask me about your business data..."
              multiline
              maxLength={500}
              editable={!chatLoading}
              returnKeyType="send"
              onSubmitEditing={sendChatMessage}
            />
            <TouchableOpacity
              style={[styles.sendButton, !chatQuery.trim() && styles.sendButtonDisabled]}
              onPress={sendChatMessage}
              disabled={!chatQuery.trim() || chatLoading}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#54a9f7" />
          <Text style={styles.loadingText}>Loading AI reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AuthGuard requireAdmin>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.screenTitle}>AI Reports & Analytics</Text>
            <TouchableOpacity style={styles.chatButton} onPress={openChat}>
              <Ionicons name="chatbubbles" size={20} color="#fff" />
              <Text style={styles.chatButtonText}>AI Chat</Text>
            </TouchableOpacity>
          </View>

          {renderInsightsCard()}
          {renderReportOptions()}
          {renderSavedReports()}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🚀 Powered by Kumar Milk AI • Advanced Analytics & Insights
            </Text>
          </View>
        </ScrollView>

        {renderChatInterface()}
      </SafeAreaView>
    </AuthGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#54a9f7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  chatButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Insights Card
  insightsCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    minHeight: 200,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  confidenceScore: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  insightsSummary: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  quickMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  quickMetric: {
    alignItems: 'center',
  },
  metricValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  viewInsightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  viewInsightsText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  
  // Report Options
  reportOptions: {
    marginBottom: 20,
  },
  optionRow: {
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionButtonActive: {
    backgroundColor: '#54a9f7',
    borderColor: '#54a9f7',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54a9f7',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Reports List
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  reportsList: {
    gap: 12,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  reportIcon: {
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  reportDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
  },
  
  // Chat Interface
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeMessage: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 12,
  },
  
  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    minHeight: 80,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Query Categories
  queryCategory: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 24,
  },
  categoryQueries: {
    padding: 16,
    paddingTop: 8,
  },
  categoryQueryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryQueryText: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
    marginRight: 8,
  },
  moreQueriesText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Random Suggestions
  suggestionButtons: {
    gap: 8,
    width: '100%',
  },
  suggestionButton: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#54a9f7',
  },
  suggestionText: {
    color: '#54a9f7',
    textAlign: 'center',
    fontSize: 14,
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#54a9f7',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#2c3e50',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  
  // Quick Shortcuts Bar
  quickShortcutsBar: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingVertical: 8,
  },
  shortcutsScroll: {
    paddingHorizontal: 12,
  },
  shortcutButton: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    minWidth: 70,
  },
  shortcutIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  shortcutText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#495057',
  },
  moreShortcutsButton: {
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#54a9f7',
    backgroundColor: '#fff',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  moreShortcutsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#54a9f7',
  },
  
  chatInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#54a9f7',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  
  // Footer
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default AIReportsScreenNew;