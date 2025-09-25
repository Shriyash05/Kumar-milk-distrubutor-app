const readline = require('readline');

const clearAuthTokens = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🧹 Auth Token Clearing Utility');
  console.log('================================');
  console.log();
  console.log('To clear auth tokens in your mobile app:');
  console.log();
  console.log('1. Add this code to your mobile app (temporary):');
  console.log();
  console.log('   import * as SecureStore from "expo-secure-store";');
  console.log('   import AsyncStorage from "@react-native-async-storage/async-storage";');
  console.log();
  console.log('   const clearAllTokens = async () => {');
  console.log('     try {');
  console.log('       // Clear SecureStore items');
  console.log('       await SecureStore.deleteItemAsync("userData");');
  console.log('       await SecureStore.deleteItemAsync("authToken");');
  console.log('       await SecureStore.deleteItemAsync("token");');
  console.log('       await SecureStore.deleteItemAsync("userRole");');
  console.log('       await SecureStore.deleteItemAsync("loginTimestamp");');
  console.log();
  console.log('       // Clear AsyncStorage items');
  console.log('       await AsyncStorage.removeItem("userData");');
  console.log('       await AsyncStorage.removeItem("authToken");');
  console.log('       await AsyncStorage.removeItem("token");');
  console.log('       await AsyncStorage.removeItem("userRole");');
  console.log('       await AsyncStorage.removeItem("pendingOrders");');
  console.log();
  console.log('       console.log("✅ All auth tokens cleared");');
  console.log('     } catch (error) {');
  console.log('       console.error("❌ Error clearing tokens:", error);');
  console.log('     }');
  console.log('   };');
  console.log();
  console.log('   clearAllTokens();');
  console.log();
  console.log('2. After clearing tokens, login with admin credentials:');
  console.log('   📧 Email: admin@kumarmilk.com');
  console.log('   🔑 Password: Admin@123');
  console.log();
  console.log('3. For API testing, use this token:');
  console.log('   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGM4MWM5NWRhYWVlNmJkZjg1NTg1MzMiLCJlbWFpbCI6ImFkbWluQGt1bWFybWlsay5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTg1NzE3ODIsImV4cCI6MTc2MTE2Mzc4Mn0.kt03f3Hgmew_V07UzOTaYExpXdcQ-D08kpno2y9jPaQ');
  console.log();

  rl.question('Press Enter to close...', () => {
    rl.close();
  });
};

clearAuthTokens();