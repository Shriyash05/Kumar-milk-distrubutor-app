import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideAnim, onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <LinearGradient
        colors={Colors.gradients.kumar}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={require('../../assets/kumar_milk_logo.png')} // your logo image
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Company Name & Tagline */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.companyName}>KUMAR MILK</Text>
            <Text style={styles.subtitle}>DISTRIBUTORS</Text>
            <View style={styles.taglineContainer}>
              <View style={styles.taglineDot} />
              <Text style={styles.tagline}>Fresh</Text>
              <View style={styles.taglineDot} />
              <Text style={styles.tagline}>Pure</Text>
              <View style={styles.taglineDot} />
              <Text style={styles.tagline}>Delivered Daily</Text>
              <View style={styles.taglineDot} />
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },

  logoContainer: { alignItems: 'center', marginBottom: 60 },
  logoImage: { width: 160, height: 160 }, // adjust as needed

  textContainer: { alignItems: 'center', marginBottom: 80 },
  companyName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
  },
  taglineContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginHorizontal: 8, fontWeight: '500' },
  taglineDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)', marginHorizontal: 4 },
});

export default SplashScreen;
