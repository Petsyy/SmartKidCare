import {
  attendanceContract,
  buildChildIdHash,
  buildChildRecordHash,
  buildRecordBatchHash,
  buildDateHash,
  buildDocumentsHash,
  hashAttendance,
  hashFeeding,
  hashFileBuffer,
  wallet,
  provider,
} from "../../blockchain/ethers";

// Track cumulative gas costs during runtime
let totalGasSpent = 0;
let totalTransactions = 0;
let startingBalance = 0;
const TX_LOOKUP_CACHE_TTL_MS = 10 * 60 * 1000;
const txLookupCache = new Map<
  string,
  { value: string | null; expiresAt: number }
>();
let txLookupQueue: Promise<void> = Promise.resolve();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRateLimitedError = (error: any): boolean => {
  if (!error) return false;
  const message = String(error?.message ?? "");
  if (message.includes("Too Many Requests")) return true;

  const value = error?.value;
  if (Array.isArray(value)) {
    return value.some(
      (v) =>
        String(v?.message ?? "").includes("Too Many Requests") ||
        Number(v?.code) === -32005,
    );
  }

  return Number(error?.code) === -32005;
};

async function withRpcRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      if (!isRateLimitedError(error) || attempt >= maxRetries) throw error;
      const delayMs =
        Math.min(4000, 250 * 2 ** attempt) + Math.floor(Math.random() * 150);
      await sleep(delayMs);
      attempt += 1;
    }
  }
}

async function enqueueTxLookup<T>(task: () => Promise<T>): Promise<T> {
  const previous = txLookupQueue;
  let release!: () => void;
  txLookupQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous.catch(() => undefined);
  try {
    return await task();
  } finally {
    release();
  }
}

async function findClosestBlockAtOrAfterTimestamp(
  timestampSeconds: number,
  fromBlock: number,
  toBlock: number,
): Promise<number | null> {
  let lo = fromBlock;
  let hi = toBlock;
  let answer: number | null = null;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const block = await withRpcRetry(() => provider.getBlock(mid));
    if (!block) break;
    const ts = Number(block.timestamp ?? 0);

    if (ts >= timestampSeconds) {
      answer = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  return answer;
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

export async function storeDailyRecord(
  childId: string,
  date: string,
  attendanceData: unknown,
  feedingData: unknown,
) {
  try {
    // Extract date string (YYYY-MM-DD)
    const dateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
    const dateHash = buildDateHash(dateStr);
    const batchHash = buildRecordBatchHash(dateStr, childId);
    
    // For compatibility endpoint: derive a deterministic root from attendance+feeding.
    const attendanceHash = hashAttendance(childId, typeof attendanceData === 'string' ? attendanceData : 'absent');
    const feedingHash = hashFeeding(childId, typeof feedingData === 'string' ? feedingData : 'missed');
    const rootHash = buildChildRecordHash(attendanceHash, feedingHash);

    console.log("\n==============================");
    console.log("📦 NEW BLOCKCHAIN RECORD");
    console.log("==============================");
    console.log("👤 Caller     :", wallet.address);
    console.log("🧒 Child ID   :", childId);
    console.log("📅 Date       :", date);
    console.log("🔐 Date Hash  :", dateHash);
    console.log("🧩 Batch Hash :", batchHash);
    console.log("📘 Attendance :", attendanceHash);
    console.log("🥣 Feeding    :", feedingHash);
    console.log("------------------------------");

    const tx = await attendanceContract.storeDailyRoot(
      batchHash,
      rootHash,
    );

    console.log("⏳ Sending transaction...");
    const receipt = await tx.wait();

    const gasUsed = receipt.gasUsed;
    const gasPrice = tx.gasPrice || receipt.gasPrice || 0n;
    const gasCost = gasUsed * gasPrice;
    const gasCostInEth = Number(gasCost) / 1e18;

    totalGasSpent += gasCostInEth;
    totalTransactions++;

    console.log("✅ TRANSACTION SUCCESS");
    console.log("🔗 Txn Hash :", tx.hash);
    console.log("⛽ Gas Used :", gasUsed.toString());
    console.log("💸 Gas Cost (ETH):", gasCostInEth.toFixed(8));
    console.log("==============================\n");

    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      dateHash,
      batchHash,
      rootHash,
      attendanceHash,
      feedingHash,
      gasUsed: gasUsed.toString(),
      gasPrice: gasPrice.toString(),
      gasCostInEth: gasCostInEth.toFixed(8),
    };
  } catch (error: any) {
    console.log("\n==============================");
    console.log("❌ SMART CONTRACT REVERTED");
    console.log("==============================");

    const reason =
      error?.reason ||
      error?.shortMessage ||
      error?.info?.error?.message ||
      error?.message ||
      "Unknown error";

    console.log("👤 Caller :", wallet.address);
    console.log("🛑 Reason :", reason);
    console.log("==============================\n");

    throw new Error(reason);
  }
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

  const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
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

export async function verifyDailyRecord(
  childId: string,
  date: string,
  attendanceHash: string,
  feedingHash: string,
) {
  // Extract date string (YYYY-MM-DD) for batch identification
  const dateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
  const dateHash = buildDateHash(dateStr);
  const batchHash = buildRecordBatchHash(dateStr, childId);

  const rootHash = buildChildRecordHash(attendanceHash, feedingHash);

  const isValid = await attendanceContract.verifyRoot(
    batchHash,
    rootHash,
  );

  return { isValid, dateHash, batchHash, rootHash };
}

export async function findTxForDateHash(
  dateHash: string,
  blocksToScan = 5000,
  recordedAtTimestamp?: number | null,
) {
  const cached = txLookupCache.get(dateHash);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  return enqueueTxLookup(async () => {
    const latest = await withRpcRetry(() => provider.getBlockNumber());
    const iface = attendanceContract.interface;
    const contractAddress = String(attendanceContract.address).toLowerCase();
    const maxScan = Math.max(1, Math.min(15000, Number(blocksToScan ?? 5000)));
    const globalFrom = Math.max(0, latest - maxScan);

    const scanRange = {
      from: globalFrom,
      to: latest,
    };

    if (recordedAtTimestamp && Number(recordedAtTimestamp) > 0) {
      const anchor = await findClosestBlockAtOrAfterTimestamp(
        Number(recordedAtTimestamp),
        globalFrom,
        latest,
      );

      if (anchor !== null) {
        // Transaction should be very near the on-chain record timestamp.
        scanRange.from = Math.max(globalFrom, anchor - 64);
        scanRange.to = Math.min(latest, anchor + 6);
      }
    }

    for (let b = scanRange.to; b >= scanRange.from; b--) {
      const block: any = await withRpcRetry(() =>
        provider.send("eth_getBlockByNumber", ["0x" + b.toString(16), true]),
      );

      if (!block || !block.transactions) continue;

      for (const tx of block.transactions) {
        if (!tx.to) continue;
        if (String(tx.to).toLowerCase() !== contractAddress) continue;
        try {
          const data = tx.input ?? tx.data ?? "0x";
          const value = tx.value ?? "0x0";
          const parsed = iface.parseTransaction({ data, value });
          if (parsed && parsed.name === "storeDailyRoot") {
            const argDateHash = parsed.args[0];
            if (String(argDateHash) === String(dateHash)) {
              const result = tx.hash as string;
              txLookupCache.set(dateHash, {
                value: result,
                expiresAt: Date.now() + TX_LOOKUP_CACHE_TTL_MS,
              });
              return result;
            }
          }
        } catch (_e) {}
      }

      if ((scanRange.to - b) % 25 === 0) {
        await sleep(80);
      }
    }

    txLookupCache.set(dateHash, {
      value: null,
      expiresAt: Date.now() + 90 * 1000,
    });
    return null;
  });
}
