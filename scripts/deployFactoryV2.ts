import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "fs";
import { resolve } from "path";
import * as dotenv from "dotenv";

dotenv.config();

const arcTestnet = defineChain({
  id: 5042002,
    name: "Arc Testnet",
      nativeCurrency: {
          name: "USD Coin",
              symbol: "USDC",
                  decimals: 6
                    },
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
                                                    console.log("  ARC PAYROLL — Deploying FactoryV2 ");
                                                      console.log("─────────────────────────────────────────");

                                                        const privateKey = process.env.PRIVATE_KEY;
                                                          if (!privateKey) throw new Error("Missing PRIVATE_KEY");

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

                                                                                                console.log("\nDeployer wallet:", account.address);

                                                                                                  const usdcAddress = "0x3600000000000000000000000000000000000000";

                                                                                                    const artifact = loadArtifact("PayrollFactoryV2");
                                                                                                      const { abi, bytecode } = artifact;

                                                                                                        if (!bytecode || bytecode === "0x") {
                                                                                                            throw new Error("Bytecode missing — compile first");
                                                                                                              }

                                                                                                                console.log("Deploying PayrollFactoryV2...");

                                                                                                                  const txHash = await walletClient.deployContract({
                                                                                                                      abi,
                                                                                                                          bytecode: bytecode as `0x${string}`,
                                                                                                                              args: [usdcAddress],
                                                                                                                                });

                                                                                                                                  console.log("Tx hash:", txHash);

                                                                                                                                    const receipt = await publicClient.waitForTransactionReceipt({
                                                                                                                                        hash: txHash,
                                                                                                                                          });

                                                                                                                                            const factoryAddress = receipt.contractAddress;

                                                                                                                                              if (!factoryAddress) throw new Error("Deployment failed");

                                                                                                                                                console.log("\n📦 FactoryV2 deployed successfully");
                                                                                                                                                  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                                                                                                                                                    console.log("Address:", factoryAddress);
                                                                                                                                                      console.log("Explorer:", `https://testnet.arcscan.app/address/${factoryAddress}`);
                                                                                                                                                        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

                                                                                                                                                          console.log("\nNEXT_PUBLIC_FACTORY_ADDRESS=" + factoryAddress);
                                                                                                                                                          }

                                                                                                                                                          main()
                                                                                                                                                            .then(() => process.exit(0))
                                                                                                                                                              .catch((error) => {
                                                                                                                                                                  console.error("Deployment failed:", error);
                                                                                                                                                                      process.exit(1);
                                                                                                                                                                        });