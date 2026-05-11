import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "fs";
import { resolve } from "path";
import * as dotenv from "dotenv";

dotenv.config();

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://arc-testnet.drpc.org"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
});

function loadArtifact(name: string) {
  const artifactPath = resolve(
    `artifacts/contracts/${name}.sol/${name}.json`
  );
  const raw = readFileSync(artifactPath, "utf-8");
  return JSON.parse(raw);
}

async function main() {
  console.log("─────────────────────────────────────────");
  console.log("  ARC PAYROLL — Deploying PayrollFactory ");
  console.log("─────────────────────────────────────────");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in .env — add it and retry");
  }

  const account = privateKeyToAccount(
    (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as `0x${string}`
  );

  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http("https://arc-testnet.drpc.org"),
  });

  const walletClient = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http("https://arc-testnet.drpc.org"),
  });

  console.log("\nDeployer wallet :", account.address);

  const usdcAddress = "0x3600000000000000000000000000000000000000" as `0x${string}`;
  const balance = await publicClient.readContract({
    address: usdcAddress,
    abi: [{
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    }],
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log("Deployer balance:", (Number(balance) / 1e6).toFixed(6), "USDC");

  console.log("Loading PayrollFactory artifact...");
  const artifact = loadArtifact("PayrollFactory");
  const { abi, bytecode } = artifact;

  if (!bytecode || bytecode === "0x") {
    throw new Error("Bytecode is empty — run: npx hardhat compile first");
  }

  console.log("Deploying PayrollFactory...");

  const txHash = await walletClient.deployContract({
    abi,
    bytecode: bytecode as `0x${string}`,
    args: [],
  });

  console.log("Deploy tx hash:", txHash);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  const factoryAddress = receipt.contractAddress;

  if (!factoryAddress) {
    throw new Error("Contract address not in receipt — check tx on explorer");
  }

  console.log("✅ PayrollFactory deployed to :", factoryAddress);
  console.log("🔍 Explorer :", `https://testnet.arcscan.app/address/${factoryAddress}`);
  console.log("⛽ Gas used  :", receipt.gasUsed.toString());
  console.log("NEXT_PUBLIC_FACTORY_ADDRESS=" + factoryAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nDeployment failed:", error.message || error);
    process.exit(1);
  });
