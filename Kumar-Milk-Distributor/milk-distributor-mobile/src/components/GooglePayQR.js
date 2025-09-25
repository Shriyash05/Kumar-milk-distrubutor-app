import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const GooglePayQR = ({ amount, orderId, onPaymentComplete }) => {
  const upiId = 'shreyy954@okaxis';
  const merchantName = 'Kumar Milk Distributors';
  
  // Safe amount formatting
  const safeAmount = amount && !isNaN(amount) ? parseFloat(amount) : 0;
  const formattedAmount = safeAmount.toFixed(2);
  
  // Generate UPI payment URL
  const generateUpiUrl = () => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: merchantName,
      am: formattedAmount,
      cu: 'INR',
      tn: `Order #${orderId} - Kumar Milk Distributors`
    });
    return `upi://pay?${params.toString()}`;
  };

  const handlePayNowPress = async () => {
    try {
      const upiUrl = generateUpiUrl();
      const supported = await Linking.canOpenURL(upiUrl);
      
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        // Fallback to Google Pay app
        const gpayUrl = `tez://upi/pay?${new URLSearchParams({
          pa: upiId,
          pn: merchantName,
          am: formattedAmount,
          cu: 'INR',
          tn: `Order #${orderId}`
        })}`; 
        
        const gpaySupported = await Linking.canOpenURL(gpayUrl);
        if (gpaySupported) {
          await Linking.openURL(gpayUrl);
        } else {
          Alert.alert(
            'UPI App Required',
            'Please install Google Pay, PhonePe, or any UPI app to make payment',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error opening UPI app:', error);
      Alert.alert(
        'Error',
        'Unable to open payment app. Please try again or make manual payment.',
        [{ text: 'OK' }]
      );
    }
  };

  const copyUpiId = () => {
    // Note: Clipboard API might not be available in Expo Go
    Alert.alert(
      'UPI ID',
      upiId,
      [
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <Text style={styles.title}>Scan QR Code to Pay</Text>
        
        {/* Dynamic QR Code */}
        <View style={styles.qrCodeWrapper}>
          <View style={styles.qrCodeContainer}>
            <QRCode
              value={generateUpiUrl()}
              size={180}
              color="#000"
              backgroundColor="#fff"
              logo={null}
            />
          </View>
          <Text style={styles.qrLabel}>Scan to Pay ₹{formattedAmount}</Text>
        </View>

        <View style={styles.paymentDetails}>
          <Text style={styles.merchantName}>{merchantName}</Text>
          <Text style={styles.upiId}>UPI ID: {upiId}</Text>
          <Text style={styles.amount}>₹{formattedAmount}</Text>
        </View>

        <TouchableOpacity style={styles.payButton} onPress={handlePayNowPress}>
          <View style={styles.googlePayIcon}>
            <Ionicons name="card" size={24} color="#fff" />
          </View>
          <Text style={styles.payButtonText}>Pay with UPI Apps</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyButton} onPress={copyUpiId}>
          <Ionicons name="copy" size={16} color="#1a73e8" />
          <Text style={styles.copyButtonText}>Copy UPI ID</Text>
        </TouchableOpacity>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Payment Instructions:</Text>
          <Text style={styles.instructionText}>
            1. Scan the QR code with any UPI app{'\n'}
            2. Or tap "Pay with UPI Apps" button{'\n'}
            3. Complete the payment{'\n'}
            4. Take a screenshot of payment confirmation{'\n'}
            5. Upload the screenshot as payment proof
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.completeButton} 
          onPress={() => {
            Alert.alert(
              'Payment Completed?',
              'Please ensure you have completed the payment and have the transaction screenshot ready to upload as proof.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Yes, Completed', 
                  style: 'default', 
                  onPress: onPaymentComplete 
                }
              ]
            );
          }}
        >
          <Text style={styles.completeButtonText}>I've Completed Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '100%',
    maxWidth: 350,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrCodeWrapper: {
    marginBottom: 20,
    alignItems: 'center',
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    marginBottom: 12,
  },
  qrLabel: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paymentDetails: {
    alignItems: 'center',
    marginBottom: 24,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  upiId: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '600',
    marginBottom: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 12,
    gap: 8,
  },
  googlePayIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    gap: 6,
    marginBottom: 20,
  },
  copyButtonText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  completeButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GooglePayQR;