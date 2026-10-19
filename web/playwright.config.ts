import { defineConfig, devices } from "@playwright/test";

const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smartkidcare_e2e";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4174",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run e2e:server",
      cwd: "../backend",
      url: "http://127.0.0.1:5011",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        MONGO_URI: mongoUri,
        PORT: "5011",
        NODE_ENV: "test",
        FRONTEND_URL: "http://127.0.0.1:4174",
        JWT_SECRET: "smartkidcare-e2e-jwt-secret-at-least-32-characters",
        CSRF_SECRET: "smartkidcare-e2e-csrf-secret-at-least-32-characters",
        BLOCKCHAIN_WORKER_ENABLED: "false",
        SEPOLIA_RPC_URL: "http://127.0.0.1:8545",
        METAMASK_PRIVATE_KEY:
          "0x0000000000000000000000000000000000000000000000000000000000000001",
        DOCUMENTS_REGISTRY_ADDRESS:
          "0x0000000000000000000000000000000000000001",
        DOCUMENT_ENCRYPTION_ACTIVE_KEY_ID: "e2e-key",
        DOCUMENT_ENCRYPTION_KEYS_JSON:
          '{"e2e-key":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="}',
      },
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4174",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_API_BASE_URL: "http://127.0.0.1:5011/api",
      },
    },
  ],
});
