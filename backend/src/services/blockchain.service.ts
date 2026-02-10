import { attendanceContract, buildDateHash, hashData, wallet, provider } from "../blockchain/ethers";

// Track cumulative gas costs during runtime
let totalGasSpent = 0;
let totalTransactions = 0;
let startingBalance = 0;

export async function getWalletBalance() {
  const balance = await provider.getBalance(wallet.address);
  const balanceInEth = Number(balance) / 1e18;
  return {
    address: wallet.address,
    balance: balance.toString(),
    balanceInEth: balanceInEth.toFixed(6)
  };
}

export async function getGasComparison() {
  const currentBalance = await provider.getBalance(wallet.address);
  const currentBalanceInEth = Number(currentBalance) / 1e18;
  
  // Initialize starting balance if not set
  if (startingBalance === 0) {
    startingBalance = currentBalanceInEth;
  }

  return {
    startingBalance: startingBalance.toFixed(8),
    currentBalance: currentBalanceInEth.toFixed(8),
    totalGasSpent: totalGasSpent.toFixed(8),
    totalTransactions,
    spent: (startingBalance - currentBalanceInEth).toFixed(8)
  };
}

export async function storeDailyRecord(
  childId: string,
  date: string,
  attendanceData: unknown,
  feedingData: unknown
) {
  const dateHash = buildDateHash(childId, date);
  const attendanceHash = hashData(attendanceData);
  const feedingHash = hashData(feedingData);

  console.log('\n[Blockchain Record]');
  console.log('Child ID:', childId);
  console.log('Date:', date);
  console.log('Date Hash:', dateHash);
  console.log('Attendance Hash:', attendanceHash);
  console.log('Feeding Hash:', feedingHash);

  const tx = await attendanceContract.storeRecord(
    dateHash,
    attendanceHash,
    feedingHash
  );

  const receipt = await tx.wait();

  // Calculate gas used
  const gasUsed = receipt.gasUsed;
  const gasPrice = tx.gasPrice || receipt.gasPrice || 0n;
  const gasCost = gasUsed * gasPrice;
  const gasCostInEth = Number(gasCost) / 1e18;

  // Track cumulative costs
  totalGasSpent += gasCostInEth;
  totalTransactions++;

  console.log('Transaction Hash:', tx.hash);

  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    dateHash,
    attendanceHash,
    feedingHash,
    gasUsed: gasUsed.toString(),
    gasPrice: gasPrice.toString(),
    gasCostInEth: gasCostInEth.toFixed(8)
  };
}

export async function verifyDailyRecord(
  childId: string,
  date: string,
  attendanceHash: string,
  feedingHash: string
) {
  const dateHash = buildDateHash(childId, date);

  const isValid = await attendanceContract.verifyRecord(
    dateHash,
    attendanceHash,
    feedingHash
  );

  return { isValid, dateHash };
}

export async function getRecordMeta(
  childId: string,
  date: string
) {
  const dateHash = buildDateHash(childId, date);

  const [timestamp, recordedBy] =
    await attendanceContract.getRecordMeta(dateHash);

  return {
    dateHash,
    timestamp: Number(timestamp),
    recordedBy
  };
}
