import {
  documentsRegistryContract,
  buildChildIdHash,
  buildDocumentsHash,
  hashFileBuffer,
  wallet,
  provider,
} from "../../blockchain/ethers";

// Track cumulative gas costs for document anchoring transactions.
let totalGasSpent = 0;
let totalTransactions = 0;
let startingBalance = 0;
const ZERO_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

function normalizeDocumentHash(
  value: string | null | undefined,
  label: string,
): string | null {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return null;
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
    throw new Error(`${label} hash is invalid.`);
  }

  return normalized.toLowerCase();
}

function getDocumentsRegistryErrorMessage(error: any): string {
  const errorName = String(
    error?.revert?.name || error?.errorName || error?.info?.errorName || "",
  ).trim();

  if (errorName === "NotAuthorized") {
    return "The configured wallet is not authorized to write to DocumentsRegistry.";
  }

  if (errorName === "InvalidInput") {
    return "DocumentsRegistry rejected the request because one or more hashes were invalid.";
  }

  return (
    error?.reason ||
    error?.shortMessage ||
    error?.info?.error?.message ||
    error?.message ||
    "Unknown error"
  );
}

export async function getWalletBalance() {
  const balance = await provider.getBalance(wallet.address);
  const balanceInEth = Number(balance) / 1e18;
  return {
    address: wallet.address,
    balance: balance.toString(),
    balanceInEth: balanceInEth.toFixed(6),
  };
}

export async function getGasComparison() {
  const currentBalance = await provider.getBalance(wallet.address);
  const currentBalanceInEth = Number(currentBalance) / 1e18;

  if (startingBalance === 0) {
    startingBalance = currentBalanceInEth;
  }

  return {
    startingBalance: startingBalance.toFixed(8),
    currentBalance: currentBalanceInEth.toFixed(8),
    totalGasSpent: totalGasSpent.toFixed(8),
    totalTransactions,
    spent: (startingBalance - currentBalanceInEth).toFixed(8),
  };
}

export async function storeChildDocumentHashes(
  studentId: string,
  birthCertificateHash?: string | null,
  parentIdHash?: string | null,
) {
  const safeStudentId = String(studentId || "").trim();
  if (!safeStudentId) {
    throw new Error("studentId is required for document anchoring.");
  }

  const normalizedBirthCertificateHash = normalizeDocumentHash(
    birthCertificateHash,
    "Birth certificate",
  );
  const normalizedParentIdHash = normalizeDocumentHash(
    parentIdHash,
    "Parent ID",
  );

  if (!normalizedBirthCertificateHash && !normalizedParentIdHash) {
    return null;
  }

  const childIdHash = buildChildIdHash(safeStudentId);
  const resolvedBirthCertificateHash =
    normalizedBirthCertificateHash || ZERO_HASH;
  const resolvedParentIdHash = normalizedParentIdHash || ZERO_HASH;
  const documentsHash = buildDocumentsHash(
    resolvedBirthCertificateHash,
    resolvedParentIdHash,
  );

  try {
    const tx = await documentsRegistryContract.storeDocumentsHash(
      childIdHash,
      documentsHash,
    );
    const receipt = await tx.wait();

    const gasUsed = receipt.gasUsed;
    const gasPrice = tx.gasPrice || receipt.gasPrice || 0n;
    const gasCost = gasUsed * gasPrice;
    const gasCostInEth = Number(gasCost) / 1e18;

    totalGasSpent += gasCostInEth;
    totalTransactions++;

    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      childIdHash,
      documentsHash,
      birthCertificateHash: resolvedBirthCertificateHash,
      parentIdHash: resolvedParentIdHash,
      gasUsed: gasUsed.toString(),
      gasPrice: gasPrice.toString(),
      gasCostInEth: gasCostInEth.toFixed(8),
    };
  } catch (error: any) {
    throw new Error(getDocumentsRegistryErrorMessage(error));
  }
}

export async function storeChildDocumentsHash(
  studentId: string,
  birthCertificateBuffer?: Buffer | null,
  parentIdBuffer?: Buffer | null,
) {
  const birthCertificateHash = birthCertificateBuffer?.length
    ? hashFileBuffer(birthCertificateBuffer as Buffer)
    : null;
  const parentIdHash = parentIdBuffer?.length
    ? hashFileBuffer(parentIdBuffer as Buffer)
    : null;

  return storeChildDocumentHashes(
    studentId,
    birthCertificateHash,
    parentIdHash,
  );
}
