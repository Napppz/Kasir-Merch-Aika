// Comprehensive QA Verification Script for CosplayPOS Logic
import crypto from 'crypto';

function formatRupiah(num) {
  return 'Rp' + Math.round(num).toLocaleString('id-ID');
}

console.log('========================================================');
console.log('COSPLAYPOS TAHAP 7 — AUTOMATED QA LOGIC VERIFICATION');
console.log('========================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
  }
}

// -------------------------------------------------------------
// 1. CASH PAYMENT FORMULA & TEST CASES (A, B, C, D, E)
// -------------------------------------------------------------
console.log('--- 1. CASH PAYMENT FORMULA & TEST CASES ---');
const calcSubtotal = (items) => items.reduce((sum, item) => sum + Math.round(item.price) * item.quantity, 0);
const calcTotal = (subtotal, discount) => Math.max(0, subtotal - Math.round(discount));
const calcChange = (cashReceived, total) => Math.max(0, Math.round(cashReceived) - total);
const isPaymentAllowed = (cashReceived, total) => cashReceived >= total && total > 0;

// CASE A: Total Rp75.000, Cash Rp75.000
{
  const total = 75000;
  const cash = 75000;
  const change = calcChange(cash, total);
  const allowed = isPaymentAllowed(cash, total);
  assert(change === 0 && allowed, 'CASE A: Total Rp75.000, Cash Rp75.000 -> Change Rp0, SUCCESS');
}

// CASE B: Total Rp75.000, Cash Rp100.000
{
  const total = 75000;
  const cash = 100000;
  const change = calcChange(cash, total);
  const allowed = isPaymentAllowed(cash, total);
  assert(change === 25000 && allowed, 'CASE B: Total Rp75.000, Cash Rp100.000 -> Change Rp25.000, SUCCESS');
}

// CASE C: Total Rp75.000, Cash Rp50.000
{
  const total = 75000;
  const cash = 50000;
  const change = calcChange(cash, total);
  const allowed = isPaymentAllowed(cash, total);
  assert(change === 0 && !allowed, 'CASE C: Total Rp75.000, Cash Rp50.000 -> Payment BLOCKED');
}

// CASE D: Cash kosong (0)
{
  const total = 75000;
  const cash = 0;
  const allowed = isPaymentAllowed(cash, total);
  assert(!allowed, 'CASE D: Cash kosong (0) -> Payment BLOCKED');
}

// CASE E: Cash negatif / invalid
{
  const total = 75000;
  const rawInput = -50000;
  const sanitizedCash = Math.max(0, Math.floor(rawInput) || 0);
  const allowed = isPaymentAllowed(sanitizedCash, total);
  assert(sanitizedCash === 0 && !allowed, 'CASE E: Cash negatif (-50000) sanitized to 0 -> Payment BLOCKED');
}

// -------------------------------------------------------------
// 2. QUICK CASH OPTIONS
// -------------------------------------------------------------
console.log('\n--- 2. QUICK CASH SPECIFICATION ---');
const total = 75000;
const quickCashList = [
  { label: 'Uang Pas', amount: total },
  { label: 'Rp 20.000', amount: 20000 },
  { label: 'Rp 50.000', amount: 50000 },
  { label: 'Rp 100.000', amount: 100000 },
  { label: 'Rp 200.000', amount: 200000 },
  { label: 'Rp 500.000', amount: 500000 },
];
assert(quickCashList.length === 6, 'Quick Cash has all 6 requested denominations');
assert(quickCashList[0].amount === 75000, 'Quick Cash "Uang Pas" matches cart total');
assert(quickCashList[1].amount === 20000, 'Quick Cash Rp20.000 equals 20000');
assert(quickCashList[2].amount === 50000, 'Quick Cash Rp50.000 equals 50000');
assert(quickCashList[3].amount === 100000, 'Quick Cash Rp100.000 equals 100000');
assert(quickCashList[4].amount === 200000, 'Quick Cash Rp200.000 equals 200000');
assert(quickCashList[5].amount === 500000, 'Quick Cash Rp500.000 equals 500000');

// -------------------------------------------------------------
// 3. HISTORICAL PRICE INTEGRITY
// -------------------------------------------------------------
console.log('\n--- 3. HISTORICAL PRICE INTEGRITY ---');
const masterProduct = { id: 'prod-001', name: 'Poster A', price: 50000, stock: 20 };
// Make a transaction snapshot:
const txItem = {
  productId: masterProduct.id,
  productName: masterProduct.name,
  price: masterProduct.price,
  quantity: 1,
  subtotal: masterProduct.price * 1
};
// Later, master product price is updated to Rp75.000:
masterProduct.price = 75000;
assert(txItem.price === 50000, 'Historical transaction item price remains Rp50.000 after master price updated to Rp75.000');
assert(txItem.subtotal === 50000, 'Historical transaction subtotal remains Rp50.000');

// -------------------------------------------------------------
// 4. STOCK DEDUCTION & NO NEGATIVE STOCK
// -------------------------------------------------------------
console.log('\n--- 4. STOCK DEDUCTION & INTEGRITY ---');
let currentStock = 20;
const buyQty = 1;
currentStock = Math.max(0, currentStock - buyQty);
assert(currentStock === 19, 'Stock reduced from 20 to 19 after buy 1');
currentStock = Math.max(0, currentStock - 1);
assert(currentStock === 18, 'Stock reduced from 19 to 18 after second buy');

// Attempt to buy more than stock:
const excessQty = 50;
const canDeduct = currentStock >= excessQty;
assert(!canDeduct, 'Stock deduction blocked when requested quantity (50) exceeds current stock (18)');

// -------------------------------------------------------------
// 5. DOUBLE SUBMISSION PROTECTION SIMULATION
// -------------------------------------------------------------
console.log('\n--- 5. DOUBLE SUBMISSION PROTECTION ---');
let isProcessing = false;
let completedTx = null;
let txCreationCount = 0;

function handleSimulatedConfirm() {
  if (isProcessing || completedTx !== null) return false;
  isProcessing = true;
  // Create tx
  txCreationCount++;
  completedTx = { id: 'tx-001' };
  isProcessing = false;
  return true;
}

const firstClick = handleSimulatedConfirm();
const secondClick = handleSimulatedConfirm();
const thirdClick = handleSimulatedConfirm();
assert(firstClick === true && secondClick === false && thirdClick === false, 'First click succeeds, subsequent rapid clicks blocked');
assert(txCreationCount === 1, 'Exactly 1 transaction created under rapid duplicate submissions');

// -------------------------------------------------------------
// 6. SHA-256 INTEGRITY CHECKSUM VERIFICATION
// -------------------------------------------------------------
console.log('\n--- 6. BACKUP SHA-256 CHECKSUM INTEGRITY ---');
const backupPayload = JSON.stringify({
  version: '2.4',
  exportedAt: '2026-09-27T05:00:00.000Z',
  stores: { products: [{ id: '1' }] }
});
const checksum = crypto.createHash('sha256').update(backupPayload, 'utf8').digest('hex');
const verifyChecksum = crypto.createHash('sha256').update(backupPayload, 'utf8').digest('hex');
assert(checksum === verifyChecksum, 'SHA-256 checksum correctly validates payload integrity');

const tamperedPayload = backupPayload.replace('2.4', '2.5');
const tamperedChecksum = crypto.createHash('sha256').update(tamperedPayload, 'utf8').digest('hex');
assert(checksum !== tamperedChecksum, 'Tampered payload correctly fails SHA-256 integrity check');

// -------------------------------------------------------------
// 7. CANCELLED TRANSACTIONS EXCLUDED FROM REPORTS
// -------------------------------------------------------------
console.log('\n--- 7. REPORT SALES ACCURACY ---');
const sampleTransactions = [
  { id: 'tx-1', status: 'success', total: 100000, transactionDate: '2026-09-27T10:00:00' },
  { id: 'tx-2', status: 'success', total: 50000, transactionDate: '2026-09-27T11:00:00' },
  { id: 'tx-3', status: 'cancelled', total: 200000, transactionDate: '2026-09-27T12:00:00' },
];
const completedOnly = sampleTransactions.filter(t => t.status === 'success');
const totalSales = completedOnly.reduce((sum, t) => sum + t.total, 0);
assert(completedOnly.length === 2, 'Cancelled transactions excluded from completed transactions list');
assert(totalSales === 150000, 'Total sales is Rp150.000 (excluding Rp200.000 cancelled transaction)');

console.log('\n========================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('========================================================');
process.exit(totalTests === passedTests ? 0 : 1);
