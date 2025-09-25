import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import simpleAuthService from '../services/simpleAuthService';
import { useNavigation } from '@react-navigation/native';

const HowToOrderScreen = () => {
  const navigation = useNavigation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await simpleAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderNow = () => {
    if (isAuthenticated) {
      navigation.navigate('PlaceOrder');
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How to Order</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How to Order</Text>
          
          <Text style={styles.description}>
            Place your order directly on our website. Orders must be placed one day before delivery.
          </Text>

          <View style={styles.timingSection}>
            <View style={styles.timingCard}>
              <View style={styles.timingHeader}>
                <Ionicons name="time" size={24} color="#54a9f7" />
                <Text style={styles.timingTitle}>Order Timing</Text>
              </View>
              <View style={styles.timingContent}>
                <Text style={styles.timingText}>Before</Text>
                <Text style={styles.timingHighlight}>1 PM</Text>
              </View>
            </View>

            <View style={styles.timingCard}>
              <View style={styles.timingHeader}>
                <Ionicons name="bicycle" size={24} color="#4CAF50" />
                <Text style={styles.timingTitle}>Delivery Timing</Text>
              </View>
              <View style={styles.timingContent}>
                <Text style={styles.timingText}>Between</Text>
                <Text style={styles.deliveryTime}>4 AM - 7 AM</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.orderButton}
            onPress={handleOrderNow}
          >
            <Text style={styles.orderButtonText}>Order Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Ordering Instructions</Text>
          
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Orders must be placed one day in advance
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Order before 1 PM for next day delivery
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Fresh milk delivered between 4 AM - 7 AM
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.instructionText}>
              Daily, weekly, and monthly subscriptions available
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6c4836',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  timingSection: {
    width: '100%',
    marginBottom: 32,
  },
  timingCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#54a9f7',
  },
  timingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  timingContent: {
    alignItems: 'center',
  },
  timingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timingHighlight: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  deliveryTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderButton: {
    backgroundColor: '#54a9f7',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 16,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
});

export default HowToOrderScreen;