const DEFAULT_API_BASE_URL = "https://smartkidcare.onrender.com";
const configuredApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
  
const rawApiBaseUrl =
  !__DEV__ && /^http:\/\//i.test(configuredApiBaseUrl)
    ? DEFAULT_API_BASE_URL
    : configuredApiBaseUrl;
const rawExplorerBaseUrl =
  process.env.EXPO_PUBLIC_BLOCK_EXPLORER_BASE_URL?.trim() ||
  "https://sepolia.etherscan.io";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");
export const BLOCK_EXPLORER_BASE_URL = rawExplorerBaseUrl.replace(/\/+$/, "");
