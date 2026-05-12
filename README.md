# Arc Payroll ⚡

> Trustless, on-chain payroll infrastructure built on Arc Testnet.  
> No banks. No intermediaries. Just smart contracts and stablecoins.

[![Deploy](https://img.shields.io/badge/Live-Netlify-00C7B7?style=flat-square&logo=netlify)](https://arc-payroll.netlify.app)
[![Network](https://img.shields.io/badge/Network-Arc%20Testnet-blue?style=flat-square)](https://testnet.arcscan.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Built on Android](https://img.shields.io/badge/Built%20on-Android%20%2B%20Termux-black?style=flat-square)](https://termux.dev)

---

# Overview

Arc Payroll is a decentralized payroll protocol that allows organizations to pay employees and contractors directly on-chain using USDC.

Employers create payroll contracts, fund them with stablecoins, and execute payroll transparently through immutable smart contracts. No centralized payroll provider. No custodians. No trust assumptions.

Every payment is:

- On-chain
- Verifiable
- Permissionless
- Stablecoin-settled
- Globally accessible

---

# Live Demo

🌐 **Frontend**  
https://arc-payroll.netlify.app

🔍 **Contract Explorer**  
https://testnet.arcscan.app/address/0xfa8073bfb643e177ad4612a122e74f81463faa48

---

# Core Features

## Trustless Payroll Execution
Payroll logic is enforced entirely by smart contracts.

## Payroll Factory Architecture
Each organization gets its own isolated payroll contract deployed via `PayrollFactory`.

## USDC Native Payments
All salaries and disbursements are settled in USDC.

## Transparent On-Chain Records
Every payroll action is publicly verifiable.

## Permissionless Payroll Runs
Anyone can trigger payroll execution once conditions are met.

## Non-Custodial Design
Funds remain controlled by contract logic — not by a centralized service.

---

# Architecture

```text
PayrollFactory
│
├── createPayroll()
│
└── Deploys isolated Payroll contracts
        │
        ├── addRecipient()
        ├── depositFunds()
        ├── executePayroll()
        └── distribute USDC to employees
```

---

# Smart Contracts

| Contract | Address |
|---|---|
| PayrollFactory | `0xfa8073bfb643e177ad4612a122e74f81463faa48` |

## Network Details

| Property | Value |
|---|---|
| Network | Arc Testnet |
| Chain ID | `5042002` |
| Gas Token | USDC |

---

# How It Works

## 1. Create Payroll
An employer deploys a payroll instance through the factory contract.

## 2. Add Recipients
Employee wallet addresses and payment amounts are registered.

## 3. Fund Payroll
The employer deposits USDC into the payroll contract.

## 4. Execute Payroll
The contract distributes USDC automatically to all registered recipients.

## 5. Verify On-Chain
Every payment can be verified publicly on the blockchain explorer.

---

# Tech Stack

## Frontend

| Technology | Version |
|---|---|
| Next.js | 13 |
| TypeScript | Latest |
| Tailwind CSS | Latest |
| wagmi | v2 |
| viem | Latest |

---

## Smart Contracts

| Technology | Usage |
|---|---|
| Solidity | Smart contracts |
| Hardhat | Development framework |
| EVM | Arc Testnet compatibility |

---

## Infrastructure

| Service | Purpose |
|---|---|
| Netlify | Hosting & CI/CD |
| Arc Testnet | Blockchain network |
| WalletConnect | Wallet integrations |

---

# Getting Started

## Prerequisites

- Node.js 18+
- npm or yarn
- Wallet with Arc Testnet USDC
- MetaMask or WalletConnect-compatible wallet

---

# Installation

```bash
# Clone repository
git clone https://github.com/mashallah1/arc-payroll.git

# Enter frontend
cd arc-payroll/frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
```

---

# Environment Variables

Create a `.env.local` file inside `frontend/`

```env
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_FACTORY_ADDRESS=0xfa8073bfb643e177ad4612a122e74f81463faa48
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

# Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Production Build

```bash
npm run build
npm start
```

---

# Project Structure

```text
arc-payroll/
├── contracts/
│   ├── Payroll.sol
│   └── PayrollFactory.sol
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── dashboard/
│   │   │   └── payroll/[address]/
│   │   │
│   │   ├── components/
│   │   ├── lib/
│   │   └── providers/
│   │
│   ├── netlify.toml
│   └── package.json
│
├── scripts/
├── hardhat.config.cjs
└── README.md
```

---

# Deployment

Frontend deployments are handled automatically through Netlify CI/CD.

## Netlify Configuration

```toml
[build]
  base    = "frontend"
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

# Security Notes

- Payroll contracts are isolated per organization
- Funds are controlled by immutable contract logic
- Payroll execution is transparent and verifiable
- No upgrade proxies
- No centralized custody

> This project is currently deployed on testnet and has not been audited.

---

# Roadmap

- [ ] Multi-token payroll support
- [ ] Recurring automated payroll cycles
- [ ] DAO treasury integrations
- [ ] Multi-signature employer controls
- [ ] Payroll analytics dashboard
- [ ] Mainnet deployment
- [ ] Smart contract audit

---

# Built on Android 📱

This project was built entirely on an Android phone using Termux.

No desktop setup. No traditional development environment.

Just:

- Termux
- Node.js
- Solidity
- Git
- vim / nano
- Persistence

A demonstration that modern Web3 infrastructure can be built from anywhere.

---

# Contributing

Pull requests are welcome.

```bash
# Fork repository

# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git commit -m "feat: add feature"

# Push branch
git push origin feature/my-feature
```

Then open a Pull Request.

---

# License

MIT © [mashallah1](https://github.com/mashallah1)

---

# Final Note

Arc Payroll explores what payroll infrastructure looks like when coordination is handled by smart contracts instead of institutions.

**Transparent. Borderless. Programmable.**

*Built trustlessly. Deployed fearlessly.*
USDC Native Payments

All salaries and disbursements are settled in USDC.

Transparent On-Chain Records

Every payroll action is publicly verifiable.

Permissionless Payroll Runs

Anyone can trigger payroll execution once conditions are met.

Non-Custodial Design

Funds remain controlled by contract logic — not by a centralized service.


---

Architecture

PayrollFactory
│
├── createPayroll()
│
└── Deploys isolated Payroll contracts
        │
        ├── addRecipient()
        ├── depositFunds()
        ├── executePayroll()
        └── distribute USDC to employees


---

Smart Contracts

Contract	Address

PayrollFactory	0xfa8073bfb643e177ad4612a122e74f81463faa48


Network Details

Property	Value

Network	Arc Testnet
Chain ID	5042002
Gas Token	USDC



---

How It Works

1. Create Payroll

An employer deploys a payroll instance through the factory contract.

2. Add Recipients

Employee wallet addresses and payment amounts are registered.

3. Fund Payroll

The employer deposits USDC into the payroll contract.

4. Execute Payroll

The contract distributes USDC automatically to all registered recipients.

5. Verify On-Chain

Every payment can be verified publicly on the blockchain explorer.


---

Tech Stack

Frontend

Technology	Version

Next.js	13
TypeScript	Latest
Tailwind CSS	Latest
wagmi	v2
viem	Latest



---

Smart Contracts

Technology	Usage

Solidity	Smart contracts
Hardhat	Development framework
EVM	Arc Testnet compatibility



---

Infrastructure

Service	Purpose

Netlify	Hosting & CI/CD
Arc Testnet	Blockchain network
WalletConnect	Wallet integrations



---

Getting Started

Prerequisites

Node.js 18+

npm or yarn

Wallet with Arc Testnet USDC

MetaMask or WalletConnect-compatible wallet



---

Installation

# Clone repository
git clone https://github.com/mashallah1/arc-payroll.git

# Enter frontend
cd arc-payroll/frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local


---

Environment Variables

Create a .env.local file inside frontend/

NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_FACTORY_ADDRESS=0xfa8073bfb643e177ad4612a122e74f81463faa48
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id


---

Run Development Server

npm run dev

Open:

http://localhost:3000


---

Production Build

npm run build
npm start


---

Project Structure

arc-payroll/
├── contracts/
│   ├── Payroll.sol
│   └── PayrollFactory.sol
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── dashboard/
│   │   │   └── payroll/[address]/
│   │   │
│   │   ├── components/
│   │   ├── lib/
│   │   └── providers/
│   │
│   ├── netlify.toml
│   └── package.json
│
├── scripts/
├── hardhat.config.cjs
└── README.md


---

Deployment

Frontend deployments are handled automatically through Netlify CI/CD.

Netlify Configuration

[build]
  base    = "frontend"
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"


---

Security Notes

Payroll contracts are isolated per organization

Funds are controlled by immutable contract logic

Payroll execution is transparent and verifiable

No upgrade proxies

No centralized custody


> This project is currently deployed on testnet and has not been audited.




---

Roadmap

[ ] Multi-token payroll support

[ ] Recurring automated payroll cycles

[ ] DAO treasury integrations

[ ] Multi-signature employer controls

[ ] Payroll analytics dashboard

[ ] Mainnet deployment

[ ] Smart contract audit



---

Built on Android 📱

This project was built entirely on an Android phone using Termux.

No desktop setup. No traditional development environment.

Just:

Termux

Node.js

Solidity

Git

vim / nano

Persistence


A demonstration that modern Web3 infrastructure can be built from anywhere.


---

Contributing

Pull requests are welcome.

# Fork repository
# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git commit -m "feat: add feature"

# Push branch
git push origin feature/my-feature

Then open a Pull Request.


---

License

MIT © mashallah1


---

Final Note

Arc Payroll explores what payroll infrastructure looks like when coordination is handled by smart contracts instead of institutions.

Transparent. Borderless. Programmable.

Built trustlessly. Deployed fearlessly.
