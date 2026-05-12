"use client";

import Link from "next/link";
import { useAccount, useDisconnect, useBalance } from "wagmi";

import { shortAddr, USDC_ADDRESS } from "@/lib/contracts";
import { useState } from "react";

export function Nav() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS,
    query: { enabled: !!address },
  });

  const wrongNetwork = isConnected && chain?.id !== 5042002;

  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            <span className="nav-logo-mark">arc/payroll</span>
            <span className="nav-logo-sub">testnet</span>
          </Link>

          {/* Center links */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link href="/" className="btn btn-ghost btn-sm">
              Network
            </Link>
            <Link href="/dashboard" className="btn btn-ghost btn-sm">
              Dashboard
            </Link>
          </div>

          {/* Wallet */}
          <div className="nav-actions">
            {wrongNetwork && (
              <span className="badge badge-amber">
                <span className="badge-dot" />
                Wrong network
              </span>
            )}

            {!isConnected ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => open()}
              >
                Connect Wallet
              </button>
            ) : (
              <div style={{ position: "relative" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setMenuOpen((o) => !o)}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--green)",
                      flexShrink: 0,
                    }}
                  />
                  <span className="mono">{shortAddr(address!)}</span>
                  {usdcBalance && (
                    <span style={{ color: "var(--ink-muted)", fontSize: "0.75rem" }}>
                      {parseFloat(usdcBalance.formatted).toFixed(2)} USDC
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      background: "var(--cream-light)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-lg)",
                      padding: "8px",
                      minWidth: 200,
                      zIndex: 50,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      animation: "slideUp 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px 12px",
                        borderBottom: "1px solid var(--border-light)",
                        marginBottom: 4,
                      }}
                    >
                      <div className="label" style={{ marginBottom: 4 }}>
                        Connected
                      </div>
                      <div
                        className="mono"
                        style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}
                      >
                        {address}
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="btn btn-ghost btn-sm"
                      style={{ width: "100%", justifyContent: "flex-start" }}
                      onClick={() => setMenuOpen(false)}
                    >
                      My Dashboard
                    </Link>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{
                        width: "100%",
                        justifyContent: "flex-start",
                        color: "var(--red)",
                      }}
                      onClick={() => {
                        disconnect();
                        setMenuOpen(false);
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
