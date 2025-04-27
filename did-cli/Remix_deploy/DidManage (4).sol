// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/AccessControl.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/Pausable.sol";

contract DidManage is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct DID {
        string publicKey;
        bool exists;
    }

    struct Credential {
        address issuer;
        bytes32 hash;
        bool valid;
        bool suspended;
        uint256 expirationBlock;
        bytes32 schemaId;
        uint256 version;
    }

    struct Presentation {
        bytes32 hash;
        bool valid;
    }

    mapping(address => DID) public dids;
    mapping(address => mapping(bytes32 => Credential)) private _credentialsByHash;
    mapping(address => mapping(bytes32 => Presentation)) private _presentationsByHash;

    error DIDAlreadyExistsError();
    error DIDNotFoundError();
    error NotIssuerError();
    error CredentialNotFoundOrNotIssuerError();
    error CredentialAlreadyExistsError();
    error PresentationNotFoundError();
    error UnauthorizedError();

    event DIDCreatedEvent(address indexed user, string publicKey);
    event DIDUpdatedEvent(address indexed user, string newPublicKey);

    event CredentialIssuedEvent(
        address indexed issuer,
        address indexed holder,
        bytes32 indexed credentialHash,
        uint256 expirationBlock,
        bytes32 schemaId,
        uint256 version
    );
    event CredentialRevokedEvent(address indexed issuer, address indexed holder, bytes32 indexed credentialHash);
    event CredentialSuspendedEvent(address indexed issuer, address indexed holder, bytes32 indexed credentialHash);
    event CredentialUnsuspendedEvent(address indexed issuer, address indexed holder, bytes32 indexed credentialHash);
    event CredentialUpdatedEvent(
        address indexed issuer,
        address indexed holder,
        bytes32 indexed credentialHash,
        uint256 newExpirationBlock,
        bytes32 newSchemaId,
        uint256 newVersion
    );
    event PresentationCreatedEvent(address indexed presenter, bytes32 indexed presentationHash);

    modifier onlyExistingDID(address user) {
        if (!dids[user].exists) revert DIDNotFoundError();
        _;
    }

    modifier onlyIssuer() {
        if (!hasRole(ISSUER_ROLE, msg.sender)) revert NotIssuerError();
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _setRoleAdmin(ISSUER_ROLE, ADMIN_ROLE);
    }

    function createDID(string calldata publicKey) external whenNotPaused {
        if (dids[msg.sender].exists) revert DIDAlreadyExistsError();
        dids[msg.sender] = DID({publicKey: publicKey, exists: true});
        emit DIDCreatedEvent(msg.sender, publicKey);
    }

    function updateDID(string calldata newPublicKey) external whenNotPaused onlyExistingDID(msg.sender) {
        dids[msg.sender].publicKey = newPublicKey;
        emit DIDUpdatedEvent(msg.sender, newPublicKey);
    }

    function issueCredential(
        address holder,
        bytes32 credentialHash,
        uint256 durationInBlocks,
        bytes32 schemaId
    ) external whenNotPaused nonReentrant onlyIssuer onlyExistingDID(msg.sender) onlyExistingDID(holder) {
        Credential storage existing = _credentialsByHash[holder][credentialHash];
        if (existing.valid) revert CredentialAlreadyExistsError();

        uint256 version = 1;
        if (existing.issuer != address(0)) {
            version = existing.version + 1;
        }

        uint256 expirationBlock = durationInBlocks == 0 ? 0 : block.number + durationInBlocks;

        _credentialsByHash[holder][credentialHash] = Credential({
            issuer: msg.sender,
            hash: credentialHash,
            valid: true,
            suspended: false,
            expirationBlock: expirationBlock,
            schemaId: schemaId,
            version: version
        });

        emit CredentialIssuedEvent(msg.sender, holder, credentialHash, expirationBlock, schemaId, version);
    }

    function revokeCredential(address holder, bytes32 credentialHash) external whenNotPaused nonReentrant onlyIssuer {
        Credential storage cred = _credentialsByHash[holder][credentialHash];
        if (cred.issuer != msg.sender || !cred.valid) revert CredentialNotFoundOrNotIssuerError();

        cred.valid = false;
        emit CredentialRevokedEvent(msg.sender, holder, credentialHash);
    }

    function suspendCredential(address holder, bytes32 credentialHash) external whenNotPaused nonReentrant onlyIssuer {
        Credential storage cred = _credentialsByHash[holder][credentialHash];
        if (cred.issuer != msg.sender || !cred.valid || cred.suspended) revert CredentialNotFoundOrNotIssuerError();

        cred.suspended = true;
        emit CredentialSuspendedEvent(msg.sender, holder, credentialHash);
    }

    function unsuspendCredential(address holder, bytes32 credentialHash) external whenNotPaused nonReentrant onlyIssuer {
        Credential storage cred = _credentialsByHash[holder][credentialHash];
        if (cred.issuer != msg.sender || !cred.valid || !cred.suspended) revert CredentialNotFoundOrNotIssuerError();

        cred.suspended = false;
        emit CredentialUnsuspendedEvent(msg.sender, holder, credentialHash);
    }

    function updateCredential(
        address holder,
        bytes32 credentialHash,
        uint256 newDurationInBlocks,
        bytes32 newSchemaId
    ) external whenNotPaused nonReentrant onlyIssuer {
        Credential storage cred = _credentialsByHash[holder][credentialHash];
        if (cred.issuer != msg.sender || !cred.valid) revert CredentialNotFoundOrNotIssuerError();

        uint256 newExpirationBlock = newDurationInBlocks == 0 ? 0 : block.number + newDurationInBlocks;

        cred.expirationBlock = newExpirationBlock;
        cred.schemaId = newSchemaId;
        cred.version += 1;

        emit CredentialUpdatedEvent(msg.sender, holder, credentialHash, newExpirationBlock, newSchemaId, cred.version);
    }

    function getCredential(address holder, bytes32 credentialHash)
        external
        view
        returns (
            address issuer,
            bool valid,
            bool suspended,
            uint256 expirationBlock,
            bytes32 schemaId,
            uint256 version
        )
    {
        Credential storage cred = _credentialsByHash[holder][credentialHash];
        require(cred.issuer != address(0), "Credential not found");
        return (
            cred.issuer,
            cred.valid,
            cred.suspended,
            cred.expirationBlock,
            cred.schemaId,
            cred.version
        );
    }

    function verifyCredential(address holder, bytes32 credentialHash) external view returns (bool isValid) {
        Credential storage cred = _credentialsByHash[holder][credentialHash];
        if (!cred.valid || cred.suspended) return false;
        if (cred.expirationBlock != 0 && block.number > cred.expirationBlock) return false;
        return true;
    }

    function createPresentation(bytes32 presentationHash) external whenNotPaused nonReentrant onlyExistingDID(msg.sender) {
        Presentation storage existing = _presentationsByHash[msg.sender][presentationHash];
        require(!existing.valid, "Presentation already exists");

        _presentationsByHash[msg.sender][presentationHash] = Presentation({
            hash: presentationHash,
            valid: true
        });

        emit PresentationCreatedEvent(msg.sender, presentationHash);
    }

    function getPresentation(address holder, bytes32 presentationHash) external view returns (bool valid) {
        Presentation storage pres = _presentationsByHash[holder][presentationHash];
        require(pres.hash != bytes32(0), "Presentation not found");
        return pres.valid;
    }

    function verifyPresentation(address holder, bytes32 presentationHash) external view returns (bool isValid) {
        Presentation storage pres = _presentationsByHash[holder][presentationHash];
        isValid = pres.valid && pres.hash == presentationHash;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function grantIssuerRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(ISSUER_ROLE, account);
    }

    function revokeIssuerRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(ISSUER_ROLE, account);
    }
}
