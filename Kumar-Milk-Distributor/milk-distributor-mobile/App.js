import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './src/theme';

// Import screens
import LandingScreenNew from './src/screens/LandingScreenNew';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CustomerDashboardNew from './src/screens/CustomerDashboardNew';
import AdminDashboard from './src/screens/AdminDashboard';
import NewPlaceOrderScreen from './src/screens/NewPlaceOrderScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProductsScreenNew from './src/screens/ProductsScreenNew';
import HowToOrderScreen from './src/screens/HowToOrderScreen';
import MilkPricesScreen from './src/screens/MilkPricesScreen';
import AdminOrdersScreen from './src/screens/AdminOrdersScreen';
import AdminProductsScreenNew from './src/screens/AdminProductsScreenNew';
import AIReportsScreenNew from './src/screens/AIReportsScreenNew';
import AdminUsersScreen from './src/screens/AdminUsersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MyOrdersScreen from './src/screens/MyOrdersScreen';
import notificationService from './src/services/notificationService';
import SplashScreen from './src/components/SplashScreen';
import DevClearAuthScreen from './src/screens/DevClearAuthScreen';

import { SafeAreaProvider } from 'react-native-safe-area-context';
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack Navigator
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={CustomerDashboardNew} />
      <Stack.Screen name="PlaceOrder" component={NewPlaceOrderScreen} />
      <Stack.Screen name="HowToOrder" component={HowToOrderScreen} />
      <Stack.Screen name="MilkPrices" component={MilkPricesScreen} />
    </Stack.Navigator>
  );
}

// Orders Stack Navigator
function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersHome" component={MyOrdersScreen} />
    </Stack.Navigator>
  );
}

// Products Stack Navigator
function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsHome" component={ProductsScreenNew} />
      <Stack.Screen name="PlaceOrderFromProducts" component={NewPlaceOrderScreen} />
    </Stack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Customer Tab Navigator with nested stacks
function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Products" component={ProductsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// Admin Tab Navigator (Admin-only features)
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'AdminOrders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'AdminInventory') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'AdminReports') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'AdminUsers') {
            iconName = focused ? 'people' : 'people-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="AdminDashboard" 
        component={AdminDashboard}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="AdminOrders" 
        component={AdminOrdersScreen}
        options={{ title: 'Orders' }}
      />
      <Tab.Screen 
        name="AdminInventory" 
        component={AdminProductsScreenNew}
        options={{ title: 'Products' }}
      />
      <Tab.Screen 
        name="AdminReports" 
        component={AIReportsScreenNew}
        options={{ title: 'AI Reports' }}
      />
      <Tab.Screen 
        name="AdminUsers" 
        component={AdminUsersScreen}
        options={{ title: 'Users' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    // Initialize notifications on app start
    const initNotifications = async () => {
      const initialized = await notificationService.initialize();
      if (initialized) {
        console.log('Notifications initialized successfully');
        
        // Set up notification listeners
        notificationService.setupListeners(
          (notification) => {
            console.log('Notification received:', notification);
          },
          (response) => {
            console.log('Notification tapped:', response);
          }
        );
      }
    };
    
    initNotifications();
    
    // Cleanup on unmount
    return () => {
      notificationService.removeListeners();
    };
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={() => setIsLoading(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Landing" component={LandingScreenNew} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="CustomerMain" component={CustomerTabs} />
        <Stack.Screen name="AdminMain" component={AdminTabs} />
        {/* Dev/Debug screens */}
        <Stack.Screen name="DevClearAuth" component={DevClearAuthScreen} />
        {/* Admin screens are accessible through AdminTabs navigation */}
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
