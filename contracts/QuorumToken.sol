// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title QuorumToken
 * @dev Non-transferable governance token. Only the owner (deployer) can mint.
 * Tokens represent membership/reputation, not tradeable value.
 * Transfer and approval functions are disabled to keep this simple and
 * safe for a governance-only use case.
 */
contract QuorumToken is ERC20, Ownable {
    // Track all token holders for enumeration
    address[] private _holders;
    mapping(address => bool) private _isHolder;

    event TokensMinted(address indexed to, uint256 amount);

    constructor() ERC20("Quorum Token", "QRM") Ownable(msg.sender) {}

    /**
     * @dev Mint governance tokens to an address. Only owner can call.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        if (!_isHolder[to]) {
            _isHolder[to] = true;
            _holders.push(to);
        }
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Returns all addresses that have ever held tokens.
     */
    function getHolders() external view returns (address[] memory) {
        return _holders;
    }

    // ─── Non-transferable: disable all transfer mechanisms ───────────────────

    function transfer(address, uint256) public pure override returns (bool) {
        revert("QuorumToken: non-transferable");
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("QuorumToken: non-transferable");
    }

    function approve(address, uint256) public pure override returns (bool) {
        revert("QuorumToken: non-transferable");
    }
}
