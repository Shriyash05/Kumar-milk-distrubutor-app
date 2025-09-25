import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

// Modern Kumar Milk Button Component
const KumarButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}) => {
  const buttonStyles = [
    styles.baseButton,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    (loading || disabled) && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.baseButtonText,
    styles[`${variant}ButtonText`],
    styles[`${size}ButtonText`],
    (loading || disabled) && styles.disabledButtonText,
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={variant === 'primary' || variant === 'accent' ? Colors.white : Colors.primary} 
          />
          <Text style={[textStyles, styles.loadingText]}>Loading...</Text>
        </View>
      );
    }

    if (icon) {
      return (
        <View style={[styles.iconContainer, iconPosition === 'right' && styles.iconRight]}>
          {iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color={variant === 'primary' || variant === 'accent' ? Colors.white : Colors.primary}
              style={styles.iconLeft}
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color={variant === 'primary' || variant === 'accent' ? Colors.white : Colors.primary}
              style={styles.iconRightStyle}
            />
          )}
        </View>
      );
    }

    return <Text style={textStyles}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Base Button Styles
  baseButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Variant Styles
  primaryButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },

  accentButton: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },

  successButton: {
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOpacity: 0.3,
  },

  warningButton: {
    backgroundColor: Colors.warning,
    shadowColor: Colors.warning,
    shadowOpacity: 0.3,
  },

  errorButton: {
    backgroundColor: Colors.error,
    shadowColor: Colors.error,
    shadowOpacity: 0.3,
  },

  // Size Styles
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },

  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    minHeight: 56,
  },

  // Text Styles
  baseButtonText: {
    fontWeight: '600',
    textAlign: 'center',
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: 0.1,
    color: Colors.white,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: 0.1,
    color: Colors.primary,
  },

  accentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: 0.1,
    color: Colors.white,
  },

  ghostButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: 0.1,
    color: Colors.textPrimary,
  },

  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: 0.1,
    color: Colors.white,
  },

  warningButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: 0.1,
    color: Colors.white,
  },

  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: 0.1,
    color: Colors.white,
  },

  // Size Text Styles
  smallButtonText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 17,
    letterSpacing: 0.1,
  },

  mediumButtonText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: 0.1,
  },

  largeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.1,
  },

  // State Styles
  disabledButton: {
    opacity: 0.6,
    backgroundColor: Colors.lightGray,
    shadowOpacity: 0,
    elevation: 0,
  },

  disabledButtonText: {
    color: Colors.textLight,
  },

  // Icon & Loading Styles
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconRight: {
    flexDirection: 'row-reverse',
  },

  iconLeft: {
    marginRight: 8,
  },

  iconRightStyle: {
    marginLeft: 8,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginLeft: 8,
  },
});

export default KumarButton;