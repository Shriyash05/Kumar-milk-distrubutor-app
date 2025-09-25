// 🎨 Modern Dairy Brand Theme System
import Colors from './colors';
import Typography from './typography';
import Spacing from './spacing';

export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  
  // Animation timings
  animation: {
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
  },
  
  // Breakpoints for responsive design
  breakpoints: {
    sm: 320,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  }
};


export default Theme;
export { Colors, Typography, Spacing };