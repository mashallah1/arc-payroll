// @ts-nocheck
"use client";

import { Nav } from "@/components/Nav";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import {
  FACTORY_ADDRESS, FACTORY_ABI, PAYROLL_ABI, USDC_ABI, USDC_ADDRESS,
  formatUSDC, shortAddr, secondsToParts, CURRENCIES, PAY_PERIODS
} from "@/lib/contracts";
import { useState, useEffect } from "react";
import { parseUnits } from "viem";
import Link from "next/link";

// ─── CREATE PAYROLL MODAL ─────────────────────────────────────────────────────
function CreatePayrollModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [label, setLabel] = useState("");
  const [period, setPeriod] = useState(PAY_PERIODS[2]); // monthly default
  const [firstDate, setFirstDate] = useState("");
  const [step, setStep] = useState<"form" | "confirming" | "done">("form");

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) { setStep("done"); setTimeout(() => { onSuccess(); onClose(); }, 2000); }
  }, [isSuccess]);

  const handleCreate = () => {
    if (!label.trim() || !firstDate) return;
    const firstPayDate = BigInt(Math.floor(new Date(firstDate).getTime() / 1000));
    setStep("confirming");
    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "createPayroll",
      args: [BigInt(period.seconds), firstPayDate, label.trim()],
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create a payroll</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {step === "done" ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: "1rem", fontWeight: 500, color: "var(--green)" }}>
              Payroll created
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--ink-muted)", marginTop: 6 }}>
              Your payroll contract is deploying on Arc…
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="input-group">
                <label className="input-label">Payroll name</label>
                <input
                  className="input"
                  placeholder="e.g. Engineering Team, Contractors Q2"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  maxLength={64}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                  This name is permanent and stored onchain.
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Pay frequency</label>
                <select
                  className="input"
                  value={period.label}
                  onChange={e => setPeriod(PAY_PERIODS.find(p => p.label === e.target.value)!)}
                >
                  {PAY_PERIODS.map(p => (
                    <option key={p.label} value={p.label}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">First pay date</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={firstDate}
                  onChange={e => setFirstDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                  Anyone can trigger disbursement once this date is reached.
                </span>
              </div>

              {error && (
                <div className="alert alert-red" style={{ fontSize: "0.8125rem" }}>
                  {error.message?.slice(0, 120)}
                </div>
              )}

              <div style={{ padding: "14px", background: "var(--cream-dark)", borderRadius: "var(--r)", fontSize: "0.8125rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                This deploys a new smart contract owned by your wallet. You will need testnet USDC to pay gas and fund the payroll after creation.
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!label.trim() || !firstDate || isPending || step === "confirming"}
              >
                {isPending || step === "confirming" ? (
                  <><span className="spinner spinner-sm" /> Confirm in wallet</>
                ) : (
                  "Create payroll"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PAYROLL CARD (EMPLOYER VIEW) ─────────────────────────────────────────────
function EmployerPayrollCard({ address, onRefresh }: { address: `0x${string}`; onRefresh: () => void }) {
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);

  const { data: sumA } = useReadContract({ address, abi: PAYROLL_ABI, functionName: "getSummaryA" });
  const { data: sumB } = useReadContract({ address, abi: PAYROLL_ABI, functionName: "getSummaryB" });
  const { data: recipients } = useReadContract({ address, abi: PAYROLL_ABI, functionName: "getRecipients" });

  const a = sumA as any;
  const b = sumB as any;

  if (!a || !b) return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-muted)" }}>
      <span className="spinner" /> Loading…
    </div>
  );

  const label = a[0];
  const nextPayDate = Number(a[3]);
  const secondsLeft = Number(a[4]);
  const isReady = a[5];
  const paused = a[6];
  const balance = b[0] as bigint;
  const required = b[1] as bigint;
  const isFunded = b[3];
  const totalDisbursed = b[4] as bigint;
  const totalCyclesRun = Number(b[5]);
  const activeCount = Number(b[6]);

  const fundedPct = required > 0n ? Math.min(100, Number((balance * 100n) / required)) : 0;
  const { d, h, m } = secondsToParts(secondsLeft);
  const nextPayStr = new Date(nextPayDate * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: "1.125rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>
            {label}
          </div>
          <div className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
            {shortAddr(address)}
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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          ["Employees", activeCount],
          ["Disbursed", `${formatUSDC(totalDisbursed)} USDC`],
          ["Cycles", totalCyclesRun],
          ["Next payday", nextPayStr],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <div className="label" style={{ marginBottom: 3 }}>{label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9375rem", color: "var(--ink)" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Funding bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
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

      {/* Employee list */}
      {recipients && (recipients as any[]).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 10 }}>Employees</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--border-light)", borderRadius: "var(--r)" }}>
            {(recipients as any[]).filter(r => r.active).map((r, i, arr) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: i < arr.length - 1 ? "1px solid var(--border-light)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "1rem" }}>
                    {CURRENCIES[r.currencyCode]?.flag || "🌐"}
                  </span>
                  <div>
                    <div className="mono" style={{ fontSize: "0.8125rem", color: "var(--ink)" }}>
                      {shortAddr(r.wallet)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                      {r.currencyCode} · {CURRENCIES[r.currencyCode]?.name}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--ink)" }}>
                    {formatUSDC(r.usdcAmount, 0)} USDC
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                    per cycle
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 16, borderTop: "1px solid var(--border-light)" }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowAddEmployee(true)}>
          + Add employee
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowDeposit(true)}>
          Deposit USDC
        </button>
        <Link href={`/payroll/${address}`} className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}>
          Full view →
        </Link>
      </div>

      {/* Modals */}
      {showAddEmployee && (
        <AddEmployeeModal
          payrollAddress={address}
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => { setShowAddEmployee(false); onRefresh(); }}
        />
      )}
      {showDeposit && (
        <DepositModal
          payrollAddress={address}
          onClose={() => setShowDeposit(false)}
          onSuccess={() => { setShowDeposit(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── ADD EMPLOYEE MODAL ───────────────────────────────────────────────────────
function AddEmployeeModal({ payrollAddress, onClose, onSuccess }: {
  payrollAddress: `0x${string}`; onClose: () => void; onSuccess: () => void;
}) {
  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDC");

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => { if (isSuccess) { setTimeout(onSuccess, 1000); } }, [isSuccess]);

  const handleAdd = () => {
    if (!wallet || !amount) return;
    writeContract({
      address: payrollAddress,
      abi: PAYROLL_ABI,
      functionName: "addRecipientHuman",
      args: [wallet as `0x${string}`, BigInt(Math.floor(parseFloat(amount))), currency],
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add employee</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Employee wallet address</label>
            <input
              className="input input-mono"
              placeholder="0x..."
              value={wallet}
              onChange={e => setWallet(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Salary (USDC per cycle)</label>
              <input
                className="input"
                type="number"
                placeholder="100"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                Enter whole numbers — 100 = 100 USDC
              </span>
            </div>

            <div className="input-group">
              <label className="input-label">Preferred currency</label>
              <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
                {Object.entries(CURRENCIES).map(([code, { flag, name }]) => (
                  <option key={code} value={code}>{flag} {code} — {name}</option>
                ))}
              </select>
            </div>
          </div>

          {currency !== "USDC" && (
            <div className="alert alert-green" style={{ fontSize: "0.8125rem" }}>
              Employee receives USDC. Local equivalent in {currency} is calculated from live FX rates and shown in payment records.
            </div>
          )}

          {error && (
            <div className="alert alert-red" style={{ fontSize: "0.8125rem" }}>
              {error.message?.slice(0, 120)}
            </div>
          )}

          {isSuccess && (
            <div className="alert alert-green">Employee added successfully.</div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={!wallet || !amount || isPending}
          >
            {isPending ? <><span className="spinner spinner-sm" /> Confirm in wallet</> : "Add employee"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DEPOSIT MODAL ────────────────────────────────────────────────────────────
function DepositModal({ payrollAddress, onClose, onSuccess }: {
  payrollAddress: `0x${string}`; onClose: () => void; onSuccess: () => void;
}) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"approve" | "deposit" | "done">("approve");

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS, abi: USDC_ABI, functionName: "allowance",
    args: address ? [address, payrollAddress] : undefined,
    query: { enabled: !!address },
  });

  const { data: usdcBal } = useReadContract({
    address: USDC_ADDRESS, abi: USDC_ABI, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract: approve, data: approveHash, isPending: approvePending, error: approveError } = useWriteContract();
  const { writeContract: deposit, data: depositHash, isPending: depositPending, error: depositError } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: depositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  useEffect(() => { if (approveSuccess) setStep("deposit"); }, [approveSuccess]);
  useEffect(() => { if (depositSuccess) { setStep("done"); setTimeout(onSuccess, 1500); } }, [depositSuccess]);

  const amountBigInt = amount ? parseUnits(amount, 6) : 0n;
  const needsApproval = !allowance || (allowance as bigint) < amountBigInt;

  const handleApprove = () => {
    approve({
      address: USDC_ADDRESS, abi: USDC_ABI, functionName: "approve",
      args: [payrollAddress, amountBigInt],
    });
  };

  const handleDeposit = () => {
    deposit({
      address: payrollAddress, abi: PAYROLL_ABI, functionName: "deposit",
      args: [amountBigInt],
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Deposit USDC</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {step === "done" ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>✓</div>
            <div style={{ fontWeight: 500, color: "var(--green)" }}>Deposit confirmed</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {usdcBal !== undefined && (
                <div style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>
                  Wallet balance:{" "}
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
                    {formatUSDC(usdcBal as bigint)} USDC
                  </span>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Amount to deposit (USDC)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 500"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>

              {/* Step indicator */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {["Approve USDC", "Deposit"].map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {i > 0 && <div style={{ width: 24, height: 1, background: "var(--border)" }} />}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: (i === 0 && step === "approve") || (i === 1 && step === "deposit") ? "var(--ink)" : "var(--border)",
                        color: (i === 0 && step === "approve") || (i === 1 && step === "deposit") ? "var(--cream)" : "var(--ink-muted)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.6875rem", fontWeight: 600,
                      }}>
                        {(i === 0 && step === "deposit") || (i === 0 && step === "done") ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: "0.8125rem", color: "var(--ink-muted)" }}>{s}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "12px 14px", background: "var(--cream-dark)", borderRadius: "var(--r)", fontSize: "0.8125rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                Two transactions required: first approve USDC spending, then deposit into the payroll contract.
              </div>

              {(approveError || depositError) && (
                <div className="alert alert-red" style={{ fontSize: "0.8125rem" }}>
                  {(approveError || depositError)?.message?.slice(0, 120)}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              {step === "approve" ? (
                <button
                  className="btn btn-primary"
                  onClick={handleApprove}
                  disabled={!amount || parseFloat(amount) <= 0 || approvePending}
                >
                  {approvePending ? <><span className="spinner spinner-sm" /> Approving…</> : "Approve USDC"}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleDeposit}
                  disabled={depositPending}
                >
                  {depositPending ? <><span className="spinner spinner-sm" /> Depositing…</> : "Deposit"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { connect, connectors } = useConnect();
  const { address, isConnected, chain } = useAccount();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);

  const wrongNetwork = isConnected && chain?.id !== 5042002;

  // Employer's payrolls
  const { data: employerPayrolls, refetch } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getEmployerPayrolls",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Employee's payrolls
  const { data: employeePayrolls } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getEmployeePayrolls",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => { refetch(); }, [refreshKey]);

  const myPayrolls = (employerPayrolls as `0x${string}`[] | undefined) || [];
  const myEmployeePayrolls = (employeePayrolls as `0x${string}`[] | undefined) || [];

  return (
    <div style={{ minHeight: "100vh" }}>
      <Nav />

      <main>
        {/* Page header */}
        <div style={{ borderBottom: "1px solid var(--border-light)", padding: "40px 0 32px" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div className="label" style={{ marginBottom: 8 }}>Dashboard</div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 400, letterSpacing: "-0.03em", color: "var(--ink)" }}>
                  {isConnected ? "Your payrolls" : "Get started"}
                </h1>
                {isConnected && (
                  <div className="mono" style={{ fontSize: "0.8125rem", color: "var(--ink-faint)", marginTop: 4 }}>
                    {shortAddr(address!)} · Arc Testnet
                  </div>
                )}
              </div>
              {isConnected && !wrongNetwork && (
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  + Create payroll
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: "40px 24px" }}>

          {/* Not connected state */}
          {!isConnected && (
            <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 40 }}>
              <div className="card card-lg" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 16, opacity: 0.3 }}>◎</div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 10 }}>
                  Connect your wallet
                </h2>
                <p style={{ fontSize: "0.9375rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: 28, fontWeight: 300 }}>
                  Connect an EVM-compatible wallet to create payrolls, add employees,
                  and manage disbursements on Arc testnet.
                </p>
                <button className="btn btn-primary btn-lg" style={{ width: "100%" }}
                  onClick={() => {}}>
                  Connect wallet
                </button>
                <div style={{ marginTop: 16, fontSize: "0.8125rem", color: "var(--ink-faint)" }}>
                  Supports MetaMask, Coinbase Wallet, WalletConnect, and all EVM wallets
                </div>
              </div>

              {/* How it works */}
              <div style={{ marginTop: 40 }}>
                <div className="label" style={{ marginBottom: 20 }}>How it works</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    { n: "01", t: "Create a payroll", d: "Name it, set a pay schedule, and a first pay date." },
                    { n: "02", t: "Add employees", d: "Add wallet addresses with salary amounts and local currency preference." },
                    { n: "03", t: "Deposit USDC",  d: "Fund the contract. Your funds are locked — employees are guaranteed payment." },
                    { n: "04", t: "Payday runs itself", d: "Anyone triggers disbursement. Arc settles in under 400ms." },
                  ].map((step, i, arr) => (
                    <div key={step.n} style={{
                      display: "flex", gap: 16, padding: "18px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid var(--border-light)" : "none",
                    }}>
                      <div className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-faint)", minWidth: 24, paddingTop: 2 }}>
                        {step.n}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: 3 }}>{step.t}</div>
                        <div style={{ fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 300 }}>{step.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Wrong network */}
          {wrongNetwork && (
            <div className="alert alert-amber" style={{ maxWidth: 480, margin: "0 auto" }}>
              <span>⚠</span>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Wrong network</div>
                <div style={{ fontWeight: 300 }}>
                  Switch to Arc Testnet (Chain ID: 5042002) in your wallet to continue.
                </div>
              </div>
            </div>
          )}

          {/* Employer payrolls */}
          {isConnected && !wrongNetwork && (
            <>
              {myPayrolls.length === 0 ? (
                <div className="empty" style={{ paddingTop: 48 }}>
                  <div className="empty-icon">◎</div>
                  <div className="empty-title">No payrolls yet</div>
                  <div className="empty-desc">
                    Create your first payroll to start paying employees on Arc testnet.
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: 12 }}
                    onClick={() => setShowCreateModal(true)}>
                    Create your first payroll
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {myPayrolls.map(addr => (
                    <EmployerPayrollCard key={`${addr}-${refreshKey}`} address={addr} onRefresh={refresh} />
                  ))}
                </div>
              )}

              {/* Employee section */}
              {myEmployeePayrolls.length > 0 && (
                <div style={{ marginTop: 56 }}>
                  <hr className="divider" />
                  <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 4 }}>
                      Payrolls you're on
                    </h2>
                    <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>
                      You're registered as an employee on these payrolls.
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {myEmployeePayrolls.map(addr => (
                      <Link key={addr} href={`/payroll/${addr}`}
                        style={{ textDecoration: "none" }}>
                        <div className="card card-sm" style={{
                          display: "flex", justifyContent: "space-between",
                          alignItems: "center", cursor: "pointer",
                          transition: "border-color 0.15s ease",
                        }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--ink-faint)")}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                        >
                          <div className="mono" style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>
                            {shortAddr(addr)}
                          </div>
                          <span style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>View →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreatePayrollModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
