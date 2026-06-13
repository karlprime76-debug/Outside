import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.outside.app",
  appName: "Outside",
  webDir: "public",
  server: {
    // En dev : pointe vers le serveur Next.js local
    // En prod : charge l'app depuis Vercel
    url: process.env.CAP_SERVER_URL || "https://outside-tau.vercel.app",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
