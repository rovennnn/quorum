const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("QuorumToken", function () {
  let token, owner, alice, bob;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("QuorumToken");
    token = await Factory.deploy();
  });

  it("has correct name and symbol", async () => {
    expect(await token.name()).to.equal("Quorum Token");
    expect(await token.symbol()).to.equal("QRM");
  });

  it("owner can mint tokens", async () => {
    await token.mint(alice.address, ethers.parseUnits("100", 18));
    expect(await token.balanceOf(alice.address)).to.equal(
      ethers.parseUnits("100", 18)
    );
  });

  it("non-owner cannot mint", async () => {
    await expect(
      token.connect(alice).mint(bob.address, ethers.parseUnits("100", 18))
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
  });

  it("tokens are non-transferable", async () => {
    await token.mint(alice.address, ethers.parseUnits("100", 18));
    await expect(
      token.connect(alice).transfer(bob.address, ethers.parseUnits("10", 18))
    ).to.be.revertedWith("QuorumToken: non-transferable");
  });

  it("approve is disabled", async () => {
    await token.mint(alice.address, ethers.parseUnits("100", 18));
    await expect(
      token.connect(alice).approve(bob.address, ethers.parseUnits("10", 18))
    ).to.be.revertedWith("QuorumToken: non-transferable");
  });

  it("tracks holders", async () => {
    await token.mint(alice.address, ethers.parseUnits("100", 18));
    await token.mint(bob.address, ethers.parseUnits("50", 18));
    const holders = await token.getHolders();
    expect(holders).to.include(alice.address);
    expect(holders).to.include(bob.address);
  });
});

describe("Quorum", function () {
  let token, quorum, owner, alice, bob, carol, nobody;

  beforeEach(async () => {
    [owner, alice, bob, carol, nobody] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("QuorumToken");
    token = await TokenFactory.deploy();

    const QuorumFactory = await ethers.getContractFactory("Quorum");
    quorum = await QuorumFactory.deploy(await token.getAddress());

    // Give alice 300, bob 200, carol 100 — owner keeps 0 for some tests
    await token.mint(alice.address, ethers.parseUnits("300", 18));
    await token.mint(bob.address,   ethers.parseUnits("200", 18));
    await token.mint(carol.address, ethers.parseUnits("100", 18));
  });

  // ── Proposal creation ──────────────────────────────────────────────────────

  describe("propose()", () => {
    it("token holder can create a proposal", async () => {
      await expect(
        quorum.connect(alice).propose("Test proposal", "A description", 7)
      ).to.emit(quorum, "ProposalCreated");

      expect(await quorum.proposalCount()).to.equal(1);
      const p = await quorum.proposals(1);
      expect(p.title).to.equal("Test proposal");
      expect(p.proposer).to.equal(alice.address);
    });

    it("non-holder cannot propose", async () => {
      await expect(
        quorum.connect(nobody).propose("Sneaky", "nope", 7)
      ).to.be.revertedWith("Quorum: must hold tokens to propose");
    });

    it("rejects empty title", async () => {
      await expect(
        quorum.connect(alice).propose("", "desc", 7)
      ).to.be.revertedWith("Quorum: title required");
    });

    it("rejects title over 120 chars", async () => {
      const longTitle = "a".repeat(121);
      await expect(
        quorum.connect(alice).propose(longTitle, "desc", 7)
      ).to.be.revertedWith("Quorum: title too long");
    });

    it("rejects voting period outside 1–30 days", async () => {
      await expect(
        quorum.connect(alice).propose("T", "D", 0)
      ).to.be.revertedWith("Quorum: 1-30 days");
      await expect(
        quorum.connect(alice).propose("T", "D", 31)
      ).to.be.revertedWith("Quorum: 1-30 days");
    });
  });

  // ── Voting ─────────────────────────────────────────────────────────────────

  describe("vote()", () => {
    beforeEach(async () => {
      await quorum.connect(alice).propose("Proposal Alpha", "desc", 7);
    });

    it("token holder can cast a yes vote", async () => {
      await expect(quorum.connect(alice).vote(1, true))
        .to.emit(quorum, "VoteCast")
        .withArgs(1, alice.address, true, ethers.parseUnits("300", 18));

      const p = await quorum.proposals(1);
      expect(p.yesVotes).to.equal(ethers.parseUnits("300", 18));
    });

    it("token holder can cast a no vote", async () => {
      await quorum.connect(bob).vote(1, false);
      const p = await quorum.proposals(1);
      expect(p.noVotes).to.equal(ethers.parseUnits("200", 18));
    });

    it("vote weight equals token balance", async () => {
      await quorum.connect(carol).vote(1, true);
      const [, , weight] = await quorum.getVote(1, carol.address);
      expect(weight).to.equal(ethers.parseUnits("100", 18));
    });

    it("cannot vote twice", async () => {
      await quorum.connect(alice).vote(1, true);
      await expect(
        quorum.connect(alice).vote(1, false)
      ).to.be.revertedWith("Quorum: already voted");
    });

    it("non-holder cannot vote", async () => {
      await expect(
        quorum.connect(nobody).vote(1, true)
      ).to.be.revertedWith("Quorum: no tokens to vote with");
    });

    it("cannot vote after deadline", async () => {
      await time.increase(8 * 24 * 60 * 60); // 8 days
      await expect(
        quorum.connect(alice).vote(1, true)
      ).to.be.revertedWith("Quorum: voting period ended");
    });
  });

  // ── Resolution ─────────────────────────────────────────────────────────────

  describe("resolve()", () => {
    beforeEach(async () => {
      await quorum.connect(alice).propose("Proposal Beta", "desc", 3);
    });

    it("resolves as Approved when yes > no", async () => {
      await quorum.connect(alice).vote(1, true); // 300
      await quorum.connect(bob).vote(1, false);  // 200
      // yes wins

      await time.increase(4 * 24 * 60 * 60); // 4 days
      await quorum.resolve(1);

      const p = await quorum.proposals(1);
      expect(p.state).to.equal(1); // State.Approved
    });

    it("resolves as Rejected when no >= yes", async () => {
      await quorum.connect(alice).vote(1, false); // 300 no
      await quorum.connect(bob).vote(1, true);    // 200 yes
      // no wins

      await time.increase(4 * 24 * 60 * 60);
      await quorum.resolve(1);

      const p = await quorum.proposals(1);
      expect(p.state).to.equal(2); // State.Rejected
    });

    it("resolves as Rejected when no votes cast", async () => {
      await time.increase(4 * 24 * 60 * 60);
      await quorum.resolve(1);
      const p = await quorum.proposals(1);
      expect(p.state).to.equal(2); // State.Rejected
    });

    it("cannot resolve before deadline", async () => {
      await expect(quorum.resolve(1)).to.be.revertedWith(
        "Quorum: voting still active"
      );
    });

    it("cannot resolve twice", async () => {
      await time.increase(4 * 24 * 60 * 60);
      await quorum.resolve(1);
      await expect(quorum.resolve(1)).to.be.revertedWith(
        "Quorum: already resolved"
      );
    });
  });

  // ── View functions ─────────────────────────────────────────────────────────

  describe("getAllProposals()", () => {
    it("returns all proposals", async () => {
      await quorum.connect(alice).propose("One", "d", 1);
      await quorum.connect(bob).propose("Two", "d", 2);
      const all = await quorum.getAllProposals();
      expect(all.length).to.equal(2);
      expect(all[0].title).to.equal("One");
      expect(all[1].title).to.equal("Two");
    });
  });

  describe("getVotedOn()", () => {
    it("tracks which proposals a voter participated in", async () => {
      await quorum.connect(alice).propose("A", "d", 1);
      await quorum.connect(alice).propose("B", "d", 1);
      await quorum.connect(alice).vote(1, true);
      await quorum.connect(alice).vote(2, false);

      const voted = await quorum.getVotedOn(alice.address);
      expect(voted.map((v) => Number(v))).to.deep.equal([1, 2]);
    });
  });
});
