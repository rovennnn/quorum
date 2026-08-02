const { ethers } = require("hardhat");

async function main() {
  const [deployer, alice, bob, carol, dave] = await ethers.getSigners();

  console.log("Deploying Quorum contracts...");
  console.log("Deployer:", deployer.address);

  // ── Deploy QuorumToken ────────────────────────────────────────────────────
  const QuorumToken = await ethers.getContractFactory("QuorumToken");
  const token = await QuorumToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("QuorumToken deployed:", tokenAddress);

  // ── Deploy Quorum governance contract ─────────────────────────────────────
  const Quorum = await ethers.getContractFactory("Quorum");
  const quorum = await Quorum.deploy(tokenAddress);
  await quorum.waitForDeployment();
  const quorumAddress = await quorum.getAddress();
  console.log("Quorum deployed:", quorumAddress);

  // ── Mint demo tokens ──────────────────────────────────────────────────────
  // Realistic-feeling unequal balances — not everyone has the same weight
  const toMint = [
    { signer: deployer, amount: "500" },
    { signer: alice,    amount: "300" },
    { signer: bob,      amount: "200" },
    { signer: carol,    amount: "150" },
    { signer: dave,     amount: "50"  },
  ];
  for (const { signer, amount } of toMint) {
    await token.mint(signer.address, ethers.parseUnits(amount, 18));
    console.log(`  Minted ${amount} QRM → ${signer.address}`);
  }

  // ── Create demo proposals ─────────────────────────────────────────────────
  const proposals = [
    {
      title: "Adopt Conventional Commits standard",
      description:
        "Require all contributors to use the Conventional Commits specification (feat:, fix:, chore:, etc.) for commit messages. This enables automated changelog generation and clearer git history. See conventionalcommits.org for the full spec.",
      days: 7,
      signer: alice,
    },
    {
      title: "Add a Code of Conduct",
      description:
        "Adopt the Contributor Covenant v2.1 as the project's Code of Conduct. Establishes community standards for respectful collaboration and provides a clear process for reporting and handling violations.",
      days: 14,
      signer: bob,
    },
    {
      title: "Switch default branch from master to main",
      description:
        "Rename the default branch from 'master' to 'main' across all repositories. This aligns with current Git and GitHub defaults and avoids unnecessary terminology debates in contribution discussions.",
      days: 3,
      signer: deployer,
    },
    {
      title: "Require two approvals for pull requests",
      description:
        "Enforce a minimum of two reviewer approvals before any pull request can be merged into the main branch. Intended to improve code quality, spread knowledge across the team, and reduce single-point-of-failure reviews.",
      days: 10,
      signer: carol,
    },
  ];

  for (const p of proposals) {
    const quorumAs = quorum.connect(p.signer);
    const tx = await quorumAs.propose(p.title, p.description, p.days);
    await tx.wait();
    console.log(`  Proposal created: "${p.title}"`);
  }

  // ── Cast some votes to make the board feel populated ─────────────────────
  // Proposal 1: strong yes
  await quorum.connect(deployer).vote(1, true);
  await quorum.connect(alice).vote(1, true);
  await quorum.connect(bob).vote(1, true);
  await quorum.connect(carol).vote(1, false);

  // Proposal 2: mixed
  await quorum.connect(deployer).vote(2, true);
  await quorum.connect(alice).vote(2, false);
  await quorum.connect(bob).vote(2, false);

  // Proposal 3: all yes
  await quorum.connect(alice).vote(3, true);
  await quorum.connect(bob).vote(3, true);
  await quorum.connect(carol).vote(3, true);
  await quorum.connect(dave).vote(3, true);

  // Proposal 4: no votes yet (fresh)

  console.log("  Demo votes cast");

  // ── Print summary ─────────────────────────────────────────────────────────
  console.log("\n── Deployment summary ──────────────────────────────────");
  console.log("QuorumToken:", tokenAddress);
  console.log("Quorum:     ", quorumAddress);
  console.log("\nAdd these to your frontend .env.local:");
  console.log(`NEXT_PUBLIC_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`NEXT_PUBLIC_QUORUM_ADDRESS=${quorumAddress}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=11155111`);
  console.log("────────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
