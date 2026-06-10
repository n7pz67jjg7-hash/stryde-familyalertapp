import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.stryde',
  appName: 'STRYDE',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    Geolocation: {
      // Android: declared in AndroidManifest.xml
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#2563eb',
    },
  },
};

export default config;
