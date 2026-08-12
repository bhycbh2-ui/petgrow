import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "kr.co.petgrow.app",
  appName: "PetGrow",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
