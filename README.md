```markdown
# Arc Payroll

Trustless global payroll protocol on Arc testnet. Pay workers anywhere in their local stablecoin settled in under a second, triggered by anyone, controlled by no one.

**Live:** [arc-payroll.netlify.app](https://arc-payroll.netlify.app)  
**Contract:** [0xfa8073bfb643e177ad4612a122e74f81463faa48](https://testnet.arcscan.app/address/0xfa8073bfb643e177ad4612a122e74f81463faa48)

---

## What It Does

Traditional payroll systems trust the employer. This one doesn't.

An employer creates a payroll contract, adds employees with their wallet addresses and salary amounts, and deposits USDC as escrow. Once deposited, the funds are locked, the employer cannot withdraw while a pay cycle is pending. When payday arrives, anyone can trigger disbursement. The contract pays each employee atomically in their preferred local stablecoin. No middleman. No trust required.

---

## Architecture

```
PayrollFactory
└── createPayroll() → deploys individual Payroll.sol per employer
    ├── Tracks employer → payrolls
    ├── Tracks employee → payrolls  
    └── Validates payroll authenticity

Payroll.sol
├── addRecipientHuman() → add employee with salary + currency preference
├── deposit() → employer locks USDC escrow
├── disburse() → anyone triggers payday (permissionless)
├── updateFxRate() → update local currency exchange rate
└── getSummaryA/B() → single RPC call for all state
```

### Supported Currencies
| Code | Currency | Country |
|------|----------|---------|
| BRLA | Brazilian Real | Brazil |
| MXNB | Mexican Peso | Mexico |
| PHPC | Philippine Peso | Philippines |
| USDC | US Dollar | Global |

---

## How It Works

**1. Create a payroll**  
Set a name, pay schedule (weekly / bi-weekly / monthly), and first pay date.

**2. Add employees**  
Each employee gets a wallet address, USDC salary amount, and local currency preference.

**3. Deposit USDC**  
Funds are locked in the contract. Employer cannot withdraw while payroll is pending.

**4. Payday runs itself**  
When the schedule is reached, any wallet can call `disburse()`. Arc settles in under 400ms. Each employee receives their salary converted to their local stablecoin via on-chain FX rates.

**5. Fallback protection**  
If the FX rate is stale, employees receive USDC directly — they always get paid something. If one payment fails, the rest still go through.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Arc Testnet (Chain ID: 5042002) |
| Gas Token | USDC (no ETH needed) |
| Smart Contracts | Solidity 0.8.28 |
| Contract Framework | Hardhat |
| Frontend | Next.js 13, TypeScript, Tailwind CSS |
| Wallet | wagmi v2, viem, WalletConnect |
| Deployment | Netlify |

---

## Smart Contract Details

**Network:** Arc Testnet  
**Chain ID:** 5042002  
**RPC:** https://rpc.testnet.arc.network  
**Explorer:** https://testnet.arcscan.app  

**PayrollFactory:** `0xfa8073bfb643e177ad4612a122e74f81463faa48`  
**USDC:** `0x3600000000000000000000000000000000000000`

---

## Local Development

### Prerequisites
- Node.js 18+
- npm

### Smart Contracts

```bash
cd arc-payroll
npm install
cp .env.example .env
# Add your PRIVATE_KEY to .env
npx hardhat compile --config hardhat.config.cjs
npx hardhat run scripts/deploy.ts --config hardhat.config.cjs --network arc_testnet
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Add your environment variables
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_FACTORY_ADDRESS=0xfa8073bfb643e177ad4612a122e74f81463faa48
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## Project Structure

```
arc-payroll/
├── contracts/
│   ├── Payroll.sol          # Individual payroll contract
│   └── PayrollFactory.sol   # Factory + registry
├── scripts/
│   └── deploy.ts            # Deployment script
├── hardhat.config.cjs       # Hardhat configuration
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx              # Landing page + public payrolls
        │   ├── dashboard/            # Employer dashboard
        │   ├── payroll/[address]/    # Individual payroll view
        │   └── api/update-fx-rates/  # FX rate updater
        ├── components/
        │   └── Nav.tsx
        ├── lib/
        │   ├── contracts.ts          # ABIs + helpers
        │   └── wagmi.ts              # Wallet config
        └── providers/
            └── Web3Provider.tsx
```

---

## Security Considerations

- Funds are locked in individual Payroll contracts, not a shared pool
- Each transfer is wrapped in try/catch — one failed payment cannot block the rest
- FX rate fallback to USDC prevents employees from receiving nothing
- Factory validates payroll authenticity — only registered contracts can call `registerEmployee()`
- Employer cannot withdraw while a pay cycle is pending

**Note:** This is a testnet deployment. Not audited. Do not use with real funds.

---

## What's Next

- [ ] Mobile responsive design
- [ ] Recipient cap to prevent gas DoS
- [ ] FX rate oracle integration
- [ ] Multi-sig employer control
- [ ] Smart contract audit
- [ ] Mainnet deployment

---

## The Build Story

This entire project — contracts, deployment, and frontend — was built on an Android phone using Termux after a hard drive failure wiped the original codebase. No laptop. No VS Code. Just a terminal emulator, ARM64 incompatibilities, 11 failed Netlify builds, and 24 hours straight.

---

## License

MIT

---

*Arc Testnet · USDC Native · Sub-second Settlement · Permissionless Disbursement*
```
