import { ethers } from "ethers";
import "dotenv/config";

if (!process.env.SEPOLIA_RPC_URL) throw new Error("Missing SEPOLIA_RPC_URL");
if (!process.env.METAMASK_PRIVATE_KEY)
  throw new Error("Missing METAMASK_PRIVATE_KEY");

const getDocumentsRegistryAddress = (): string => {
  const resolvedAddress =
    process.env.DOCUMENTS_REGISTRY_ADDRESS || process.env.CONTRACT_ADDRESS;

  if (!resolvedAddress) {
    throw new Error(
      "Missing DOCUMENTS_REGISTRY_ADDRESS (or fallback CONTRACT_ADDRESS)",
    );
  }

  return resolvedAddress;
};

export const documentsRegistryAddress = getDocumentsRegistryAddress();
export const SEPOLIA_CHAIN_ID = 11155111;

const provider = new ethers.JsonRpcProvider(
  process.env.SEPOLIA_RPC_URL,
  undefined,
  {
    batchMaxCount: 1,
  },
);

const wallet = new ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, provider);

const abi = [
  "error NotAuthorized()",
  "error InvalidInput()",
  "function owner() view returns (address)",
  // Document storage
  "function storeDocumentsHash(bytes32 childIdHash, bytes32 documentsHash)",
  "function verifyDocuments(bytes32 childIdHash, bytes32 documentsHash) view returns (bool)",
  "function getDocumentsHash(bytes32 childIdHash) view returns (bytes32)",
];

export const documentsRegistryContract = new ethers.Contract(
  documentsRegistryAddress,
  abi,
  wallet,
);

export const attendanceContract = documentsRegistryContract;

export { wallet, provider, ethers };

export const buildChildIdHash = (childId: string) => {
  const normalizedChildId = String(childId || "").trim();
  if (!ethers.isHexString(`0x${normalizedChildId}`, 12)) {
    throw new Error("Child ID must be a valid MongoDB ObjectId.");
  }
  return ethers.id(`smartkidcare:child:${normalizedChildId.toLowerCase()}`);
};

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
