const rawApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.70.206.1:5000";
const rawExplorerBaseUrl =
  process.env.EXPO_PUBLIC_BLOCK_EXPLORER_BASE_URL ||
  "https://sepolia.etherscan.io";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");
export const BLOCK_EXPLORER_BASE_URL = rawExplorerBaseUrl.replace(/\/+$/, "");
