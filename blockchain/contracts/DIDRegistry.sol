// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {AccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title Rivalidate DID Registry
/// @notice Allows each address to mint one `did:base:0x…`, update its document pointer,
///         and lets admins (or agents delegated by admins) pre-mint DIDs for any account.
contract DIDRegistry is AccessControlEnumerable {
    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");
    bytes32 public constant AGENT_ROLE  = keccak256("AGENT_ROLE");

    struct DIDDocument {
        string uri;
        bytes32 docHash;
    }

    /// owner → DID string
    mapping(address => string) public didOf;
    /// DID string → document metadata
    mapping(string => DIDDocument) public documentOf;

    event DIDCreated(address indexed owner, string did, bytes32 docHash);
    event DIDDocumentUpdated(string indexed did, string uri, bytes32 docHash);

    /**
     * @param admin   The primary administrator that must always hold DEFAULT_ADMIN_ROLE
     *                and ADMIN_ROLE for off-chain integrations.
     *
     * NOTE: The constructor now also assigns both roles to the deploying account (`msg.sender`)
     *       so that post-deployment scripts executed by the deployer can immediately exercise
     *       privileged functions such as `adminCreateDID` even when the deployer address
     *       differs from `admin`.
     */
    constructor(address admin) {
        address deployer = msg.sender;

        // Core administrator supplied via constructor
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);

        // Ensure the deploying account is not locked out of admin functions
        if (deployer != admin) {
            _grantRole(DEFAULT_ADMIN_ROLE, deployer);
            _grantRole(ADMIN_ROLE, deployer);
        }

        // Admins manage the AGENT_ROLE
        _setRoleAdmin(AGENT_ROLE, ADMIN_ROLE);
    }

    /* -------------------------------------------------------------------------- */
    /*                               I N T E R N A L                              */
    /* -------------------------------------------------------------------------- */

    function _deriveDID(address owner) private pure returns (string memory) {
        return string.concat("did:base:", Strings.toHexString(uint160(owner), 20));
    }

    /* -------------------------------------------------------------------------- */
    /*                                   M I N T                                  */
    /* -------------------------------------------------------------------------- */

    /// @notice Mint a new DID for the caller.
    /// @param docHash Optional keccak-256 hash of the initial DID document (zero for none).
    function createDID(bytes32 docHash) external {
        require(bytes(didOf[msg.sender]).length == 0, "DID already exists");
        string memory did = _deriveDID(msg.sender);

        didOf[msg.sender] = did;
        documentOf[did] = DIDDocument({uri: "", docHash: docHash});

        emit DIDCreated(msg.sender, did, docHash);
    }

    /// @notice Admin or Agent helper to mint a DID for `owner` without their signature.
    function adminCreateDID(address owner, bytes32 docHash) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(AGENT_ROLE, msg.sender),
            "Not authorised"
        );
        require(owner != address(0), "Owner is zero");
        require(bytes(didOf[owner]).length == 0, "DID already exists");

        string memory did = _deriveDID(owner);
        didOf[owner] = did;
        documentOf[did] = DIDDocument({uri: "", docHash: docHash});

        emit DIDCreated(owner, did, docHash);
    }

    /* -------------------------------------------------------------------------- */
    /*                                 U P D A T E                                */
    /* -------------------------------------------------------------------------- */

    /// @notice Update the caller’s DID document pointer/hash.
    function setDocument(string calldata uri, bytes32 hash) external {
        string memory did = didOf[msg.sender];
        require(bytes(did).length != 0, "No DID");

        documentOf[did] = DIDDocument({uri: uri, docHash: hash});
        emit DIDDocumentUpdated(did, uri, hash);
    }

    /// @notice Admin or Agent override for emergencies.
    function adminSetDocument(
        address owner,
        string calldata uri,
        bytes32 hash
    ) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(AGENT_ROLE, msg.sender),
            "Not authorised"
        );
        string memory did = didOf[owner];
        require(bytes(did).length != 0, "Owner has no DID");

        documentOf[did] = DIDDocument({uri: uri, docHash: hash});
        emit DIDDocumentUpdated(did, uri, hash);
    }

    /* -------------------------------------------------------------------------- */
    /*                                   V I E W                                  */
    /* -------------------------------------------------------------------------- */

    function hasDID(address owner) external view returns (bool) {
        return bytes(didOf[owner]).length != 0;
    }

    /* -------------------------------------------------------------------------- */
    /*                                 ERC-165                                    */
    /* -------------------------------------------------------------------------- */

    function supportsInterface(bytes4 id) public view override returns (bool) {
        return id == type(IERC165).interfaceId || super.supportsInterface(id);
    }
}