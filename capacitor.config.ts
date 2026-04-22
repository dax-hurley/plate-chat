import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env["CAP_SERVER_URL"];

const config: CapacitorConfig = {
  appId: "com.trainlog.app",
  appName: "Trainlog",
  webDir: "www",
};

if (serverUrl) {
  const isHttp = serverUrl.startsWith("http://");
  config.server = {
    url: serverUrl,
    ...(isHttp ? { cleartext: true } : {}),
  };
}

export default config;
