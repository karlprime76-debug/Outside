import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.CAP_SERVER_URL !== undefined;

const config: CapacitorConfig = {
  appId: "com.outside.app",
  appName: "Outside",
  webDir: "public",
  server: {
    url: process.env.CAP_SERVER_URL || "https://outside-tau.vercel.app",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: "#08080C",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: "DARK",
      backgroundColor: "#08080C",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
