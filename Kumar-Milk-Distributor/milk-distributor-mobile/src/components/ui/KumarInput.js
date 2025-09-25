import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';

// Modern Kumar Milk Input Component
const KumarInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  icon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  variant = 'default',
  size = 'medium',
  disabled = false,
  style,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureEntry, setIsSecureEntry] = useState(secureTextEntry);

  const containerStyles = [
    styles.container,
    styles[`${variant}Container`],
    error && styles.errorContainer,
    disabled && styles.disabledContainer,
    style,
  ];

  const inputWrapperStyles = [
    styles.inputWrapper,
    styles[`${size}InputWrapper`],
    isFocused && styles.focusedInputWrapper,
    error && styles.errorInputWrapper,
    disabled && styles.disabledInputWrapper,
  ];

  const textInputStyles = [
    styles.textInput,
    styles[`${size}TextInput`],
    inputStyle,
  ];

  const handleToggleSecure = () => {
    setIsSecureEntry(!isSecureEntry);
  };

  return (
    <View style={containerStyles}>
      {label && (
        <Text style={[
          styles.label,
          error && styles.errorLabel,
          disabled && styles.disabledLabel
        ]}>
          {label}
        </Text>
      )}
      
      <View style={inputWrapperStyles}>
        {icon && (
          <View style={styles.leftIcon}>
            <Ionicons 
              name={icon} 
              size={20} 
              color={error ? Colors.error : isFocused ? Colors.primary : Colors.textSecondary} 
            />
          </View>
        )}
        
        <TextInput
          style={textInputStyles}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          secureTextEntry={isSecureEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.rightIcon} 
            onPress={handleToggleSecure}
          >
            <Ionicons 
              name={isSecureEntry ? 'eye-off' : 'eye'} 
              size={20} 
              color={Colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity 
            style={styles.rightIcon} 
            onPress={onRightIconPress}
          >
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={Colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[
          styles.helperText,
          error && styles.errorText
        ]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Container Styles
  container: {
    marginBottom: 16,
  },
  
  defaultContainer: {
    // Base styling
  },
  
  primaryContainer: {
    // Add primary variant styling if needed
  },
  
  errorContainer: {
    // Error container styling
  },
  
  disabledContainer: {
    opacity: 0.6,
  },

  // Label Styles
  label: {
    ...Typography.textStyles.label,
    color: Colors.textPrimary,
    marginBottom: 8,
    fontWeight: '600',
  },
  
  errorLabel: {
    color: Colors.error,
  },
  
  disabledLabel: {
    color: Colors.textLight,
  },

  // Input Wrapper Styles
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  
  focusedInputWrapper: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.white,
  },
  
  errorInputWrapper: {
    borderColor: Colors.error,
    borderWidth: 2,
    backgroundColor: Colors.error + '05',
  },
  
  disabledInputWrapper: {
    backgroundColor: Colors.lightGray,
    borderColor: Colors.borderLight,
  },

  // Size Variants
  smallInputWrapper: {
    height: 40,
    paddingHorizontal: 12,
  },
  
  mediumInputWrapper: {
    height: 48,
    paddingHorizontal: 16,
  },
  
  largeInputWrapper: {
    height: 56,
    paddingHorizontal: 20,
  },

  // Text Input Styles
  textInput: {
    flex: 1,
    ...Typography.textStyles.body1,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  
  smallTextInput: {
    fontSize: 14,
  },
  
  mediumTextInput: {
    fontSize: 16,
  },
  
  largeTextInput: {
    fontSize: 18,
  },

  // Icon Styles
  leftIcon: {
    marginRight: 12,
  },
  
  rightIcon: {
    marginLeft: 12,
    padding: 4,
  },

  // Helper Text Styles
  helperText: {
    ...Typography.textStyles.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  
  errorText: {
    color: Colors.error,
  },
});

export default KumarInput;