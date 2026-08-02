# Quorum

Decentralized governance where token holders propose and vote on community
decisions. Results are recorded on-chain — permanent, public, and tamper-proof.

Built on Ethereum (Sepolia testnet) with Solidity + Hardhat (contracts) and
Next.js + wagmi v2 (frontend).

---

## What this is

Quorum is a lightweight DAO (Decentralized Autonomous Organization) governance
system. Any holder of a Quorum Token (QRM) can:

- **Propose** — submit a proposal with a title, description, and voting period
- **Vote** — cast a weighted Yes/No vote (weight = token balance)
- **Resolve** — trigger resolution after the deadline; anyone can call this

A proposal is **Approved** if Yes votes outweigh No votes. Otherwise it's
**Rejected**. Both outcomes are written on-chain and cannot be changed.

### How this differs from a Hyperledger Fabric voting system

This project sits beside a Hyperledger Fabric blockchain voting system (thesis)
in the portfolio. They solve a similar problem — recording votes on a ledger
— but with opposite trust models:

| | Hyperledger Fabric | Quorum (this project) |
|---|---|---|
| Chain type | Permissioned (private) | Permissionless (public) |
| Who can join | Invited members only | Anyone with tokens |
| Consensus | RAFT (leader-based) | Ethereum PoS |
| Transparency | Visible to members | Public to anyone |
| Token | N/A | Non-transferable ERC-20 |

Neither is strictly better — the right choice depends on the use case.

---

## Project structure

```
quorum/
├── contracts/
│   ├── QuorumToken.sol     — Non-transferable ERC-20 governance token
│   └── Quorum.sol          — Proposals, voting, resolution logic
├── scripts/
│   └── deploy.js           — Deploy + seed 4 demo proposals with votes
├── test/
│   └── Quorum.test.js      — 24 tests covering the full proposal lifecycle
├── hardhat.config.js
├── .env.example
└── frontend/
    ├── app/
    │   ├── page.tsx               — Proposals board (home)
    │   ├── proposals/[id]/page.tsx — Proposal detail + vote UI
    │   ├── propose/page.tsx        — Submit a proposal
    │   └── account/page.tsx        — My tokens + voting history
    ├── components/
    │   ├── nav.tsx
    │   ├── connect-button.tsx
    │   ├── proposal-card.tsx
    │   ├── proposals-list.tsx
    │   └── providers.tsx
    └── lib/
        ├── abi.ts          — Typed contract ABIs
        ├── wagmi.ts        — Chain + connector config
        └── types.ts        — Shared types + formatting helpers
```

---

## Local setup

### Prerequisites

- Node.js 18+
- MetaMask browser extension (or any injected wallet)

### 1. Install dependencies

```bash
# Root (Hardhat)
npm install

# Frontend
cd frontend && npm install
```

### 2. Start a local Hardhat node

```bash
# In one terminal:
npm run node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 funded
test accounts.

### 3. Deploy contracts + seed demo data

```bash
# In a second terminal:
npm run deploy:local
```

Copy the output addresses — you'll need them next.

### 4. Configure the frontend

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_TOKEN_ADDRESS=<QuorumToken address from deploy output>
NEXT_PUBLIC_QUORUM_ADDRESS=<Quorum address from deploy output>
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

### 5. Run the frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`.

### 6. Connect MetaMask to local Hardhat

In MetaMask:
- Add network: RPC `http://127.0.0.1:8545`, Chain ID `31337`, currency ETH
- Import one of the Hardhat test accounts using its private key (printed by
  `npm run node` — use Account #0 which is the deployer and has tokens)

---

## Running tests

```bash
npm test
```

24 tests covering:
- QuorumToken: minting, non-transferability, holder tracking
- Quorum: proposal creation, voting (weight, double-vote prevention,
  deadline enforcement), resolution (Approved/Rejected/no-votes), view
  functions

---

## Deploying to Sepolia testnet

### Get testnet ETH (free)

You need Sepolia ETH to pay gas. Get some free from:
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

### Set up environment

```bash
cp .env.example .env
```

Edit `.env`:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_deployer_wallet_private_key_without_0x
ETHERSCAN_API_KEY=optional_for_verification
```

Get a free Alchemy RPC URL at https://www.alchemy.com (free tier is enough).

**Never commit your `.env` file. Use a dedicated deploy wallet.**

### Deploy

```bash
npm run deploy:sepolia
```

The script prints the deployed addresses. Copy them.

### Configure and deploy the frontend

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_TOKEN_ADDRESS=<QuorumToken address>
NEXT_PUBLIC_QUORUM_ADDRESS=<Quorum address>
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

Then deploy to Vercel:

1. Push the repo to GitHub
2. Go to https://vercel.com/new → import the repo
3. Set root directory to `frontend`
4. Add the four `NEXT_PUBLIC_*` env vars under Settings → Environment Variables
5. Deploy — Vercel redeploys on every push to `main`

---

## Design decisions

**Why non-transferable tokens?**
Governance should reflect membership and contribution, not purchasing power.
Non-transferable tokens prevent someone from buying votes.

**Why weighted voting?**
Simple 1-person-1-vote would require identity verification (hard on-chain).
Token-weighted voting is the standard DAO pattern and works cleanly with ERC-20.

**Why no on-chain proposal execution?**
For a governance demo, the recorded result *is* the point. Arbitrary on-chain
execution (calling other contracts after a vote passes) adds significant
complexity and attack surface without adding to the portfolio demonstration.

**Why Sepolia testnet?**
Tokens have no monetary value. Using mainnet would waste real ETH on gas fees.
Sepolia is Ethereum's standard developer testnet and is reliable for demos.
