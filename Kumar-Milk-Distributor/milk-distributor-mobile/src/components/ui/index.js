// Kumar Milk Distributors - Modern UI Components
// Export all reusable UI components for consistent design

export { default as KumarCard } from './KumarCard';
export { default as KumarButton } from './KumarButton';
export { default as KumarInput } from './KumarInput';
export { default as KumarLoading } from './KumarLoading';
export { default as KumarSplashScreen } from './KumarSplashScreen';

// Usage Examples:
/*
import { KumarCard, KumarButton, KumarInput } from '../components/ui';

// Card Example
<KumarCard variant="elevated" onPress={handlePress}>
  <Text>Card Content</Text>
</KumarCard>

// Button Example
<KumarButton 
  title="Sign In" 
  variant="primary" 
  size="large"
  icon="log-in"
  onPress={handleLogin}
  loading={isLoading}
/>

// Input Example
<KumarInput
  label="Email Address"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter your email"
  icon="mail"
  error={emailError}
/>

// Loading Example
<KumarLoading 
  title="Kumar Milk"
  subtitle="Loading your fresh milk..."
  variant="branded"
  size="large"
/>

// Splash Screen Example
<KumarSplashScreen 
  onFinish={() => navigation.replace('Landing')}
  duration={3000}
/>
*/
