import { ethers } from "ethers";
import "dotenv/config";

if (!process.env.SEPOLIA_RPC_URL) throw new Error("Missing SEPOLIA_RPC_URL");
if (!process.env.METAMASK_PRIVATE_KEY)
  throw new Error("Missing METAMASK_PRIVATE_KEY");
if (!process.env.CONTRACT_ADDRESS) throw new Error("Missing CONTRACT_ADDRESS");

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

const wallet = new ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, provider);

const abi = [
  "function storeRecord(bytes32 dateHash, bytes32 attendanceHash, bytes32 feedingHash)",
  "function verifyRecord(bytes32 dateHash, bytes32 attendanceHash, bytes32 feedingHash) view returns (bool)",
  "function getRecordMeta(bytes32 dateHash) view returns (uint256 timestamp, address recordedBy)",
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
