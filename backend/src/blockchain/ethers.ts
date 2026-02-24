import { ethers } from "ethers";
import "dotenv/config";

if (!process.env.SEPOLIA_RPC_URL) throw new Error("Missing SEPOLIA_RPC_URL");
if (!process.env.METAMASK_PRIVATE_KEY)
  throw new Error("Missing METAMASK_PRIVATE_KEY");
if (!process.env.CONTRACT_ADDRESS) throw new Error("Missing CONTRACT_ADDRESS");

const provider = new ethers.JsonRpcProvider(
  process.env.SEPOLIA_RPC_URL,
  undefined,
  {
    // Disable client-side batching to avoid bursty requests that trigger RPC 429.
    batchMaxCount: 1,
  },
);

const wallet = new ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, provider);
console.log("Active Wallet:", wallet.address);

const abi = [
  "function storeRecord(bytes32 dateHash, bytes32 attendanceHash, bytes32 feedingHash)",
  "function verifyRecord(bytes32 dateHash, bytes32 attendanceHash, bytes32 feedingHash) view returns (bool)",
];

export const attendanceContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  wallet,
);

export { wallet, provider };

export const buildDateHash = (childId: string, date: string) =>
  ethers.id(`${childId}|${date}`);

export const hashData = (data: unknown) => ethers.id(JSON.stringify(data));
