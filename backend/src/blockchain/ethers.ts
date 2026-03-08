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
  // Document storage
  "function storeDocumentsHash(bytes32 childIdHash, bytes32 documentsHash)",
  "function verifyDocuments(bytes32 childIdHash, bytes32 documentsHash) view returns (bool)",
  "function getDocumentsHash(bytes32 childIdHash) view returns (bytes32)",
];

export const attendanceContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  wallet,
);

export { wallet, provider };

/**
 * Build dateHash from date only (batch identifier)
 * Example: dateHash = keccak256("2026-03-04")
 */
export const buildChildIdHash = (studentId: string) => ethers.id(studentId.trim());

export const hashFileBuffer = (buffer: Buffer): string => ethers.keccak256(buffer);

export const buildDocumentsHash = (
  birthCertificateHash: string,
  parentIdHash: string,
) =>
  ethers.keccak256(
    ethers.solidityPacked(
      ["bytes32", "bytes32"],
      [birthCertificateHash, parentIdHash],
    ),
  );

