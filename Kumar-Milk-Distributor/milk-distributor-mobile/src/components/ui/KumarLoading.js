import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';

const { width } = Dimensions.get('window');

// Modern Kumar Milk Loading Component
const KumarLoading = ({
  title = "Kumar Milk",
  subtitle = "Loading...",
  variant = 'default',
  size = 'medium',
  showLogo = true,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Scale animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Rotate animation (continuous)
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    );
    rotateAnimation.start();

    return () => {
      rotateAnimation.stop();
    };
  }, [fadeAnim, scaleAnim, rotateAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const containerStyles = [
    styles.container,
    styles[`${variant}Container`],
    styles[`${size}Container`],
    style,
  ];

  const renderLogo = () => {
    if (!showLogo) return null;

    return (
      <Animated.View 
        style={[
          styles.logoContainer, 
          styles[`${size}LogoContainer`],
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={styles.milkCanContainer}>
          <Ionicons name="nutrition" size={size === 'small' ? 40 : size === 'large' ? 80 : 60} color={Colors.primary} />
          <View style={styles.estBadge}>
            <Text style={styles.estText}>EST</Text>
            <Text style={styles.yearText}>1999</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderSpinner = () => {
    if (variant === 'minimal') {
      return (
        <ActivityIndicator 
          size={size === 'small' ? 'small' : 'large'} 
          color={Colors.primary} 
        />
      );
    }

    return (
      <View style={styles.spinnerContainer}>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <View style={styles.customSpinner}>
            <View style={[styles.spinnerDot, styles.dot1]} />
            <View style={[styles.spinnerDot, styles.dot2]} />
            <View style={[styles.spinnerDot, styles.dot3]} />
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={containerStyles}>
      {renderLogo()}
      
      <Animated.View 
        style={[
          styles.contentContainer,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={[styles.title, styles[`${size}Title`]]}>{title}</Text>
        <Text style={[styles.subtitle, styles[`${size}Subtitle`]]}>{subtitle}</Text>
        
        <View style={styles.loadingIndicator}>
          {renderSpinner()}
        </View>
      </Animated.View>
      
      {variant === 'branded' && (
        <Animated.View 
          style={[
            styles.brandFooter,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.brandFooterText}>Trusted since 1999</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },

  defaultContainer: {
    backgroundColor: Colors.background,
  },

  brandedContainer: {
    backgroundColor: Colors.white,
  },

  modalContainer: {
    backgroundColor: Colors.modal,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },

  // Size Variants
  smallContainer: {
    paddingHorizontal: 16,
  },

  mediumContainer: {
    paddingHorizontal: 20,
  },

  largeContainer: {
    paddingHorizontal: 24,
  },

  // Logo Styles
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },

  smallLogoContainer: {
    marginBottom: 24,
  },

  mediumLogoContainer: {
    marginBottom: 32,
  },

  largeLogoContainer: {
    marginBottom: 40,
  },

  milkCanContainer: {
    position: 'relative',
    backgroundColor: Colors.white,
    borderRadius: 50,
    padding: 20,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  estBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },

  estText: {
    ...Typography.textStyles.caption,
    color: Colors.white,
    fontSize: 6,
    fontWeight: '600',
    lineHeight: 8,
  },

  yearText: {
    ...Typography.textStyles.caption,
    color: Colors.white,
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },

  // Content Styles
  contentContainer: {
    alignItems: 'center',
  },

  title: {
    ...Typography.textStyles.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },

  smallTitle: {
    ...Typography.textStyles.h4,
  },

  mediumTitle: {
    ...Typography.textStyles.h3,
  },

  largeTitle: {
    ...Typography.textStyles.h2,
  },

  subtitle: {
    ...Typography.textStyles.body1,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },

  smallSubtitle: {
    ...Typography.textStyles.body2,
  },

  mediumSubtitle: {
    ...Typography.textStyles.body1,
  },

  largeSubtitle: {
    ...Typography.textStyles.h5,
  },

  // Loading Indicator Styles
  loadingIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  customSpinner: {
    width: 40,
    height: 40,
    position: 'relative',
  },

  spinnerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  dot1: {
    top: 0,
    left: 16,
  },

  dot2: {
    top: 16,
    left: 32,
  },

  dot3: {
    top: 32,
    left: 16,
  },

  // Brand Footer
  brandFooter: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },

  brandFooterText: {
    ...Typography.textStyles.caption,
    color: Colors.textLight,
    textAlign: 'center',
  },
});

export default KumarLoading;