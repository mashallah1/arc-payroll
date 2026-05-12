# Arc Payroll ⚡

> Trustless, on-chain payroll infrastructure built on Arc Testnet. No middlemen. No banks. Just code.

[![Deployed on Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7?style=flat-square&logo=netlify)](https://arc-payroll.netlify.app)
[![Network](https://img.shields.io/badge/Network-Arc%20Testnet-blue?style=flat-square)](https://arc-payroll.netlify.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Built in Termux](https://img.shields.io/badge/Built%20in-Termux%20%F0%9F%93%B1-black?style=flat-square)](https://termux.dev)

---

## What is Arc Payroll?

Arc Payroll is a **decentralized payroll protocol** that lets organizations pay employees and contractors directly on-chain using USDC — with zero reliance on banks, payroll processors, or intermediaries.

Every payroll run is a smart contract interaction. Every payment is transparent, verifiable, and trustless.

Built entirely on an Android device using Termux. 🔨📱

---

## Live Demo

🌐 **Frontend:** [arc-payroll.netlify.app](https://arc-payroll.netlify.app)

---

## Smart Contracts

| Contract | Address |
|---|---|
| **PayrollFactory** | `0xfa8073bfb643e177ad4612a122e74f81463faa48` |

**Network:** Arc Testnet  
**Chain ID:** `5042002`  
**Gas Token:** USDC

All contracts are verified on the Arc Testnet explorer.

---

## Features

- **Create Payroll Streams** — Deploy a new payroll contract for your organization in one transaction
- **Add Recipients** — Register employee/contractor wallet addresses and payment amounts
- **USDC Payouts** — All payments denominated and settled in USDC
- **Trustless Execution** — No admin keys, no upgrade proxies; the contract enforces the rules
- **On-chain Transparency** — Every disbursement is publicly verifiable
- **Factory Pattern** — One `PayrollFactory` deploys isolated payroll instances per organization

---

## Tech Stack

### Frontend
| Technology | Version |
|---|---|
| Next.js | 13.5.6 |
| wagmi | v2 |
| viem | latest |
| TypeScript | latest |
| Tailwind CSS | latest |

### Infrastructure
| Service | Purpose |
|---|---|
| Netlify | Frontend hosting + CI/CD |
| Arc Testnet | EVM-compatible chain (Chain ID: 5042002) |
| USDC | Gas + payment token |

### Dev Environment
Built entirely on **Android + Termux** — no laptop, no desktop.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A wallet with Arc Testnet USDC (for gas)
- MetaMask or any WalletConnect-compatible wallet

### Add Arc Testnet to Your Wallet

| Field | Value |
|---|---|
| Network Name | Arc Testnet |
| Chain ID | `5042002` |
| RPC URL | *(set in your* `.env`*)* |
| Currency Symbol | USDC |

### Installation

```bash
# Clone the repo
git clone https://github.com/mashallah1/arc-payroll.git
cd arc-payroll/frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_FACTORY_ADDRESS=0xfa8073bfb643e177ad4612a122e74f81463faa48
NEXT_PUBLIC_RPC_URL=<your_arc_testnet_rpc_url>
NEXT_PUBLIC_USDC_ADDRESS=<usdc_contract_address>
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_walletconnect_project_id>
```

### Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
arc-payroll/
├── frontend/                  # Next.js 13 App Router frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing / home page
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Main payroll dashboard
│   │   │   └── payroll/
│   │   │       └── [address]/
│   │   │           └── page.tsx   # Individual payroll instance view
│   │   ├── components/
│   │   │   └── Nav.tsx            # Navigation component
│   │   └── providers/
│   │       └── Web3Provider.tsx   # wagmi + viem wallet provider
│   ├── netlify.toml               # Netlify build config
│   └── package.json
└── contracts/                 # Solidity smart contracts (deployed)
    └── PayrollFactory.sol
```

---

## Deployment

The frontend auto-deploys to Netlify on every push to `main`.

### Netlify Config (`netlify.toml`)

```toml
[build]
  base    = "frontend"
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Manual Deploy Trigger

```bash
# From the frontend directory
echo "" >> README.md
git add . && git commit -m "chore: trigger redeploy" && git push
```

---

## How It Works

```
User connects wallet
        │
        ▼
  PayrollFactory
  (0xfa8073b...)
        │
        ├─── createPayroll() ──► New Payroll Contract (per org)
        │
        └─── Each Payroll Contract:
                 ├── addRecipient(address, amount)
                 ├── depositFunds(usdcAmount)
                 ├── approve(spender, amount)
                 └── executePayroll() ──► Transfers USDC to all recipients
```

1. **Connect** your wallet to Arc Testnet
2. **Create** a new payroll instance via the factory
3. **Add recipients** (wallet addresses + USDC amounts)
4. **Deposit** USDC into the payroll contract
5. **Execute** — the contract distributes funds trustlessly

---

## Built on Android 📱

This entire project — smart contracts, frontend, deployment pipeline — was built on an **Android phone using Termux**. No traditional development environment. Just:

- Termux (terminal emulator)
- Node.js + npm
- Git
- vim / nano

Proof that Web3 development has no hardware barriers.

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT © [mashallah1](https://github.com/mashallah1)

---

*Built trustlessly. Deployed fearlessly. From a phone.*

