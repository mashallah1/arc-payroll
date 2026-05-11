// ─── ADDRESSES ───────────────────────────────────────────────────────────────

export const FACTORY_ADDRESS =
  (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ||
  "0x97d2230439a3d41d2a3ec8afd0aefc41aba02fcb") as `0x${string}`;

export const USDC_ADDRESS =
  (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0x3600000000000000000000000000000000000000") as `0x${string}`;

// ─── FACTORY ABI ─────────────────────────────────────────────────────────────

export const FACTORY_ABI = [
  // Write
  {
    name: "createPayroll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "payPeriodSeconds", type: "uint256" },
      { name: "firstPayDate",     type: "uint256" },
      { name: "label",            type: "string"  },
    ],
    outputs: [{ name: "payrollAddress", type: "address" }],
  },
  // Read
  {
    name: "getAllPayrolls",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "getEmployerPayrolls",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "employer", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "getEmployeePayrolls",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "employee", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "isValidPayroll",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "payroll", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "totalPayrolls",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Events
  {
    name: "PayrollCreated",
    type: "event",
    inputs: [
      { name: "employer",     type: "address", indexed: true  },
      { name: "payroll",      type: "address", indexed: true  },
      { name: "label",        type: "string",  indexed: false },
      { name: "payPeriod",    type: "uint256", indexed: false },
      { name: "firstPayDate", type: "uint256", indexed: false },
      { name: "timestamp",    type: "uint256", indexed: false },
    ],
  },
] as const;

// ─── PAYROLL ABI ──────────────────────────────────────────────────────────────

export const PAYROLL_ABI = [
  // Read
  {
    name: "getSummaryA",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "_label",             type: "string"  },
      { name: "_owner",             type: "address" },
      { name: "_payPeriod",         type: "uint256" },
      { name: "_nextPayDate",       type: "uint256" },
      { name: "_secondsUntilPayday",type: "uint256" },
      { name: "_isPaydayReady",     type: "bool"    },
      { name: "_paused",            type: "bool"    },
    ],
  },
  {
    name: "getSummaryB",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "_balance",         type: "uint256" },
      { name: "_required",        type: "uint256" },
      { name: "_shortfall",       type: "uint256" },
      { name: "_isFunded",        type: "bool"    },
      { name: "_totalDisbursed",  type: "uint256" },
      { name: "_totalCyclesRun",  type: "uint256" },
      { name: "_activeRecipients",type: "uint256" },
    ],
  },
  {
    name: "getRecipients",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "wallet",        type: "address" },
          { name: "usdcAmount",    type: "uint256" },
          { name: "currencyCode",  type: "string"  },
          { name: "active",        type: "bool"    },
          { name: "addedAt",       type: "uint256" },
          { name: "totalReceived", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getFxRate",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "currencyCode", type: "string" }],
    outputs: [
      { name: "rate",      type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "updatedBy", type: "address" },
    ],
  },
  {
    name: "isPaydayReady",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "factory",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "label",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  // Write
  {
    name: "disburse",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "addRecipientHuman",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "wallet",          type: "address" },
      { name: "wholeUsdcAmount", type: "uint256" },
      { name: "currencyCode",    type: "string"  },
    ],
    outputs: [],
  },
  {
    name: "removeRecipient",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    name: "updateFxRate",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "currencyCode", type: "string"  },
      { name: "rate",         type: "uint256" },
    ],
    outputs: [],
  },
  // Events
  {
    name: "Disbursed",
    type: "event",
    inputs: [
      { name: "recipientId",    type: "uint256", indexed: true  },
      { name: "wallet",         type: "address", indexed: true  },
      { name: "usdcAmount",     type: "uint256", indexed: false },
      { name: "currencyCode",   type: "string",  indexed: false },
      { name: "localEquivalent",type: "uint256", indexed: false },
      { name: "fxRate",         type: "uint256", indexed: false },
      { name: "wasFallback",    type: "bool",    indexed: false },
      { name: "timestamp",      type: "uint256", indexed: false },
      { name: "triggeredBy",    type: "address", indexed: true  },
    ],
  },
  {
    name: "DisbursementFailed",
    type: "event",
    inputs: [
      { name: "recipientId", type: "uint256", indexed: true  },
      { name: "wallet",      type: "address", indexed: true  },
      { name: "usdcAmount",  type: "uint256", indexed: false },
      { name: "reason",      type: "string",  indexed: false },
      { name: "timestamp",   type: "uint256", indexed: false },
    ],
  },
  {
    name: "PayCycleAdvanced",
    type: "event",
    inputs: [
      { name: "previousPayDate", type: "uint256", indexed: false },
      { name: "nextPayDate",     type: "uint256", indexed: false },
      { name: "cycleNumber",     type: "uint256", indexed: false },
      { name: "triggeredBy",     type: "address", indexed: false },
      { name: "timestamp",       type: "uint256", indexed: false },
    ],
  },
  {
    name: "RecipientAdded",
    type: "event",
    inputs: [
      { name: "id",           type: "uint256", indexed: true  },
      { name: "wallet",       type: "address", indexed: true  },
      { name: "usdcAmount",   type: "uint256", indexed: false },
      { name: "currencyCode", type: "string",  indexed: false },
      { name: "timestamp",    type: "uint256", indexed: false },
    ],
  },
] as const;

// ─── USDC ABI ─────────────────────────────────────────────────────────────────

export const USDC_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Format USDC amount from 6-decimal bigint to display string */
export function formatUSDC(amount: bigint, decimals = 2): string {
  return (Number(amount) / 1_000_000).toFixed(decimals);
}

/** Format local currency equivalent from contract (already scaled) */
export function formatLocal(amount: bigint, decimals = 2): string {
  return (Number(amount) / 100).toFixed(decimals);
}

/** Currency display config */
export const CURRENCIES: Record<string, { flag: string; name: string }> = {
  BRLA: { flag: "🇧🇷", name: "Brazilian Real" },
  MXNB: { flag: "🇲🇽", name: "Mexican Peso" },
  PHPC: { flag: "🇵🇭", name: "Philippine Peso" },
  USDC: { flag: "🇺🇸", name: "US Dollar" },
};

/** Pay period options for employer UI */
export const PAY_PERIODS = [
  { label: "Weekly",     seconds: 604800    },
  { label: "Bi-weekly",  seconds: 1209600   },
  { label: "Monthly",    seconds: 2592000   },
];

/** Truncate an address for display */
export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Format seconds into human readable countdown */
export function secondsToParts(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return { d, h, m, s };
}
