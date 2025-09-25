// Date formatting utilities
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Currency formatting
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// Email validation
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Phone validation (Indian format)
export const validatePhone = (phone) => {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

// Password validation
export const validatePassword = (password) => {
  return password.length >= 8;
};

// Order status colors
export const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return '#4CAF50';
    case 'pending':
      return '#FF9800';
    case 'cancelled':
      return '#f44336';
    case 'processing':
      return '#2196F3';
    default:
      return '#666';
  }
};

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate order ID
export const generateOrderId = () => {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
};

// Calculate order total
export const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Format address for display
export const formatAddress = (address) => {
  if (typeof address === 'string') {
    return address;
  }
  
  const { street, city, state, pincode } = address;
  return `${street}, ${city}, ${state} - ${pincode}`;
};

// Get greeting based on time
export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good Morning';
  } else if (hour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

// Convert liters to different units
export const convertVolume = (liters, toUnit = 'ml') => {
  switch (toUnit) {
    case 'ml':
      return liters * 1000;
    case 'gallons':
      return liters * 0.264172;
    default:
      return liters;
  }
};

// Error message formatter
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Check if app is running in development
export const isDevelopment = () => {
  return __DEV__;
};

// Simple logger for debugging
export const logger = {
  log: (message, data = null) => {
    if (isDevelopment()) {
      console.log(`[LOG] ${message}`, data);
    }
  },
  error: (message, error = null) => {
    if (isDevelopment()) {
      console.error(`[ERROR] ${message}`, error);
    }
  },
  warn: (message, data = null) => {
    if (isDevelopment()) {
      console.warn(`[WARN] ${message}`, data);
    }
  },
};