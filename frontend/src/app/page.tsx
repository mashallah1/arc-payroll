// @ts-nocheck
export const dynamic = "force-dynamic";
// @ts-nocheck
"use client";

import { Nav } from "@/components/Nav";
import { useReadContract, useReadContracts, useAccount } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI, PAYROLL_ABI, formatUSDC, shortAddr, secondsToParts } from "@/lib/contracts";
import { useState, useEffect } from "react";
import Link from "next/link";

interface PayrollSummary {
  address: `0x${string}`;
  label: string;
  owner: string;
  nextPayDate: bigint;
  secondsUntilPayday: bigint;
  isPaydayReady: boolean;
  paused: boolean;
  balance: bigint;
  required: bigint;
  isFunded: boolean;
  totalDisbursed: bigint;
  totalCyclesRun: bigint;
  activeRecipients: bigint;
}

function Countdown({ seconds }: { seconds: number }) {
  const [s, setS] = useState(seconds);
  useEffect(() => {
    setS(seconds);
    const t = setInterval(() => setS((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  if (s <= 0) return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9375rem", color: "var(--green)", fontWeight: 500 }}>
      Ready now
    </span>
  );

  const { d, h, m, s: sec } = secondsToParts(s);
  const parts = d > 0
    ? [[d, "days"], [h, "hrs"], [m, "min"]]
    : [[h, "hrs"], [m, "min"], [sec, "sec"]];

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
      {parts.map(([val, unit], i) => (
        <span key={String(unit)} style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          {i > 0 && <span style={{ color: "var(--border)", fontFamily: "var(--font-mono)" }}>:</span>}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", color: "var(--ink)", letterSpacing: "-0.03em" }}>
            {String(val).padStart(2, "0")}
          </span>
          <span style={{ fontSize: "0.625rem", color: "var(--ink-faint)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {unit}
          </span>
        </span>
      ))}
    </div>
  );
}

function PayrollCard({ payroll }: { payroll: PayrollSummary }) {
  const fundedPct = payroll.required > 0n
    ? Math.min(100, Number((payroll.balance * 100n) / payroll.required))
    : 0;

  return (
    <Link href={`/payroll/${payroll.address}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="card"
        style={{ cursor: "pointer", transition: "all 0.15s ease" }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--ink-faint)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 3 }}>
              {payroll.label}
            </div>
            <div className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
              {shortAddr(payroll.owner)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {payroll.paused ? (
              <span className="badge badge-neutral">Paused</span>
            ) : payroll.isPaydayReady ? (
              <span className="badge badge-green">
                <span className="badge-dot-pulse" />
                Ready
              </span>
            ) : (
              <span className="badge badge-neutral">Active</span>
            )}
            {!payroll.isFunded && !payroll.paused && (
              <span className="badge badge-amber">Underfunded</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
          {[
            ["Recipients", payroll.activeRecipients.toString()],
            ["Disbursed",  `${formatUSDC(payroll.totalDisbursed)} USDC`],
            ["Cycles",     payroll.totalCyclesRun.toString()],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <div className="label" style={{ marginBottom: 3 }}>{label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: "var(--ink)" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Funding */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span className="label">Funded</span>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
              {formatUSDC(payroll.balance)} / {formatUSDC(payroll.required)} USDC
            </span>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill ${fundedPct >= 100 ? "progress-fill-green" : fundedPct < 60 ? "progress-fill-amber" : ""}`}
              style={{ width: `${fundedPct}%` }}
            />
          </div>
        </div>

        {/* Payday */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: 14, borderTop: "1px solid var(--border-light)",
        }}>
          <span className="label">Next payday</span>
          {payroll.isPaydayReady ? (
            <span style={{ fontSize: "0.875rem", color: "var(--green)", fontWeight: 500 }}>
              Trigger now →
            </span>
          ) : (
            <Countdown seconds={Number(payroll.secondsUntilPayday)} />
          )}
        </div>
      </div>
    </Link>
  );
}

function FaucetBanner() {
  const { address, isConnected } = useAccount();
  const [dismissed, setDismissed] = useState(false);

  const { data: balance } = useReadContract({
    address: "0x3600000000000000000000000000000000000000",
    abi: [{
      name: "balanceOf", type: "function", stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    }],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (!isConnected || dismissed || (balance && balance > 0n)) return null;

  return (
    <div style={{ background: "var(--amber-light)", borderBottom: "1px solid #FDE68A" }}>
      <div className="container" style={{ padding: "10px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--amber)" }}>
            💧 You need testnet USDC to use Arc Payroll —{" "}
            <span style={{ fontWeight: 300 }}>free from Circle's faucet, 1 USDC/day.</span>
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
              className="btn btn-sm"
              style={{ background: "var(--amber)", color: "#fff", border: "none", borderRadius: "var(--r)" }}>
              Get testnet USDC →
            </a>
            <button className="btn btn-ghost btn-sm" onClick={() => setDismissed(true)}
              style={{ color: "var(--amber)", opacity: 0.6 }}>✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: allPayrolls, isLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getAllPayrolls",
  });

  const addresses = (allPayrolls as `0x${string}`[] | undefined) || [];

  const { data: summariesA } = useReadContracts({
    contracts: addresses.map(addr => ({ address: addr, abi: PAYROLL_ABI, functionName: "getSummaryA" as const })),
  });

  const { data: summariesB } = useReadContracts({
    contracts: addresses.map(addr => ({ address: addr, abi: PAYROLL_ABI, functionName: "getSummaryB" as const })),
  });

  const payrolls: PayrollSummary[] = addresses.map((addr, i) => {
    const a = summariesA?.[i]?.result as any;
    const b = summariesB?.[i]?.result as any;
    if (!a || !b) return null;
    return {
      address: addr,
      label: a[0], owner: a[1], payPeriod: a[2], nextPayDate: a[3],
      secondsUntilPayday: a[4], isPaydayReady: a[5], paused: a[6],
      balance: b[0], required: b[1], shortfall: b[2], isFunded: b[3],
      totalDisbursed: b[4], totalCyclesRun: b[5], activeRecipients: b[6],
    };
  }).filter(Boolean) as PayrollSummary[];

  const totalVol = payrolls.reduce((s, p) => s + Number(formatUSDC(p.totalDisbursed)), 0);
  const totalRecipients = payrolls.reduce((s, p) => s + Number(p.activeRecipients), 0);
  const readyPayrolls = payrolls.filter(p => p.isPaydayReady && !p.paused);
  const activePayrolls = payrolls.filter(p => !p.isPaydayReady && !p.paused);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Nav />
      <FaucetBanner />

      {/* Network stats bar */}
      {payrolls.length > 0 && (
        <div style={{ background: "var(--ink)", color: "var(--cream)", padding: "12px 0" }}>
          <div className="container">
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "center" }}>
              {[
                ["Payrolls",      addresses.length],
                ["Recipients",   totalRecipients],
                ["Vol. Disbursed", `${totalVol.toFixed(2)} USDC`],
                ["Ready",         readyPayrolls.length],
                ["Settlement",    "< 400ms"],
                ["Gas token",     "USDC"],
              ].map(([label, val]) => (
                <div key={String(label)} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span style={{ fontSize: "0.6875rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(245,240,232,0.4)", fontWeight: 500 }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9375rem", color: "var(--cream-light)" }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main>
        {/* Hero */}
        <section style={{ padding: "80px 0 64px", borderBottom: "1px solid var(--border-light)" }}>
          <div className="container">
            <div style={{ maxWidth: 600 }}>
              <div className="label" style={{ marginBottom: 20 }}>
                Arc Testnet · USDC-Native · Sub-second Settlement
              </div>
              <h1 style={{
                fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                fontWeight: 300,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                marginBottom: 20,
                color: "var(--ink)",
              }}>
                Payroll that pays{" "}
                <em style={{ color: "var(--ink-muted)", fontStyle: "italic" }}>itself.</em>
              </h1>
              <p style={{ fontSize: "1.125rem", color: "var(--ink-muted)", lineHeight: 1.65, fontWeight: 300, maxWidth: 480 }}>
                Trustless global payroll on Arc. Pay workers in Brazil, Mexico,
                and the Philippines in their local stablecoin — settled in under
                a second, triggered by anyone, controlled by no one.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
                <Link href="/dashboard" className="btn btn-primary btn-lg">
                  Create a payroll
                </Link>
                <a
                  href="https://testnet.arcscan.app/address/0x97d2230439a3d41d2a3ec8afd0aefc41aba02fcb"
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary btn-lg"
                >
                  View on ArcScan ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={{ background: "var(--cream-dark)", borderBottom: "1px solid var(--border-light)", padding: "0" }}>
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
              {[
                { n: "01", title: "Create a payroll", desc: "Set a pay schedule, add employees with their salary and preferred local currency." },
                { n: "02", title: "Deposit USDC escrow", desc: "Funds are locked in the contract. Employer cannot withdraw while payroll is pending." },
                { n: "03", title: "Anyone triggers payday", desc: "When the schedule is reached, any wallet triggers settlement. Arc confirms in < 400ms." },
              ].map((step, i, arr) => (
                <div key={step.n} style={{
                  padding: "36px 32px",
                  borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <div className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-faint)", marginBottom: 14, letterSpacing: "0.06em" }}>
                    {step.n}
                  </div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: 8 }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--ink-muted)", lineHeight: 1.6, fontWeight: 300 }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ready to disburse */}
        {readyPayrolls.length > 0 && (
          <section style={{ padding: "56px 0", borderBottom: "1px solid var(--border-light)" }}>
            <div className="container">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 500, letterSpacing: "-0.02em" }}>
                  Ready to disburse
                </h2>
                <span className="badge badge-green">
                  <span className="badge-dot-pulse" />
                  {readyPayrolls.length} ready
                </span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", marginBottom: 24 }}>
                Payday has arrived. Connect your wallet and trigger settlement — anyone can do it.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {readyPayrolls.map(p => <PayrollCard key={p.address} payroll={p} />)}
              </div>
            </div>
          </section>
        )}

        {/* All payrolls */}
        <section style={{ padding: "56px 0" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>
                  Active payrolls
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>
                  All payrolls running on Arc testnet
                </p>
              </div>
              <Link href="/dashboard" className="btn btn-secondary btn-sm">+ New payroll</Link>
            </div>

            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-muted)", padding: "48px 0" }}>
                <span className="spinner" />
                <span style={{ fontSize: "0.9375rem" }}>Loading from Arc testnet…</span>
              </div>
            ) : payrolls.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">◎</div>
                <div className="empty-title">No payrolls yet</div>
                <div className="empty-desc">
                  Be the first to create a payroll on Arc testnet.
                </div>
                <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 8 }}>
                  Create the first payroll
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {activePayrolls.map(p => <PayrollCard key={p.address} payroll={p} />)}
              </div>
            )}
          </div>
        </section>

        {/* Arc chain facts */}
        <section style={{ borderTop: "1px solid var(--border-light)", background: "var(--cream-dark)", padding: "48px 0 64px" }}>
          <div className="container">
            <div className="label" style={{ marginBottom: 28 }}>Why Arc</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
              {[
                { label: "Gas Token",   value: "USDC",           note: "No ETH needed anywhere" },
                { label: "Settlement",  value: "< 400ms",        note: "Sub-second finality" },
                { label: "Bridge",      value: "Native CCTP",    note: "Circle's cross-chain protocol" },
                { label: "EVM",         value: "Compatible",     note: "Standard Solidity" },
                { label: "Stablecoins", value: "BRLA MXNB PHPC", note: "Local currency payouts" },
                { label: "Privacy",     value: "Opt-in",         note: "Shielded settlements" },
              ].map(({ label, value, note }) => (
                <div key={label} style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
                  <div className="label" style={{ marginBottom: 6 }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: "var(--ink)", marginBottom: 4 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--ink-faint)" }}>{note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 0" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span className="mono" style={{ fontSize: "0.8125rem", color: "var(--ink-faint)" }}>
              arc/payroll · testnet
            </span>
            <div style={{ display: "flex", gap: 20 }}>
              <a href="https://testnet.arcscan.app/address/0x97d2230439a3d41d2a3ec8afd0aefc41aba02fcb"
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "0.8125rem", color: "var(--ink-faint)", textDecoration: "none" }}>
                Factory ↗
              </a>
              <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "0.8125rem", color: "var(--ink-faint)", textDecoration: "none" }}>
                USDC Faucet ↗
              </a>
              <a href="https://arc.network" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "0.8125rem", color: "var(--ink-faint)", textDecoration: "none" }}>
                Arc Network ↗
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
