// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./QuorumToken.sol";

/**
 * @title Quorum
 * @dev Governance contract for creating and voting on proposals.
 * Vote weight = token balance at time of vote.
 * Proposals resolve to Approved (>50% yes of participating votes)
 * or Rejected after the deadline passes.
 */
contract Quorum {
    QuorumToken public immutable token;

    enum State { Active, Approved, Rejected }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 deadline;       // unix timestamp
        uint256 yesVotes;
        uint256 noVotes;
        bool resolved;
        State state;
    }

    struct VoteRecord {
        bool hasVoted;
        bool votedYes;
        uint256 weight;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    // proposalId => voter => VoteRecord
    mapping(uint256 => mapping(address => VoteRecord)) public votes;
    // voter => list of proposalIds they voted on
    mapping(address => uint256[]) private _votedOn;

    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        string title,
        uint256 deadline
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool votedYes,
        uint256 weight
    );
    event ProposalResolved(uint256 indexed id, State state);

    constructor(address tokenAddress) {
        token = QuorumToken(tokenAddress);
    }

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyTokenHolder() {
        require(token.balanceOf(msg.sender) > 0, "Quorum: must hold tokens to propose");
        _;
    }

    modifier proposalExists(uint256 id) {
        require(id > 0 && id <= proposalCount, "Quorum: proposal does not exist");
        _;
    }

    // ─── Write functions ──────────────────────────────────────────────────────

    /**
     * @dev Create a new proposal. Caller must hold at least 1 QRM token.
     * @param title Short title of the proposal.
     * @param description Full description.
     * @param votingPeriodDays How many days the vote stays open (1–30).
     */
    function propose(
        string calldata title,
        string calldata description,
        uint256 votingPeriodDays
    ) external onlyTokenHolder returns (uint256) {
        require(bytes(title).length > 0, "Quorum: title required");
        require(bytes(title).length <= 120, "Quorum: title too long");
        require(bytes(description).length > 0, "Quorum: description required");
        require(votingPeriodDays >= 1 && votingPeriodDays <= 30, "Quorum: 1-30 days");

        proposalCount++;
        uint256 id = proposalCount;
        uint256 deadline = block.timestamp + (votingPeriodDays * 1 days);

        proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            title: title,
            description: description,
            deadline: deadline,
            yesVotes: 0,
            noVotes: 0,
            resolved: false,
            state: State.Active
        });

        emit ProposalCreated(id, msg.sender, title, deadline);
        return id;
    }

    /**
     * @dev Cast a vote on an active proposal.
     * Vote weight = caller's current token balance.
     */
    function vote(uint256 id, bool voteYes)
        external
        proposalExists(id)
    {
        Proposal storage p = proposals[id];
        require(block.timestamp < p.deadline, "Quorum: voting period ended");
        require(!p.resolved, "Quorum: already resolved");
        require(!votes[id][msg.sender].hasVoted, "Quorum: already voted");

        uint256 weight = token.balanceOf(msg.sender);
        require(weight > 0, "Quorum: no tokens to vote with");

        votes[id][msg.sender] = VoteRecord({
            hasVoted: true,
            votedYes: voteYes,
            weight: weight
        });

        if (voteYes) {
            p.yesVotes += weight;
        } else {
            p.noVotes += weight;
        }

        _votedOn[msg.sender].push(id);
        emit VoteCast(id, msg.sender, voteYes, weight);
    }

    /**
     * @dev Resolve a proposal after its deadline. Anyone can call this.
     * Approved if yesVotes > noVotes (and at least 1 vote was cast).
     */
    function resolve(uint256 id) external proposalExists(id) {
        Proposal storage p = proposals[id];
        require(block.timestamp >= p.deadline, "Quorum: voting still active");
        require(!p.resolved, "Quorum: already resolved");

        p.resolved = true;
        uint256 total = p.yesVotes + p.noVotes;

        if (total > 0 && p.yesVotes > p.noVotes) {
            p.state = State.Approved;
        } else {
            p.state = State.Rejected;
        }

        emit ProposalResolved(id, p.state);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    /**
     * @dev Returns all proposals as an array.
     */
    function getAllProposals() external view returns (Proposal[] memory) {
        Proposal[] memory all = new Proposal[](proposalCount);
        for (uint256 i = 1; i <= proposalCount; i++) {
            all[i - 1] = proposals[i];
        }
        return all;
    }

    /**
     * @dev Returns the vote record for a specific voter on a proposal.
     */
    function getVote(uint256 id, address voter)
        external
        view
        returns (bool hasVoted, bool votedYes, uint256 weight)
    {
        VoteRecord memory r = votes[id][voter];
        return (r.hasVoted, r.votedYes, r.weight);
    }

    /**
     * @dev Returns proposal IDs that a voter has voted on.
     */
    function getVotedOn(address voter) external view returns (uint256[] memory) {
        return _votedOn[voter];
    }

    /**
     * @dev Returns the current state of a proposal, accounting for
     * unresolved-but-expired proposals (shows as Rejected if no votes,
     * otherwise Approved/Rejected based on counts).
     */
    function getEffectiveState(uint256 id)
        external
        view
        proposalExists(id)
        returns (State)
    {
        Proposal memory p = proposals[id];
        if (p.resolved) return p.state;
        if (block.timestamp < p.deadline) return State.Active;
        // Expired but not yet resolved — compute state
        uint256 total = p.yesVotes + p.noVotes;
        if (total > 0 && p.yesVotes > p.noVotes) return State.Approved;
        return State.Rejected;
    }
}
