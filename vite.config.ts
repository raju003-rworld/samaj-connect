import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const clientEnv: Record<string, string | undefined> = {};
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith("REACT_APP_") || key === "NODE_ENV" || key === "DEV_AUTH_ENABLED") {
    clientEnv[key] = value;
  }
}
// Verified API key from https://samaj-connect-6ad91.firebaseapp.com/__/firebase/init.json
if (!clientEnv.REACT_APP_FIREBASE_API_KEY || clientEnv.REACT_APP_FIREBASE_API_KEY === "AIzaSyAbtSfHuagl-N8p0wU3-C5kX0CUseb_59jA") {
  clientEnv.REACT_APP_FIREBASE_API_KEY = "AIzaSyAbtSfHuagL-N8p0Uw3-C5kXOCusb_59jA";
}
if (!clientEnv.REACT_APP_FIREBASE_PROJECT_ID) {
  clientEnv.REACT_APP_FIREBASE_PROJECT_ID = "samaj-connect-6ad91";
}
if (!clientEnv.REACT_APP_FIREBASE_AUTH_DOMAIN) {
  clientEnv.REACT_APP_FIREBASE_AUTH_DOMAIN = "samaj-connect-6ad91.firebaseapp.com";
}

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": JSON.stringify(clientEnv),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
});
