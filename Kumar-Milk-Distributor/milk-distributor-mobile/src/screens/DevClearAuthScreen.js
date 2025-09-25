import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { clearAllAuthData, clearAuthAndReload } from '../utils/clearAuth';

const DevClearAuthScreen = ({ navigation }) => {
  const handleClearAuth = async () => {
    Alert.alert(
      "Clear Authentication",
      "This will clear all stored authentication data. You'll need to login again.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear Auth",
          style: "destructive",
          onPress: async () => {
            const success = await clearAllAuthData();
            if (success) {
              Alert.alert(
                "Success", 
                "Authentication data cleared. Please restart the app and login again.",
                [
                  {
                    text: "OK",
                    onPress: () => navigation.navigate('Login')
                  }
                ]
              );
            } else {
              Alert.alert("Error", "Failed to clear authentication data");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛠️ Development Tools</Text>
      
      <Text style={styles.subtitle}>Authentication Reset</Text>
      <Text style={styles.description}>
        Use this to clear all stored authentication tokens and data. 
        This helps resolve JWT signature errors and token issues.
      </Text>

      <TouchableOpacity 
        style={styles.clearButton} 
        onPress={handleClearAuth}
      >
        <Text style={styles.clearButtonText}>Clear All Auth Data</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        ⚠️ This is a development tool. You'll need to login again after clearing.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#555',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 30,
    textAlign: 'left',
  },
  clearButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DevClearAuthScreen;