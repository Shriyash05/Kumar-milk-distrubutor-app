import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme';

// Modern Kumar Milk Card Component
const KumarCard = ({ 
  children, 
  style, 
  onPress, 
  variant = 'default', 
  disabled = false,
  ...props 
}) => {
  const cardStyles = [
    styles.baseCard,
    styles[`${variant}Card`],
    disabled && styles.disabledCard,
    style,
  ];

  if (onPress && !disabled) {
    return (
      <TouchableOpacity 
        style={[cardStyles, styles.touchableCard]} 
        onPress={onPress}
        activeOpacity={0.95}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  
  defaultCard: {
    // Base styling already applied
  },
  
  elevatedCard: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
    borderRadius: 20,
    padding: 20,
  },
  
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  
  primaryCard: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary + '20',
  },
  
  successCard: {
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success + '20',
  },
  
  warningCard: {
    backgroundColor: Colors.warning + '10',
    borderColor: Colors.warning + '20',
  },
  
  touchableCard: {
    // Add subtle press effect
  },
  
  disabledCard: {
    opacity: 0.6,
    backgroundColor: Colors.lightGray,
  },
});

export default KumarCard;