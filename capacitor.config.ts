import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sparkvy.erp',
  appName: 'SparkVY',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
