import {
  attendanceContract,
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

export async function storeChildDocumentsHash(
  studentId: string,
  birthCertificateBuffer?: Buffer | null,
  parentIdBuffer?: Buffer | null,
) {
  const safeStudentId = String(studentId || "").trim();
  if (!safeStudentId) {
    throw new Error("studentId is required for document anchoring.");
  }

  const hasBirthCertificate = Boolean(birthCertificateBuffer?.length);
  const hasParentId = Boolean(parentIdBuffer?.length);
  if (!hasBirthCertificate && !hasParentId) {
    return null;
  }

  const zeroHash =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const childIdHash = buildChildIdHash(safeStudentId);
  const birthCertificateHash = hasBirthCertificate
    ? hashFileBuffer(birthCertificateBuffer as Buffer)
    : zeroHash;
  const parentIdHash = hasParentId ? hashFileBuffer(parentIdBuffer as Buffer) : zeroHash;
  const documentsHash = buildDocumentsHash(birthCertificateHash, parentIdHash);

  try {
    const tx = await attendanceContract.storeDocumentsHash(
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
      birthCertificateHash,
      parentIdHash,
      gasUsed: gasUsed.toString(),
      gasPrice: gasPrice.toString(),
      gasCostInEth: gasCostInEth.toFixed(8),
    };
  } catch (error: any) {
    const reason =
      error?.reason ||
      error?.shortMessage ||
      error?.info?.error?.message ||
      error?.message ||
      "Unknown error";
    throw new Error(reason);
  }
}
