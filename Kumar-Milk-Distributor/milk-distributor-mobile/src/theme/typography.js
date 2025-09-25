// 📝 Kumar Milk Distributors - Professional Typography System
export const Typography = {
  // Font Families - Clean & Professional
  fontFamily: {
    regular: 'System', // iOS: SF Pro Display, Android: Roboto
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    display: 'System', // For headings
    body: 'System', // For body text
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.6,
    loose: 2,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
  },
  
  // Text Styles (Common combinations)
  textStyles: {
    // Headers
    h1: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    
    // Body Text
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    
    // Captions & Labels
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.4,
      letterSpacing: 0.25,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.1,
    },
    
    // Buttons
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 0.1,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 0.1,
    },
    
    // Navigation
    navTitle: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 1.2,
      letterSpacing: 0.1,
    },
    
    // Cards
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    cardSubtitle: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    
    // Price & Numbers
    price: {
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: 0,
    },
    priceSmall: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 0,
    },
  }
};

export default Typography;