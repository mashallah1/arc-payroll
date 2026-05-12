// @ts-nocheck
"use client";

import { Nav } from "@/components/Nav";
import {
  useAccount, useReadContract, useWriteContract,
  useWaitForTransactionReceipt, usePublicClient,
} from "wagmi";
import {
  PAYROLL_ABI,
  formatUSDC, shortAddr, secondsToParts, CURRENCIES,
} from "@/lib/contracts";
import { arcTestnet } from "@/lib/wagmi";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── COUNTDOWN TIMER ──────────────────────────────────────────────────────────
function Countdown({ secondsLeft, isReady }: { secondsLeft: number; isReady: boolean }) {
  const [tick, setTick] = useState(secondsLeft);

  useEffect(() => {
    setTick(secondsLeft);
  }, [secondsLeft]);

  useEffect(() => {
    if (tick <= 0) return;
    const id = setInterval(() => setTick(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [tick]);

  if (isReady || tick === 0) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: "3rem", fontWeight: 300, letterSpacing: "-0.04em",
          color: "var(--green)", fontFamily: "var(--font-mono)",
        }}>
          Payday
        </div>
        <div style={{ fontSize: "0.875rem", color: "var(--ink-muted)", marginTop: 4 }}>
          Ready to disburse
        </div>
      </div>
    );
  }

  const { d, h, m, s } = secondsToParts(tick);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        display: "flex", gap: 4, alignItems: "flex-end", justifyContent: "center",
        fontFamily: "var(--font-mono)",
      }}>
        {d > 0 && (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", fontWeight: 300, letterSpacing: "-0.04em", color: "var(--ink)", lineHeight: 1 }}>{d}</div>
              <div style={{ fontSize: "0.6875rem", color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>days</div>
            </div>
            <div style={{ fontSize: "2rem", color: "var(--ink-faint)", marginBottom: 6, padding: "0 2px" }}>:</div>
          </>
        )}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 300, letterSpacing: "-0.04em", color: "var(--ink)", lineHeight: 1 }}>
            {String(h).padStart(2, "0")}
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>hrs</div>
        </div>
        <div style={{ fontSize: "2rem", color: "var(--ink-faint)", marginBottom: 6, padding: "0 2px" }}>:</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 300, letterSpacing: "-0.04em", color: "var(--ink)", lineHeight: 1 }}>
            {String(m).padStart(2, "0")}
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>min</div>
        </div>
        <div style={{ fontSize: "2rem", color: "var(--ink-faint)", marginBottom: 6, padding: "0 2px" }}>:</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 300, letterSpacing: "-0.04em", color: "var(--ink)", lineHeight: 1 }}>
            {String(s).padStart(2, "0")}
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>sec</div>
        </div>
      </div>
      <div style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", marginTop: 8 }}>
        until next payday
      </div>
    </div>
  );
}

// ─── DISBURSE BUTTON ──────────────────────────────────────────────────────────
function DisburseButton({
  payrollAddress, isReady, isFunded, onSuccess,
}: {
  payrollAddress: `0x${string}`;
  isReady: boolean;
  isFunded: boolean;
  onSuccess: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "pending" | "confirming" | "done">("idle");

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isPending) setPhase("pending");
    else if (isConfirming) setPhase("confirming");
    else if (isSuccess) {
      setPhase("done");
      setTimeout(() => { setPhase("idle"); reset(); onSuccess(); }, 3000);
    } else if (!hash) setPhase("idle");
  }, [isPending, isConfirming, isSuccess, hash]);

  const handleDisburse = () => {
    writeContract({
      address: payrollAddress,
      abi: PAYROLL_ABI,
      functionName: "disburse",
    });
  };

  const canDisburse = isReady && isFunded;

  if (phase === "done") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        padding: "24px 0",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "var(--green)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "1.5rem", color: "white",
          animation: "fadeIn 0.3s ease",
        }}>
          ✓
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 500, color: "var(--green)" }}>
          Disbursed on Arc
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
          Settled in under 400ms ⚡
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button
        onClick={handleDisburse}
        disabled={!canDisburse || phase !== "idle"}
        style={{
          width: "100%", padding: "16px 24px",
          background: canDisburse ? "var(--ink)" : "var(--border)",
          color: canDisburse ? "var(--cream)" : "var(--ink-muted)",
          border: "none", borderRadius: "var(--r)",
          fontSize: "1rem", fontWeight: 500, letterSpacing: "-0.01em",
          cursor: canDisburse && phase === "idle" ? "pointer" : "not-allowed",
          transition: "all 0.15s ease",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
        onMouseEnter={e => { if (canDisburse && phase === "idle") e.currentTarget.style.opacity = "0.85"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      >
        {phase === "pending" && <><span className="spinner spinner-sm" style={{ borderTopColor: "var(--cream)" }} /> Confirm in wallet…</>}
        {phase === "confirming" && <><span className="spinner spinner-sm" style={{ borderTopColor: "var(--cream)" }} /> Settling on Arc…</>}
        {phase === "idle" && (canDisburse ? "⚡ Trigger payday" : !isReady ? "Not yet payday" : "Needs funding first")}
      </button>

      {error && (
        <div className="alert alert-red" style={{ fontSize: "0.8125rem" }}>
          {error.message?.slice(0, 120)}
        </div>
      )}

      {!canDisburse && (
        <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)", textAlign: "center" }}>
          {!isReady && "Payday hasn't arrived yet — come back when the timer hits zero."}
          {isReady && !isFunded && "Fund the contract before disbursing."}
        </div>
      )}
    </div>
  );
}

// ─── PAYMENT HISTORY ──────────────────────────────────────────────────────────
function PaymentHistory({ payrollAddress }: { payrollAddress: `0x${string}` }) {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!publicClient) return;
    try {
      const logs = await publicClient.getLogs({
        address: payrollAddress,
        event: {
          name: "Disbursed",
          type: "event",
          inputs: [
            { name: "recipientId",     type: "uint256", indexed: true  },
            { name: "wallet",          type: "address", indexed: true  },
            { name: "usdcAmount",      type: "uint256", indexed: false },
            { name: "currencyCode",    type: "string",  indexed: false },
            { name: "localEquivalent", type: "uint256", indexed: false },
            { name: "fxRate",          type: "uint256", indexed: false },
            { name: "wasFallback",     type: "bool",    indexed: false },
            { name: "timestamp",       type: "uint256", indexed: false },
            { name: "triggeredBy",     type: "address", indexed: true  },
          ],
        },
        fromBlock: 0n,
      });
      setEvents(logs.reverse());
    } catch (e) {
      console.error("Error fetching logs:", e);
    } finally {
      setLoading(false);
    }
  }, [publicClient, payrollAddress]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-muted)", padding: "16px 0", fontSize: "0.875rem" }}>
        <span className="spinner" /> Loading payment history…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="empty" style={{ padding: "24px 0" }}>
        <div className="empty-icon" style={{ fontSize: "1.5rem" }}>◎</div>
        <div className="empty-desc">No disbursements yet</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--border-light)", borderRadius: "var(--r)", overflow: "hidden" }}>
      {events.map((log, i) => {
        const args = log.args as any;
        const ts = args.timestamp ? new Date(Number(args.timestamp) * 1000) : null;
        const currency = args.currencyCode || "USDC";
        const flag = CURRENCIES[currency]?.flag || "🌐";
        const usdcAmt = args.usdcAmount as bigint;
        const wasFallback = args.wasFallback;

        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", flexWrap: "wrap", gap: 8,
            borderBottom: i < events.length - 1 ? "1px solid var(--border-light)" : "none",
            background: i % 2 === 0 ? "transparent" : "var(--cream-dark)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1rem" }}>{flag}</span>
              <div>
                <div className="mono" style={{ fontSize: "0.8125rem", color: "var(--ink)" }}>
                  {args.wallet ? shortAddr(args.wallet) : "—"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                  {ts ? ts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  {wasFallback && (
                    <span style={{ marginLeft: 6, color: "var(--amber)" }}>· fallback rate</span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--ink)" }}>
                {formatUSDC(usdcAmt)} USDC
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                {currency}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── NETWORK SWITCH PROMPT ────────────────────────────────────────────────────
function WrongNetworkBanner() {
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");

  const handleSwitch = async () => {
    setSwitching(true);
    setError("");
    try {
      await (window as any).ethereum?.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: `0x${arcTestnet.id.toString(16)}`,
          chainName: arcTestnet.name,
          nativeCurrency: arcTestnet.nativeCurrency,
          rpcUrls: [arcTestnet.rpcUrls.default.http[0]],
          blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
        }],
      });
    } catch (e: any) {
      setError(e?.message || "Switch failed");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="alert alert-amber" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span>⚠</span>
        <div>
          <div style={{ fontWeight: 500, marginBottom: 2 }}>Wrong network</div>
          <div style={{ fontWeight: 300, fontSize: "0.875rem" }}>
            Switch to Arc Testnet (Chain ID: 5042002) to continue.
          </div>
          {error && <div style={{ color: "var(--red)", fontSize: "0.8125rem", marginTop: 4 }}>{error}</div>}
        </div>
      </div>
      <button
        className="btn btn-secondary btn-sm"
        onClick={handleSwitch}
        disabled={switching}
        style={{ whiteSpace: "nowrap" }}
      >
        {switching ? <><span className="spinner spinner-sm" /> Switching…</> : "Switch to Arc Testnet"}
      </button>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PayrollPage({ params }: { params: { address: string } }) {
  const payrollAddress = params.address as `0x${string}`;
  const { address: userAddress, isConnected, chain } = useAccount();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);

  const wrongNetwork = isConnected && chain?.id !== arcTestnet.id;

  const { data: sumA, refetch: refetchA } = useReadContract({
    address: payrollAddress,
    abi: PAYROLL_ABI,
    functionName: "getSummaryA",
  });

  const { data: sumB, refetch: refetchB } = useReadContract({
    address: payrollAddress,
    abi: PAYROLL_ABI,
    functionName: "getSummaryB",
  });

  const { data: recipients, refetch: refetchRecipients } = useReadContract({
    address: payrollAddress,
    abi: PAYROLL_ABI,
    functionName: "getRecipients",
  });

  const refetchAll = useCallback(() => {
    refetchA(); refetchB(); refetchRecipients();
    setRefreshKey(k => k + 1);
  }, [refetchA, refetchB, refetchRecipients]);

  useEffect(() => { refetchAll(); }, [refreshKey]);

  const a = sumA as any;
  const b = sumB as any;

  const isOwner = isConnected && userAddress && a && a[1]?.toLowerCase() === userAddress?.toLowerCase();

  // Derived values
  const label          = a?.[0] ?? "";
  const owner          = a?.[1] as `0x${string}` | undefined;
  const secondsLeft    = a ? Number(a[4]) : 0;
  const isReady        = a?.[5] ?? false;
  const paused         = a?.[6] ?? false;
  const balance        = b ? (b[0] as bigint) : 0n;
  const required       = b ? (b[1] as bigint) : 0n;
  const isFunded       = b?.[3] ?? false;
  const totalDisbursed = b ? (b[4] as bigint) : 0n;
  const totalCycles    = b ? Number(b[5]) : 0;
  const activeCount    = b ? Number(b[6]) : 0;

  const fundedPct = required > 0n ? Math.min(100, Number((balance * 100n) / required)) : 0;

  // Is the connected user an employee on this payroll?
  const myEntry = (recipients as any[] | undefined)?.find(
    r => r.wallet?.toLowerCase() === userAddress?.toLowerCase() && r.active
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      <Nav />

      <main>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border-light)", padding: "40px 0 32px" }}>
          <div className="container">
            <div style={{ marginBottom: 8 }}>
              <Link href="/dashboard" style={{
                fontSize: "0.8125rem", color: "var(--ink-muted)", textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-muted)")}
              >
                ← Dashboard
              </Link>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div className="label" style={{ marginBottom: 8 }}>Payroll</div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 400, letterSpacing: "-0.03em", color: "var(--ink)" }}>
                  {label || <span style={{ color: "var(--ink-faint)" }}>Loading…</span>}
                </h1>
                <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                  <div className="mono" style={{ fontSize: "0.8125rem", color: "var(--ink-faint)" }}>
                    {shortAddr(payrollAddress)}
                  </div>
                  {owner && (
                    <div style={{ fontSize: "0.8125rem", color: "var(--ink-faint)" }}>
                      · owner {shortAddr(owner)}
                      {isOwner && <span style={{ marginLeft: 4, color: "var(--ink-muted)" }}>(you)</span>}
                    </div>
                  )}
                  <a
                    href={`https://testnet.arcscan.app/address/${payrollAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.8125rem", color: "var(--ink-faint)", textDecoration: "underline" }}
                  >
                    View on ArcScan ↗
                  </a>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {paused ? (
                  <span className="badge badge-neutral">Paused</span>
                ) : isReady ? (
                  <span className="badge badge-green"><span className="badge-dot-pulse" />Payday ready</span>
                ) : (
                  <span className="badge badge-neutral">Active</span>
                )}
                {!isFunded && !paused && <span className="badge badge-amber">Underfunded</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: "40px 24px" }}>

          {/* Wrong network banner */}
          {wrongNetwork && (
            <div style={{ marginBottom: 24 }}>
              <WrongNetworkBanner />
            </div>
          )}

          {!a || !b ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-muted)", padding: "40px 0" }}>
              <span className="spinner" /> Loading payroll data…
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "start" }}>

              {/* LEFT COLUMN */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                {/* Stats */}
                <div className="card">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 24 }}>
                    {[
                      { label: "Employees", value: activeCount },
                      { label: "Total disbursed", value: `${formatUSDC(totalDisbursed)} USDC` },
                      { label: "Cycles completed", value: totalCycles },
                    ].map(({ label: lbl, value }) => (
                      <div key={lbl}>
                        <div className="label" style={{ marginBottom: 4 }}>{lbl}</div>
                        <div className="mono" style={{ fontSize: "1.125rem", color: "var(--ink)" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Funding bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span className="label">Funded</span>
                      <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                        {formatUSDC(balance)} / {formatUSDC(required)} USDC
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${fundedPct >= 100 ? "progress-fill-green" : fundedPct < 60 ? "progress-fill-amber" : ""}`}
                        style={{ width: `${fundedPct}%` }}
                      />
                    </div>
                    {!isFunded && required > 0n && (
                      <div style={{ fontSize: "0.75rem", color: "var(--amber)", marginTop: 4 }}>
                        ↑ {formatUSDC(required - balance)} USDC needed before payday
                      </div>
                    )}
                  </div>
                </div>

                {/* Employee list */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 500, letterSpacing: "-0.02em" }}>Employees</h2>
                  </div>
                  {!recipients || (recipients as any[]).filter(r => r.active).length === 0 ? (
                    <div className="empty" style={{ padding: "24px 0" }}>
                      <div className="empty-desc">No active employees on this payroll.</div>
                    </div>
                  ) : (
                    <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--r)", overflow: "hidden" }}>
                      {(recipients as any[]).filter(r => r.active).map((r, i, arr) => {
                        const currency = r.currencyCode;
                        const flag = CURRENCIES[currency]?.flag || "🌐";
                        const isMe = r.wallet?.toLowerCase() === userAddress?.toLowerCase();
                        return (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 16px",
                            borderBottom: i < arr.length - 1 ? "1px solid var(--border-light)" : "none",
                            background: isMe ? "color-mix(in srgb, var(--green) 6%, transparent)" : "transparent",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: "1rem" }}>{flag}</span>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span className="mono" style={{ fontSize: "0.8125rem", color: "var(--ink)" }}>
                                    {shortAddr(r.wallet)}
                                  </span>
                                  {isMe && (
                                    <span style={{
                                      fontSize: "0.6875rem", background: "var(--green)", color: "white",
                                      borderRadius: 4, padding: "1px 6px", fontWeight: 500,
                                    }}>you</span>
                                  )}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                                  {currency} · {CURRENCIES[currency]?.name || currency}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div className="mono" style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--ink)" }}>
                                {formatUSDC(r.usdcAmount, 0)} USDC
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>per cycle</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payment history */}
                <div>
                  <h2 style={{ fontSize: "1rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 14 }}>
                    Payment history
                  </h2>
                  <PaymentHistory key={refreshKey} payrollAddress={payrollAddress} />
                </div>
              </div>

              {/* RIGHT COLUMN — Countdown + Disburse */}
              <div style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Countdown card */}
                <div className="card" style={{ textAlign: "center", padding: "32px 24px" }}>
                  <Countdown secondsLeft={secondsLeft} isReady={isReady} />

                  <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border-light)" }}>
                    <DisburseButton
                      payrollAddress={payrollAddress}
                      isReady={isReady}
                      isFunded={isFunded}
                      onSuccess={refetchAll}
                    />
                  </div>
                </div>

                {/* My employee card (if viewer is on payroll) */}
                {myEntry && (
                  <div className="card card-sm" style={{ background: "color-mix(in srgb, var(--green) 5%, var(--cream))" }}>
                    <div className="label" style={{ marginBottom: 8 }}>Your salary</div>
                    <div className="mono" style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
                      {formatUSDC(myEntry.usdcAmount, 0)} USDC
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
                      per cycle · {myEntry.currencyCode}
                    </div>
                    <div style={{ marginTop: 10, fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
                      Total received:{" "}
                      <span className="mono" style={{ color: "var(--ink)" }}>
                        {formatUSDC(myEntry.totalReceived)} USDC
                      </span>
                    </div>
                  </div>
                )}

                {/* Arc info */}
                <div style={{
                  padding: "14px 16px", background: "var(--cream-dark)",
                  borderRadius: "var(--r)", fontSize: "0.8125rem",
                  color: "var(--ink-muted)", lineHeight: 1.5,
                }}>
                  <div style={{ fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
                    ⚡ Powered by Arc
                  </div>
                  Disbursements settle on Arc in under 400ms. Anyone can trigger payday once the timer expires.
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
