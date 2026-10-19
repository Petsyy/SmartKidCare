import { ethers } from "ethers";

export const getDocumentsRegistryAddress = (): string => {
  const resolvedAddress =
    process.env.DOCUMENTS_REGISTRY_ADDRESS || process.env.CONTRACT_ADDRESS;

  if (!resolvedAddress) {
    throw new Error(
      "Missing DOCUMENTS_REGISTRY_ADDRESS (or fallback CONTRACT_ADDRESS)",
    );
  }

  return resolvedAddress;
};

export const SEPOLIA_CHAIN_ID = 11155111;

const abi = [
  "error NotAuthorized()",
  "error InvalidInput()",
  "function owner() view returns (address)",
  // Document storage
  "function storeDocumentsHash(bytes32 childIdHash, bytes32 documentsHash)",
  "function verifyDocuments(bytes32 childIdHash, bytes32 documentsHash) view returns (bool)",
  "function getDocumentsHash(bytes32 childIdHash) view returns (bytes32)",
];

export type BlockchainRuntime = {
  documentsRegistryAddress: string;
  documentsRegistryContract: ethers.Contract;
  provider: ethers.JsonRpcProvider;
  wallet: ethers.Wallet;
};

let runtime: BlockchainRuntime | null = null;

export const getBlockchainRuntime = (): BlockchainRuntime => {
  if (runtime) return runtime;

  const rpcUrl = String(process.env.SEPOLIA_RPC_URL || "").trim();
  if (!rpcUrl) throw new Error("Missing SEPOLIA_RPC_URL");

  const privateKey = String(process.env.METAMASK_PRIVATE_KEY || "").trim();
  if (!privateKey) throw new Error("Missing METAMASK_PRIVATE_KEY");

  const documentsRegistryAddress = getDocumentsRegistryAddress();
  const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
    batchMaxCount: 1,
  });
  const wallet = new ethers.Wallet(privateKey, provider);
  const documentsRegistryContract = new ethers.Contract(
    documentsRegistryAddress,
    abi,
    wallet,
  );

  runtime = {
    documentsRegistryAddress,
    documentsRegistryContract,
    provider,
    wallet,
  };
  return runtime;
};

export { ethers };

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
