import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "@/lib/wagmi";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// CRON_UPDATER_PRIVATE_KEY — wallet that pays gas to push rates on-chain
// CRON_SECRET              — optional, locks down the endpoint

const FACTORY_ADDRESS = (
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS ||
  "0x97d2230439a3d41d2a3ec8afd0aefc41aba02fcb"
) as `0x${string}`;

// ─── RATE FETCH ───────────────────────────────────────────────────────────────
// open.er-api.com: free, no API key, supports BRL + MXN + PHP
// Rate stored on-chain = 1_000_000 / localPerUSD

async function fetchLiveRates(): Promise<Record<string, bigint>> {
  const fallback: Record<string, number> = {
    BRL: 5.7,
    MXN: 17.2,
    PHP: 57.5,
  };

  let spot: Record<string, number> = {};

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.rates) {
        spot = { BRL: json.rates.BRL, MXN: json.rates.MXN, PHP: json.rates.PHP };
      }
    }
  } catch (err) {
    console.error("[FX] fetch failed, using fallback:", err);
  }

  const map: Record<string, string> = {
    BRLA: "BRL",
    MXNB: "MXN",
    PHPC: "PHP",
  };

  const rates: Record<string, bigint> = {};
  for (const [code, symbol] of Object.entries(map)) {
    const localPerUSD = spot[symbol] ?? fallback[symbol] ?? 1;
    rates[code] = BigInt(Math.round(1_000_000 / localPerUSD));
  }

  return rates;
}

// ─── ABIs ─────────────────────────────────────────────────────────────────────
const FACTORY_ABI = parseAbi([
  "function getAllPayrolls() view returns (address[])",
]);

const PAYROLL_ABI = parseAbi([
  "function updateFxRate(string currencyCode, uint256 rate) nonpayable",
]);

// ─── HANDLER ──────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("x-cron-secret") ??
    req.nextUrl.searchParams.get("secret");

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const privateKey = process.env.CRON_UPDATER_PRIVATE_KEY as
    | `0x${string}`
    | undefined;

  if (!privateKey) {
    return NextResponse.json(
      { error: "CRON_UPDATER_PRIVATE_KEY not set. Add it to .env.local and Vercel environment variables." },
      { status: 500 }
    );
  }

  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http("https://rpc.testnet.arc.network"),
  });

  const walletClient = createWalletClient({
    chain: arcTestnet,
    transport: http("https://rpc.testnet.arc.network"),
    account,
  });

  try {
    const rates = await fetchLiveRates();

    const payrolls = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "getAllPayrolls",
    });

    const updates: object[] = [];

    for (const payrollAddr of payrolls) {
      for (const [code, rate] of Object.entries(rates)) {
        try {
          const hash = await walletClient.writeContract({
            address: payrollAddr,
            abi: PAYROLL_ABI,
            functionName: "updateFxRate",
            args: [code, rate],
          });
          updates.push({ payroll: payrollAddr, code, rate: rate.toString(), hash });
        } catch (err: any) {
          updates.push({
            payroll: payrollAddr,
            code,
            error: err?.message?.slice(0, 100) ?? "unknown",
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      payrollCount: payrolls.length,
      rates: Object.fromEntries(Object.entries(rates).map(([k, v]) => [k, v.toString()])),
      updates,
    });
  } catch (err: any) {
    console.error("[FX cron] fatal:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Fatal error" }, { status: 500 });
  }
}
