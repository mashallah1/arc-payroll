"use client";
import Link from "next/link";
import { useAccount, useDisconnect, useBalance, useConnect } from "wagmi";
import { shortAddr, USDC_ADDRESS } from "@/lib/contracts";
import { useState } from "react";

export function Nav() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS,
    query: { enabled: !!address },
  });

  const wrongNetwork = isConnected && chain?.id !== 5042002;

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="nav-logo">
          <span className="nav-logo-name">arc/payroll</span>
          <span className="nav-logo-sub">testnet</span>
        </Link>

        <div className="nav-actions">
          {wrongNetwork && (
            <span className="badge badge-amber">
              <span className="badge-dot" />
              Wrong network
            </span>
          )}

          {!isConnected ? (
            <div style={{ position: "relative" }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowWalletMenu(!showWalletMenu)}
              >
                Connect Wallet
              </button>
              {showWalletMenu && (
                <div style={{
                  position: "absolute", right: 0, top: "110%",
                  background: "var(--cream)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: 8, minWidth: 200, zIndex: 100,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
                }}>
                  {connectors.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => {
                        connect({ connector });
                        setShowWalletMenu(false);
                      }}
                      style={{
                        display: "block", width: "100%", padding: "10px 14px",
                        textAlign: "left", background: "none", border: "none",
                        cursor: "pointer", fontSize: "0.875rem",
                        borderRadius: 6, color: "var(--ink)"
                      }}
                    >
                      {connector.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setMenuOpen((o) => !o)}
              >
                {shortAddr(address!)} · {(Number(usdcBalance?.value || 0n) / 1e6).toFixed(2)} USDC
              </button>
              {menuOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "110%",
                  background: "var(--cream)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: 8, minWidth: 180, zIndex: 100,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
                }}>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                    style={{ display: "block", padding: "10px 14px", fontSize: "0.875rem", color: "var(--ink)", textDecoration: "none" }}>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { disconnect(); setMenuOpen(false); }}
                    style={{
                      display: "block", width: "100%", padding: "10px 14px",
                      textAlign: "left", background: "none", border: "none",
                      cursor: "pointer", fontSize: "0.875rem",
                      color: "var(--red)", borderRadius: 6
                    }}>
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
