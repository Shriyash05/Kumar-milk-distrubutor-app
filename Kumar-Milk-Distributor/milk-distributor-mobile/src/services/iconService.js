import { MaterialIcons, MaterialCommunityIcons, Ionicons, FontAwesome, Feather } from '@expo/vector-icons';

class IconService {
  constructor() {
    this.iconMappings = {
      // Authentication & User
      'login': { family: MaterialIcons, name: 'login', size: 24 },
      'logout': { family: MaterialIcons, name: 'logout', size: 24 },
      'register': { family: MaterialIcons, name: 'person-add', size: 24 },
      'user': { family: MaterialIcons, name: 'person', size: 24 },
      'user-circle': { family: MaterialIcons, name: 'account-circle', size: 24 },
      'admin': { family: MaterialIcons, name: 'admin-panel-settings', size: 24 },
      'profile': { family: MaterialIcons, name: 'person', size: 24 },
      
      // Navigation
      'home': { family: MaterialIcons, name: 'home', size: 24 },
      'dashboard': { family: MaterialIcons, name: 'dashboard', size: 24 },
      'menu': { family: MaterialIcons, name: 'menu', size: 24 },
      'back': { family: MaterialIcons, name: 'arrow-back', size: 24 },
      'forward': { family: MaterialIcons, name: 'arrow-forward', size: 24 },
      'close': { family: MaterialIcons, name: 'close', size: 24 },
      'settings': { family: MaterialIcons, name: 'settings', size: 24 },
      
      // Products & Milk
      'milk': { family: MaterialCommunityIcons, name: 'bottle-wine', size: 24 },
      'milk-bottle': { family: MaterialCommunityIcons, name: 'bottle-wine-outline', size: 24 },
      'dairy': { family: MaterialCommunityIcons, name: 'cow', size: 24 },
      'products': { family: MaterialIcons, name: 'inventory', size: 24 },
      'catalog': { family: MaterialIcons, name: 'menu-book', size: 24 },
      'category': { family: MaterialIcons, name: 'category', size: 24 },
      'package': { family: MaterialIcons, name: 'local-shipping', size: 24 },
      
      // Orders & Shopping
      'orders': { family: MaterialIcons, name: 'shopping-bag', size: 24 },
      'cart': { family: MaterialIcons, name: 'shopping-cart', size: 24 },
      'cart-add': { family: MaterialIcons, name: 'add-shopping-cart', size: 24 },
      'order-history': { family: MaterialIcons, name: 'history', size: 24 },
      'delivery': { family: MaterialIcons, name: 'local-shipping', size: 24 },
      'delivery-truck': { family: MaterialCommunityIcons, name: 'truck-delivery', size: 24 },
      'pending': { family: MaterialIcons, name: 'pending', size: 24 },
      'delivered': { family: MaterialIcons, name: 'check-circle', size: 24 },
      'cancelled': { family: MaterialIcons, name: 'cancel', size: 24 },
      
      // Financial
      'payment': { family: MaterialIcons, name: 'payment', size: 24 },
      'money': { family: MaterialIcons, name: 'attach-money', size: 24 },
      'rupee': { family: FontAwesome, name: 'rupee', size: 20 },
      'wallet': { family: MaterialIcons, name: 'account-balance-wallet', size: 24 },
      'receipt': { family: MaterialIcons, name: 'receipt', size: 24 },
      'invoice': { family: MaterialIcons, name: 'description', size: 24 },
      
      // Communication & Contact
      'phone': { family: MaterialIcons, name: 'phone', size: 24 },
      'call': { family: MaterialIcons, name: 'call', size: 24 },
      'email': { family: MaterialIcons, name: 'email', size: 24 },
      'message': { family: MaterialIcons, name: 'message', size: 24 },
      'chat': { family: MaterialIcons, name: 'chat', size: 24 },
      'support': { family: MaterialIcons, name: 'support', size: 24 },
      'help': { family: MaterialIcons, name: 'help', size: 24 },
      
      // Location & Address
      'location': { family: MaterialIcons, name: 'location-on', size: 24 },
      'address': { family: MaterialIcons, name: 'place', size: 24 },
      'map': { family: MaterialIcons, name: 'map', size: 24 },
      'gps': { family: MaterialIcons, name: 'gps-fixed', size: 24 },
      'directions': { family: MaterialIcons, name: 'directions', size: 24 },
      
      // Actions & Controls
      'add': { family: MaterialIcons, name: 'add', size: 24 },
      'add-circle': { family: MaterialIcons, name: 'add-circle', size: 24 },
      'edit': { family: MaterialIcons, name: 'edit', size: 24 },
      'delete': { family: MaterialIcons, name: 'delete', size: 24 },
      'remove': { family: MaterialIcons, name: 'remove', size: 24 },
      'save': { family: MaterialIcons, name: 'save', size: 24 },
      'cancel': { family: MaterialIcons, name: 'cancel', size: 24 },
      'confirm': { family: MaterialIcons, name: 'check', size: 24 },
      'refresh': { family: MaterialIcons, name: 'refresh', size: 24 },
      'sync': { family: MaterialIcons, name: 'sync', size: 24 },
      'download': { family: MaterialIcons, name: 'download', size: 24 },
      'upload': { family: MaterialIcons, name: 'upload', size: 24 },
      
      // Status & Notifications
      'success': { family: MaterialIcons, name: 'check-circle', size: 24, color: '#4CAF50' },
      'error': { family: MaterialIcons, name: 'error', size: 24, color: '#F44336' },
      'warning': { family: MaterialIcons, name: 'warning', size: 24, color: '#FF9800' },
      'info': { family: MaterialIcons, name: 'info', size: 24, color: '#2196F3' },
      'notification': { family: MaterialIcons, name: 'notifications', size: 24 },
      'bell': { family: MaterialIcons, name: 'notifications', size: 24 },
      'alert': { family: MaterialIcons, name: 'notification-important', size: 24 },
      
      // Security
      'lock': { family: MaterialIcons, name: 'lock', size: 24 },
      'unlock': { family: MaterialIcons, name: 'lock-open', size: 24 },
      'security': { family: MaterialIcons, name: 'security', size: 24 },
      'shield': { family: MaterialIcons, name: 'shield', size: 24 },
      'privacy': { family: MaterialIcons, name: 'privacy-tip', size: 24 },
      'verified': { family: MaterialIcons, name: 'verified', size: 24, color: '#4CAF50' },
      
      // Time & Date
      'calendar': { family: MaterialIcons, name: 'calendar-today', size: 24 },
      'clock': { family: MaterialIcons, name: 'access-time', size: 24 },
      'schedule': { family: MaterialIcons, name: 'schedule', size: 24 },
      'timer': { family: MaterialIcons, name: 'timer', size: 24 },
      
      // Reports & Analytics
      'reports': { family: MaterialIcons, name: 'assessment', size: 24 },
      'analytics': { family: MaterialIcons, name: 'analytics', size: 24 },
      'chart': { family: MaterialIcons, name: 'bar-chart', size: 24 },
      'graph': { family: MaterialIcons, name: 'show-chart', size: 24 },
      'statistics': { family: MaterialIcons, name: 'pie-chart', size: 24 },
      
      // File & Document
      'file': { family: MaterialIcons, name: 'insert-drive-file', size: 24 },
      'document': { family: MaterialIcons, name: 'description', size: 24 },
      'pdf': { family: MaterialIcons, name: 'picture-as-pdf', size: 24 },
      'image': { family: MaterialIcons, name: 'image', size: 24 },
      'folder': { family: MaterialIcons, name: 'folder', size: 24 },
      
      // Visibility & Display
      'visible': { family: MaterialIcons, name: 'visibility', size: 24 },
      'hidden': { family: MaterialIcons, name: 'visibility-off', size: 24 },
      'show': { family: MaterialIcons, name: 'visibility', size: 24 },
      'hide': { family: MaterialIcons, name: 'visibility-off', size: 24 },
      
      // Quality & Rating
      'star': { family: MaterialIcons, name: 'star', size: 24, color: '#FFD700' },
      'star-outline': { family: MaterialIcons, name: 'star-border', size: 24 },
      'favorite': { family: MaterialIcons, name: 'favorite', size: 24, color: '#F44336' },
      'favorite-outline': { family: MaterialIcons, name: 'favorite-border', size: 24 },
      'quality': { family: MaterialIcons, name: 'high-quality', size: 24 },
      'premium': { family: MaterialIcons, name: 'workspace-premium', size: 24, color: '#FFD700' },
      
      // Network & Connection
      'wifi': { family: MaterialIcons, name: 'wifi', size: 24 },
      'offline': { family: MaterialIcons, name: 'wifi-off', size: 24 },
      'network': { family: MaterialIcons, name: 'network-check', size: 24 },
      'sync-disabled': { family: MaterialIcons, name: 'sync-disabled', size: 24 },
      
      // Filters & Sort
      'filter': { family: MaterialIcons, name: 'filter-list', size: 24 },
      'sort': { family: MaterialIcons, name: 'sort', size: 24 },
      'search': { family: MaterialIcons, name: 'search', size: 24 },
      'clear': { family: MaterialIcons, name: 'clear', size: 24 },
      
      // Social & Share
      'share': { family: MaterialIcons, name: 'share', size: 24 },
      'whatsapp': { family: MaterialCommunityIcons, name: 'whatsapp', size: 24, color: '#25D366' },
      'facebook': { family: MaterialCommunityIcons, name: 'facebook', size: 24, color: '#1877F2' },
      'instagram': { family: MaterialCommunityIcons, name: 'instagram', size: 24, color: '#E4405F' },
      
      // App Specific - Milk Business
      'cow': { family: MaterialCommunityIcons, name: 'cow', size: 24 },
      'farm': { family: MaterialCommunityIcons, name: 'barn', size: 24 },
      'fresh': { family: MaterialCommunityIcons, name: 'leaf', size: 24, color: '#4CAF50' },
      'organic': { family: MaterialCommunityIcons, name: 'sprout', size: 24, color: '#4CAF50' },
      'distributor': { family: MaterialCommunityIcons, name: 'truck-delivery', size: 24 },
      'subscription': { family: MaterialIcons, name: 'subscriptions', size: 24 },
      'recurring': { family: MaterialIcons, name: 'repeat', size: 24 },
      
      // Weather & Temperature
      'temperature': { family: MaterialCommunityIcons, name: 'thermometer', size: 24 },
      'cold': { family: MaterialCommunityIcons, name: 'snowflake', size: 24, color: '#2196F3' },
      'hot': { family: MaterialCommunityIcons, name: 'fire', size: 24, color: '#FF5722' },
      
      // Volume & Quantity
      'volume': { family: MaterialIcons, name: 'volume-up', size: 24 },
      'quantity': { family: MaterialCommunityIcons, name: 'counter', size: 24 },
      'liter': { family: MaterialCommunityIcons, name: 'cup-water', size: 24 },
      'ml': { family: MaterialCommunityIcons, name: 'eyedropper', size: 24 }
    };
    
    this.defaultColors = {
      primary: '#007AFF',
      secondary: '#5856D6',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#2196F3',
      dark: '#212529',
      light: '#F8F9FA',
      muted: '#6C757D'
    };
  }

  // Get icon component with all properties
  getIcon(iconName, customProps = {}) {
    const iconConfig = this.iconMappings[iconName];
    
    if (!iconConfig) {
      console.warn(`Icon "${iconName}" not found. Using default.`);
      return {
        family: MaterialIcons,
        name: 'help',
        size: 24,
        color: this.defaultColors.muted,
        ...customProps
      };
    }

    return {
      ...iconConfig,
      color: iconConfig.color || this.defaultColors.dark,
      ...customProps
    };
  }

  // Render icon component directly
  renderIcon(iconName, customProps = {}) {
    const iconConfig = this.getIcon(iconName, customProps);
    const IconComponent = iconConfig.family;
    
    return {
      component: IconComponent,
      props: {
        name: iconConfig.name,
        size: iconConfig.size,
        color: iconConfig.color,
        style: customProps.style || {}
      }
    };
  }

  // Get themed icons based on app theme
  getThemedIcon(iconName, theme = 'light', customProps = {}) {
    const baseIcon = this.getIcon(iconName, customProps);
    
    const themeColors = {
      light: {
        primary: this.defaultColors.dark,
        secondary: this.defaultColors.muted,
        background: this.defaultColors.light
      },
      dark: {
        primary: this.defaultColors.light,
        secondary: '#A0A0A0',
        background: this.defaultColors.dark
      }
    };
    
    if (!baseIcon.color || baseIcon.color === this.defaultColors.dark) {
      baseIcon.color = themeColors[theme].primary;
    }
    
    return baseIcon;
  }

  // Get status-specific icons with colors
  getStatusIcon(status, customProps = {}) {
    const statusMappings = {
      'pending': this.getIcon('pending', { color: this.defaultColors.warning, ...customProps }),
      'processing': this.getIcon('sync', { color: this.defaultColors.info, ...customProps }),
      'delivered': this.getIcon('delivered', { color: this.defaultColors.success, ...customProps }),
      'cancelled': this.getIcon('cancelled', { color: this.defaultColors.error, ...customProps }),
      'confirmed': this.getIcon('success', { color: this.defaultColors.success, ...customProps }),
      'failed': this.getIcon('error', { color: this.defaultColors.error, ...customProps }),
      'active': this.getIcon('success', { color: this.defaultColors.success, ...customProps }),
      'inactive': this.getIcon('remove', { color: this.defaultColors.muted, ...customProps })
    };
    
    return statusMappings[status] || this.getIcon('info', customProps);
  }

  // Get role-specific icons
  getRoleIcon(role, customProps = {}) {
    const roleMappings = {
      'admin': this.getIcon('admin', customProps),
      'customer': this.getIcon('user', customProps),
      'user': this.getIcon('user', customProps),
      'distributor': this.getIcon('distributor', customProps),
      'delivery': this.getIcon('delivery-truck', customProps)
    };
    
    return roleMappings[role] || this.getIcon('user', customProps);
  }

  // Get product category icons
  getCategoryIcon(category, customProps = {}) {
    const categoryMappings = {
      'milk': this.getIcon('milk', customProps),
      'dairy': this.getIcon('dairy', customProps),
      'organic': this.getIcon('organic', customProps),
      'fresh': this.getIcon('fresh', customProps),
      'premium': this.getIcon('premium', customProps),
      'regular': this.getIcon('milk-bottle', customProps)
    };
    
    return categoryMappings[category.toLowerCase()] || this.getIcon('products', customProps);
  }

  // Get navigation tab icons
  getTabIcon(tabName, focused = false, customProps = {}) {
    const tabMappings = {
      'Home': focused ? this.getIcon('home', { color: this.defaultColors.primary, ...customProps }) : this.getIcon('home', customProps),
      'Orders': focused ? this.getIcon('orders', { color: this.defaultColors.primary, ...customProps }) : this.getIcon('orders', customProps),
      'Products': focused ? this.getIcon('products', { color: this.defaultColors.primary, ...customProps }) : this.getIcon('products', customProps),
      'Profile': focused ? this.getIcon('profile', { color: this.defaultColors.primary, ...customProps }) : this.getIcon('profile', customProps),
      'Dashboard': focused ? this.getIcon('dashboard', { color: this.defaultColors.primary, ...customProps }) : this.getIcon('dashboard', customProps),
      'Admin': focused ? this.getIcon('admin', { color: this.defaultColors.primary, ...customProps }) : this.getIcon('admin', customProps)
    };
    
    return tabMappings[tabName] || this.getIcon('home', customProps);
  }

  // Get all available icons (useful for development/testing)
  getAllIcons() {
    return Object.keys(this.iconMappings);
  }

  // Search icons by name
  searchIcons(searchTerm) {
    const term = searchTerm.toLowerCase();
    return Object.keys(this.iconMappings).filter(iconName => 
      iconName.toLowerCase().includes(term)
    );
  }

  // Utility to create icon style based on size
  getIconStyle(size = 'medium') {
    const sizeMap = {
      'small': { size: 16 },
      'medium': { size: 24 },
      'large': { size: 32 },
      'xlarge': { size: 48 }
    };
    
    return sizeMap[size] || sizeMap.medium;
  }

  // Create icon with badge (for notifications)
  getBadgedIcon(iconName, badgeCount = 0, customProps = {}) {
    const baseIcon = this.getIcon(iconName, customProps);
    return {
      ...baseIcon,
      badge: badgeCount > 0 ? {
        count: badgeCount,
        color: this.defaultColors.error,
        textColor: 'white',
        position: 'top-right'
      } : null
    };
  }
}

export default new IconService();