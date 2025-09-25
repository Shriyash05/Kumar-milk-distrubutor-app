// 📐 Modern Spacing & Sizing System
export const Spacing = {
  // Base spacing unit (8px system)
  base: 8,
  
  '5xl': 96,
  
  // Component-specific spacing
  component: {
    // Padding
    cardPadding: 16,
    screenPadding: 20,
    sectionPadding: 24,
    
    // Margins
    cardMargin: 12,
    sectionMargin: 16,
    elementMargin: 8,
    
    // Gaps
    smallGap: 8,
    mediumGap: 16,
    largeGap: 24,
  },
  
  // Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '3xl': 24,
    full: 9999,
  },
  
  // Sizes for icons, buttons, etc.
  size: {
    // Icons
    iconXS: 16,
    iconSM: 20,
    iconMD: 24,
    iconLG: 32,
    iconXL: 40,
    
    // Buttons
    buttonHeight: 48,
    buttonSmall: 36,
    buttonLarge: 56,
    
    // Touch targets
    touchTarget: 44,
    
    // Cards
    cardHeight: 120,
    productCard: 200,
    
    // Navigation
    tabHeight: 60,
    headerHeight: 56,
  },
  
  // Shadows
  shadow: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
    },
  },
};

export default Spacing;