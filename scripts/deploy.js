require("dotenv").config();
const { ethers } = require("ethers");
const QuorumTokenArtifact = require("../artifacts-export/QuorumToken.json");
const QuorumArtifact = require("../artifacts-export/Quorum.json");

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    console.error("Missing SEPOLIA_RPC_URL or PRIVATE_KEY in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const deployer = new ethers.Wallet(privateKey, provider);

  console.log("Deploying from:", deployer.address);

  const balance = await provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  if (balance === 0n) {
    console.error("No ETH — get Sepolia testnet ETH from sepoliafaucet.com");
    process.exit(1);
  }

  console.log("\nDeploying QuorumToken...");
  const TokenFactory = new ethers.ContractFactory(
    QuorumTokenArtifact.abi,
    QuorumTokenArtifact.bytecode,
    deployer
  );
  const token = await TokenFactory.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("QuorumToken deployed:", tokenAddress);

  console.log("\nDeploying Quorum...");
  const QuorumFactory = new ethers.ContractFactory(
    QuorumArtifact.abi,
    QuorumArtifact.bytecode,
    deployer
  );
  const quorum = await QuorumFactory.deploy(tokenAddress);
  await quorum.waitForDeployment();
  const quorumAddress = await quorum.getAddress();
  console.log("Quorum deployed:", quorumAddress);

  console.log("\nMinting tokens...");
  const mintTx = await token.mint(
    deployer.address,
    ethers.parseUnits("500", 18)
  );
  await mintTx.wait();
  console.log("Minted 500 QRM to deployer");

  console.log("\nCreating demo proposals...");
  const proposals = [
    {
      title: "Adopt Conventional Commits standard",
      description:
        "Require all contributors to use the Conventional Commits specification (feat:, fix:, chore:, etc.) for commit messages. This enables automated changelog generation and clearer git history.",
      days: 7,
    },
    {
      title: "Add a Code of Conduct",
      description:
        "Adopt the Contributor Covenant v2.1 as the project's Code of Conduct. Establishes community standards for respectful collaboration and a clear process for reporting violations.",
      days: 14,
    },
    {
      title: "Switch default branch from master to main",
      description:
        "Rename the default branch from master to main across all repositories. Aligns with current Git and GitHub defaults.",
      days: 3,
    },
    {
      title: "Require two approvals for pull requests",
      description:
        "Enforce a minimum of two reviewer approvals before any pull request can be merged. Improves code quality and spreads knowledge across the team.",
      days: 10,
    },
  ];

  for (const p of proposals) {
    const tx = await quorum.propose(p.title, p.description, p.days);
    await tx.wait();
    console.log(" Created:", p.title);
  }

  console.log("\nCasting demo votes...");
  await (await quorum.vote(1, true)).wait();
  await (await quorum.vote(2, true)).wait();
  await (await quorum.vote(3, true)).wait();
  console.log("Votes cast");

  console.log("\n────────────────────────────────────────────────────────");
  console.log("QuorumToken:", tokenAddress);
  console.log("Quorum:     ", quorumAddress);
  console.log("\nCopy these into Vercel environment variables:");
  console.log("NEXT_PUBLIC_TOKEN_ADDRESS=" + tokenAddress);
  console.log("NEXT_PUBLIC_QUORUM_ADDRESS=" + quorumAddress);
  console.log("NEXT_PUBLIC_CHAIN_ID=11155111");
  console.log("NEXT_PUBLIC_RPC_URL=" + rpcUrl);
  console.log("────────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("\nDeploy failed:", err.message);
  process.exit(1);
});
