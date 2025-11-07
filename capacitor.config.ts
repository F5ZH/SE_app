import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vocabulary.app',
  appName: 'Vocabulary App',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
