import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cosplaypos.app',
  appName: 'CosplayPOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#070b14',
      overlaysWebView: false,
    },
  },
};

export default config;
