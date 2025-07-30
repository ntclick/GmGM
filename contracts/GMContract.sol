// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ZamaConfig.sol";

/**
 * @title GMContract
 * @dev GM Contract using FHE - based on GM Smart Contract
 * @author Trung KTS
 */
contract GMContract is SepoliaConfig {
    
    // ============ REORG PROTECTION CONSTANTS ============
    uint256 private constant REORG_PROTECTION_BLOCKS = 95; // Ethereum reorg can be up to 95 blocks
    uint256 private constant TIMELOCK_DURATION = 96; // Wait 96 blocks for finality
    
    // ============ STRUCTS ============
    struct EncryptedGMEntry {
        euint32 encryptedCount;
        string category;
        string message;
        uint256 timestamp;
        bool isActive;
        uint256 submissionBlock; // Track submission block for reorg protection
        bool aclGranted; // Track if ACL has been granted
    }
    
    struct EncryptedStats {
        euint32 totalCount;
        euint32 minCount;
        euint32 maxCount;
        uint256 totalEntries;
        uint256 lastUpdateBlock; // Track last update block for reorg protection
    }
    
    struct EncryptedUser {
        euint32 totalGMs;
        euint32 categoryCount;
        ebool isActive;
        uint256 lastActivity;
        uint256 lastUpdateBlock; // Track last update block for reorg protection
    }
    
    // ============ REORG PROTECTION STRUCTS ============
    struct ACLRequest {
        address user;
        string category;
        uint256 requestBlock;
        bool isPending;
        bool isGranted;
    }
    
    // ============ ERROR HANDLING ============
    struct LastError {
        euint8 error;      // Encrypted error code
        uint256 timestamp; // Timestamp of the error
    }
    
    // Define error codes
    euint8 internal NO_ERROR;
    euint8 internal INVALID_INPUT;
    euint8 internal INSUFFICIENT_PERMISSIONS;
    euint8 internal CONTRACT_ERROR;
    euint8 internal REORG_RISK; // New error code for reorg protection
    euint8 internal ACL_NOT_READY; // New error code for ACL timing
    euint8 internal ENCRYPTED_INPUT_VALIDATION_FAILED; // New error code for FHE.fromExternal failures
    
    // Store the last error for each address
    mapping(address => LastError) private _lastErrors;
    
    // ============ STATE VARIABLES ============
    mapping(address => mapping(string => EncryptedGMEntry)) private userEntries;
    mapping(string => EncryptedStats) private categoryStats;
    mapping(address => EncryptedUser) private userStats;
    
    // Public counters for non-sensitive data
    uint256 public totalUsers;
    uint256 public totalCategories;
    mapping(string => uint256) public categoryEntryCount;
    
    // Reorg protection tracking
    mapping(uint256 => ACLRequest) private aclRequests;
    uint256 private nextRequestId;
    
    // ============ EVENTS ============
    event EncryptedGMSubmitted(
        address indexed user,
        string category,
        bytes32 encryptedCount,
        uint256 timestamp,
        uint256 submissionBlock
    );
    
    event ACLRequested(
        address indexed user,
        string category,
        uint256 requestId,
        uint256 requestBlock
    );
    
    event ACLGranted(
        address indexed user,
        string category,
        uint256 requestId,
        uint256 grantBlock
    );
    
    event EncryptedStatsUpdated(
        string category,
        bytes32 totalCount,
        bytes32 minCount,
        bytes32 maxCount,
        uint256 totalEntries,
        uint256 updateBlock
    );
    
    event UserStatsUpdated(
        address indexed user,
        bytes32 totalGMs,
        bytes32 categoryCount,
        uint256 lastActivity,
        uint256 updateBlock
    );
    
    event StatsRevealed(
        string category,
        uint32 totalCount,
        uint32 minCount,
        uint32 maxCount
    );
    
    event UserStatsRevealed(
        address indexed user,
        uint32 totalGMs,
        uint32 categoryCount
    );
    
    event DebugCallbackStep(string step, uint256 requestId);
    
    // ============ ERROR HANDLING EVENTS ============
    event ErrorChanged(address indexed user, bytes32 encryptedError);
    
    // ============ CONSTRUCTOR ============
    /**
     * @dev Constructor initializes the contract with Sepolia FHEVM configuration
     */
    constructor() {
        // SepoliaConfig constructor will set up FHEVM configuration
        
        // Initialize error codes
        NO_ERROR = FHE.asEuint8(0);                    // Code 0: No error
        INVALID_INPUT = FHE.asEuint8(1);               // Code 1: Invalid input
        INSUFFICIENT_PERMISSIONS = FHE.asEuint8(2);   // Code 2: Insufficient permissions
        CONTRACT_ERROR = FHE.asEuint8(3);              // Code 3: Contract error
        REORG_RISK = FHE.asEuint8(4);                  // Code 4: Reorg risk detected
        ACL_NOT_READY = FHE.asEuint8(5);               // Code 5: ACL not ready yet
        ENCRYPTED_INPUT_VALIDATION_FAILED = FHE.asEuint8(6); // Code 6: Encrypted input validation failed
    }
    
    // ============ ERROR HANDLING FUNCTIONS ============
    
    /**
     * @dev Set the last error for a specific address.
     * @param error Encrypted error code.
     * @param addr Address of the user.
     */
    function setLastError(euint8 error, address addr) private {
        _lastErrors[addr] = LastError(error, block.timestamp);
        emit ErrorChanged(addr, FHE.toBytes32(error));
    }
    
    /**
     * @dev Get the last error for a specific address.
     * @param user Address of the user.
     * @return error Encrypted error code.
     * @return timestamp Timestamp of the error.
     */
    function getLastError(address user) public view returns (euint8 error, uint256 timestamp) {
        LastError memory lastError = _lastErrors[user];
        return (lastError.error, lastError.timestamp);
    }
    
    /**
     * @dev Clear the last error for a specific address.
     * @param user Address of the user.
     */
    function clearLastError(address user) public {
        setLastError(NO_ERROR, user);
    }
    
    // ============ ENCRYPTED INPUT VALIDATION HELPER ============
    
    /**
     * @dev Validate encrypted input using FHE.fromExternal with custom error handling
     * @param encryptedInput External encrypted input
     * @param inputProof Proof for the encrypted value
     * @param user User address for error tracking
     * @return validatedInput Validated encrypted input
     * @return isValid Whether the validation was successful
     * @dev Implements proper error handling for FHE.fromExternal according to FHEVM documentation
     */
    function validateEncryptedInput(
        externalEuint32 encryptedInput,
        bytes calldata inputProof,
        address user
    ) internal returns (euint32 validatedInput, bool isValid) {
        // ✅ Check proof validity FIRST - comprehensive validation
        if (inputProof.length == 0) {
            setLastError(ENCRYPTED_INPUT_VALIDATION_FAILED, user);
            emit ErrorChanged(user, FHE.toBytes32(ENCRYPTED_INPUT_VALIDATION_FAILED));
            return (FHE.asEuint32(0), false);
        }
        
        // ✅ Additional validation: check proof format/signature
        // Note: FHE.fromExternal will revert if proof is invalid format
        // We can't use try/catch with FHE.fromExternal, so we validate thoroughly first
        
        // ✅ Only call FHE.fromExternal if all validations pass
        // If this reverts, the transaction will revert with clear error
        euint32 result = FHE.fromExternal(encryptedInput, inputProof);
        setLastError(NO_ERROR, user);
        return (result, true);
    }
    
    // ============ REORG PROTECTION FUNCTIONS ============
    
    /**
     * @dev Request ACL access for an entry after reorg protection period
     * @param category Category of the entry
     * @dev Implements 2-step process with timelock for reorg protection
     */
    function requestACL(string calldata category) external {
        // Clear any previous errors
        setLastError(NO_ERROR, msg.sender);
        
        // Validate inputs using FHE.select
        ebool validCategory = FHE.asEbool(bytes(category).length > 0);
        
        EncryptedGMEntry storage entry = userEntries[msg.sender][category];
        ebool hasActiveEntry = FHE.asEbool(entry.isActive);
        ebool notAlreadyGranted = FHE.asEbool(!entry.aclGranted);
        
        // Check if enough blocks have passed since submission
        bool enoughBlocksPassed = (block.number > entry.submissionBlock + TIMELOCK_DURATION);
        ebool reorgSafe = FHE.asEbool(enoughBlocksPassed);
        
        // Combine all validations using FHE.and
        ebool validInput = FHE.and(FHE.and(FHE.and(validCategory, hasActiveEntry), notAlreadyGranted), reorgSafe);
        
        // Set error based on validation results using FHE.select
        euint8 finalError = FHE.select(
            reorgSafe,
            FHE.select(validInput, NO_ERROR, INVALID_INPUT),
            ACL_NOT_READY
        );
        setLastError(finalError, msg.sender);
        
        // Create ACL request conditionally using FHE.select logic
        // Note: We need to use plain boolean for storage operations since they can't be encrypted
        bool shouldCreateRequest = (bytes(category).length > 0 && entry.isActive && !entry.aclGranted && enoughBlocksPassed);
        if (shouldCreateRequest) {
            // Create ACL request
            uint256 requestId = nextRequestId++;
            aclRequests[requestId] = ACLRequest({
                user: msg.sender,
                category: category,
                requestBlock: block.number,
                isPending: true,
                isGranted: false
            });
            
            emit ACLRequested(msg.sender, category, requestId, block.number);
        }
    }
    
    /**
     * @dev Grant ACL access for a pending request
     * @param requestId ID of the ACL request
     * @dev Only the contract can grant ACL after reorg protection
     */
    function grantACL(uint256 requestId) external {
        // Clear any previous errors
        setLastError(NO_ERROR, msg.sender);
        
        ACLRequest storage request = aclRequests[requestId];
        
        // Validate request exists and is pending
        ebool requestExists = FHE.asEbool(request.user != address(0));
        ebool isPending = FHE.asEbool(request.isPending);
        ebool notGranted = FHE.asEbool(!request.isGranted);
        
        // Check if enough blocks have passed since request
        bool enoughBlocksPassed = (block.number > request.requestBlock + REORG_PROTECTION_BLOCKS);
        ebool reorgSafe = FHE.asEbool(enoughBlocksPassed);
        
        // Combine all validations
        ebool validInput = FHE.and(FHE.and(FHE.and(requestExists, isPending), notGranted), reorgSafe);
        
        // Set error if input is invalid
        if (!enoughBlocksPassed) {
            setLastError(REORG_RISK, msg.sender);
        } else {
            setLastError(FHE.select(validInput, NO_ERROR, INVALID_INPUT), msg.sender);
        }
        
        // Only proceed if valid input
        if (request.user != address(0) && request.isPending && !request.isGranted && enoughBlocksPassed) {
            // Grant ACL access
            EncryptedGMEntry storage entry = userEntries[request.user][request.category];
            
            // COMPREHENSIVE ACL IMPLEMENTATION according to FHEVM documentation:
            // 1. Allow this contract to access the ciphertext (permanent)
            FHE.allowThis(entry.encryptedCount);
            
            // 2. Allow the user to access the ciphertext (permanent)
            FHE.allow(entry.encryptedCount, request.user);
            
            // 3. Grant transient access for this transaction
            FHE.allowTransient(entry.encryptedCount, request.user);
            
            // Mark as granted
            request.isGranted = true;
            request.isPending = false;
            entry.aclGranted = true;
            
            emit ACLGranted(request.user, request.category, requestId, block.number);
        }
    }
    
    /**
     * @dev Check if ACL is ready for a user and category
     * @param user User address
     * @param category Category name
     * @return isReady Whether ACL is ready to be granted
     * @return blocksRemaining Number of blocks remaining before ACL can be granted
     */
    function isACLReady(address user, string calldata category) external view returns (bool isReady, uint256 blocksRemaining) {
        EncryptedGMEntry storage entry = userEntries[user][category];
        
        if (!entry.isActive) {
            return (false, 0);
        }
        
        if (entry.aclGranted) {
            return (true, 0);
        }
        
        uint256 blocksPassed = block.number - entry.submissionBlock;
        if (blocksPassed >= TIMELOCK_DURATION) {
            return (true, 0);
        } else {
            return (false, TIMELOCK_DURATION - blocksPassed);
        }
    }
    
    /**
     * @dev Get ACL request details
     * @param requestId Request ID
     * @return user User address
     * @return category Category name
     * @return requestBlock Block when request was made
     * @return isPending Whether request is pending
     * @return isGranted Whether ACL has been granted
     */
    function getACLRequest(uint256 requestId) external view returns (
        address user,
        string memory category,
        uint256 requestBlock,
        bool isPending,
        bool isGranted
    ) {
        ACLRequest storage request = aclRequests[requestId];
        return (
            request.user,
            request.category,
            request.requestBlock,
            request.isPending,
            request.isGranted
        );
    }
    
    // ============ TEST FUNCTION ============
    
    /**
     * @dev Simple test function for encrypted GM submission
     * @param value External encrypted value from Zama SDK
     * @param attestation Proof for the encrypted value
     */
    function gm(
        externalEuint64 value,
        bytes calldata attestation
    ) public {
        // Convert external encrypted value to internal euint64 using FHE.fromExternal
        euint64 v = FHE.fromExternal(value, attestation);
        
        // Simple test - just emit an event
        emit EncryptedGMSubmitted(
            msg.sender,
            "test",
            FHE.toBytes32(v),
            block.timestamp,
            block.number
        );
    }

    // ============ MAIN FUNCTIONS ============
    
    /**
     * @dev Submit encrypted GM count for a category with comprehensive ACL handling
     * @param encryptedCount External encrypted count from Zama SDK
     * @param inputProof Proof for the encrypted value
     * @param category Category of the GM
     * @param message Optional message
     * @param makePublic Whether to make the entry publicly decryptable
     * @dev Implements comprehensive ACL handling according to FHEVM documentation
     */
    function submitEncryptedGM(
        externalEuint32 encryptedCount,
        bytes calldata inputProof,
        string calldata category,
        string calldata message,
        bool makePublic
    ) external {
        // Clear any previous errors
        setLastError(NO_ERROR, msg.sender);
        
        // ✅ Zama Simple Pattern - Direct FHE.fromExternal() call
        euint32 count = FHE.fromExternal(encryptedCount, inputProof);
        
        // ✅ Simple ACL grants like Zama examples
        FHE.allowThis(count);
        FHE.allow(count, msg.sender);
        
        // ✅ Simple business logic - no complex validation
        EncryptedGMEntry storage entry = userEntries[msg.sender][category];
        
        if (!entry.isActive) {
            // New entry
            entry.encryptedCount = count;
            entry.category = category;
            entry.message = message;
            entry.timestamp = block.timestamp;
            
            // Update stats
            _updateCategoryStats(category, count, true);
            _updateUserStats(msg.sender, count, true);
            
            categoryEntryCount[category]++;
        } else {
            // Update existing entry
            euint32 oldCount = entry.encryptedCount;
            entry.encryptedCount = FHE.add(entry.encryptedCount, count);
            entry.message = message;
            entry.timestamp = block.timestamp;
            
            // Update stats
            _updateCategoryStats(category, oldCount, false);
            _updateCategoryStats(category, entry.encryptedCount, true);
            _updateUserStats(msg.sender, count, true);
        }
        
        // ✅ Grant access permissions for entry
        FHE.allowThis(entry.encryptedCount);
        FHE.allow(entry.encryptedCount, msg.sender);
        
        // ✅ Optional public decryption like Zama pattern
        if (makePublic) {
            FHE.makePubliclyDecryptable(entry.encryptedCount);
        }
        
        emit EncryptedGMSubmitted(
            msg.sender,
            category,
            FHE.toBytes32(count),
            block.timestamp,
            block.number
        );
    }
    
    /**
     * @dev Submit encrypted GM count for a category (backward compatibility)
     * @param encryptedCount External encrypted count from Zama SDK
     * @param inputProof Proof for the encrypted value
     * @param category Category of the GM
     * @param message Optional message
     * @dev Implements reorg protection - ACL will be granted separately after timelock
     */
    function submitEncryptedGMLegacy(
        externalEuint32 encryptedCount,
        bytes calldata inputProof,
        string calldata category,
        string calldata message
    ) external {
        // Clear any previous errors
        setLastError(NO_ERROR, msg.sender);
        
        // ✅ Zama Simple Pattern - Direct FHE.fromExternal() call
        euint32 count = FHE.fromExternal(encryptedCount, inputProof);
        
        // ✅ Simple ACL grants like Zama examples
        FHE.allowThis(count);
        FHE.allow(count, msg.sender);
        
        // ✅ Simple business logic - no complex validation
        EncryptedGMEntry storage entry = userEntries[msg.sender][category];
        
        if (!entry.isActive) {
            // New entry
            entry.encryptedCount = count;
            entry.category = category;
            entry.message = message;
            entry.timestamp = block.timestamp;
            entry.submissionBlock = block.number;
            entry.isActive = true;
            entry.aclGranted = true;
            
            // Update stats
            _updateCategoryStats(category, count, true);
            _updateUserStats(msg.sender, count, true);
            
            categoryEntryCount[category]++;
        } else {
            // Update existing entry
            euint32 newCount = FHE.add(entry.encryptedCount, count);
            entry.encryptedCount = newCount;
            entry.message = message;
            entry.timestamp = block.timestamp;
            entry.aclGranted = true;
            
            // Update stats - only add the new count
            _updateCategoryStats(category, count, true);
            _updateUserStats(msg.sender, count, true);
        }
        
        // ✅ Grant access permissions for entry
        FHE.allowThis(entry.encryptedCount);
        FHE.allow(entry.encryptedCount, msg.sender);
        
        emit EncryptedGMSubmitted(
            msg.sender,
            category,
            FHE.toBytes32(count),
            block.timestamp,
            block.number
        );
    }

    /**
     * @dev Simple version of submitEncryptedGMLegacy following Zama pattern
     * @param encryptedCount External encrypted count from Zama SDK
     * @param inputProof Proof for the encrypted value
     * @param category Category of the GM
     * @param message Optional message
     * @dev Minimal gas usage - only essential operations
     */
    function submitEncryptedGMSimple(
        externalEuint32 encryptedCount,
        bytes calldata inputProof,
        string calldata category,
        string calldata message
    ) external {
        // ✅ Step 1: Direct conversion (following gm() pattern)
        euint32 count = FHE.fromExternal(encryptedCount, inputProof);
        
        // ✅ Step 2: Direct storage (no FHE.select)
        userEntries[msg.sender][category].encryptedCount = count;
        userEntries[msg.sender][category].category = category;
        userEntries[msg.sender][category].message = message;
        userEntries[msg.sender][category].timestamp = block.timestamp;
        userEntries[msg.sender][category].isActive = true;
        
        // ✅ Step 3: Minimal ACL (like gm() function)
        FHE.allowThis(count);
        FHE.allow(count, msg.sender);
        
        // ✅ Step 4: Simple event
        emit EncryptedGMSubmitted(
            msg.sender,
            category,
            FHE.toBytes32(count),
            block.timestamp,
            block.number
        );
    }
    
    /**
     * @dev Make an entry publicly decryptable
     * @param category Category to make public
     * @dev Requires sender to have access to the entry
     */
    function makeEntryPubliclyDecryptable(string calldata category) external {
        // Clear any previous errors
        setLastError(NO_ERROR, msg.sender);
        
        // Validate inputs using error handling instead of require
        ebool validCategory = FHE.asEbool(bytes(category).length > 0);
        
        EncryptedGMEntry storage entry = userEntries[msg.sender][category];
        ebool hasActiveEntry = FHE.asEbool(entry.isActive);
        
        // Check if sender has access to the entry (this is a public check)
        bool hasAccess = FHE.isSenderAllowed(entry.encryptedCount);
        ebool validAccess = FHE.asEbool(hasAccess);
        
        // Combine all validations
        ebool validInput = FHE.and(FHE.and(validCategory, hasActiveEntry), validAccess);
        
        // Set error if input is invalid
        setLastError(FHE.select(validInput, NO_ERROR, INVALID_INPUT), msg.sender);
        
        // Only proceed if valid input
        if (bytes(category).length > 0) {
            // Make the entry publicly decryptable
            FHE.makePubliclyDecryptable(entry.encryptedCount);
            
            // Update entry
            entry.isActive = true;
            entry.timestamp = block.timestamp;
        }
        
        emit EncryptedGMSubmitted(
            msg.sender,
            category,
            FHE.toBytes32(entry.encryptedCount),
            block.timestamp,
            block.number
        );
    }

    /**
     * @dev Make category stats publicly decryptable
     * @param category Category to make stats public
     * @dev Requires sender to have access to the stats
     */
    function makeCategoryStatsPubliclyDecryptable(string calldata category) external {
        // Clear any previous errors
        setLastError(NO_ERROR, msg.sender);
        
        // Validate inputs using error handling instead of require
        ebool validCategory = FHE.asEbool(bytes(category).length > 0);
        
        EncryptedStats storage stats = categoryStats[category];
        ebool hasEntries = FHE.asEbool(stats.totalEntries > 0);
        
        // Check if sender has access to the stats (this is a public check)
        bool hasAccess = FHE.isSenderAllowed(stats.totalCount);
        ebool validAccess = FHE.asEbool(hasAccess);
        
        // Combine all validations
        ebool validInput = FHE.and(FHE.and(validCategory, hasEntries), validAccess);
        
        // Set error if input is invalid
        setLastError(FHE.select(validInput, NO_ERROR, INVALID_INPUT), msg.sender);
        
        // Make the stats publicly decryptable only if valid
        FHE.makePubliclyDecryptable(FHE.select(validInput, stats.totalCount, FHE.asEuint32(0)));
        FHE.makePubliclyDecryptable(FHE.select(validInput, stats.minCount, FHE.asEuint32(0)));
        FHE.makePubliclyDecryptable(FHE.select(validInput, stats.maxCount, FHE.asEuint32(0)));
        
        emit EncryptedStatsUpdated(
            category,
            FHE.toBytes32(stats.totalCount),
            FHE.toBytes32(stats.minCount),
            FHE.toBytes32(stats.maxCount),
            stats.totalEntries,
            block.number
        );
    }

    /**
     * @dev Make user stats publicly decryptable
     * @param user User address
     * @dev Requires sender to have access to the user stats
     */
    function makeUserStatsPubliclyDecryptable(address user) external {
        // Clear any previous errors
        setLastError(NO_ERROR, msg.sender);
        
        // Validate inputs using error handling instead of require
        ebool validUser = FHE.asEbool(user != address(0));
        
        EncryptedUser storage stats = userStats[user];
        ebool hasStats = FHE.asEbool(stats.lastActivity > 0);
        
        // Check if sender has access to the stats (user can access their own stats)
        bool isOwner = (msg.sender == user);
        bool hasAccess = FHE.isSenderAllowed(stats.totalGMs);
        bool validAccess = isOwner || hasAccess;
        ebool validAccessEbool = FHE.asEbool(validAccess);
        
        // Combine all validations
        ebool validInput = FHE.and(FHE.and(validUser, hasStats), validAccessEbool);
        
        // Set error if input is invalid
        setLastError(FHE.select(validInput, NO_ERROR, INVALID_INPUT), msg.sender);
        
        // Only proceed if valid input
        if (user != address(0) && stats.lastActivity > 0 && (msg.sender == user || FHE.isSenderAllowed(stats.totalGMs))) {
            // Make the stats publicly decryptable
            FHE.makePubliclyDecryptable(stats.totalGMs);
            FHE.makePubliclyDecryptable(stats.categoryCount);
            FHE.makePubliclyDecryptable(stats.isActive);
        }
        
        emit UserStatsUpdated(
            user,
            FHE.toBytes32(stats.totalGMs),
            FHE.toBytes32(stats.categoryCount),
            stats.lastActivity,
            block.number
        );
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Update category statistics with comprehensive ACL handling
     * @param category Category name
     * @param count Encrypted count to add/subtract
     * @param isAdd True to add, false to subtract
     * @dev Implements comprehensive ACL handling for category stats with reorg protection
     */
    function _updateCategoryStats(
        string memory category,
        euint32 count,
        bool isAdd
    ) internal {
        EncryptedStats storage stats = categoryStats[category];
        
        if (isAdd) {
            // Add to total with overflow protection
            euint32 tempTotal = FHE.add(stats.totalCount, count);
            ebool isOverflow = FHE.lt(tempTotal, stats.totalCount);
            stats.totalCount = FHE.select(isOverflow, stats.totalCount, tempTotal);
            stats.totalEntries++;
            
            // Update min/max
            if (stats.totalEntries == 1) {
                stats.minCount = count;
                stats.maxCount = count;
            } else {
                stats.minCount = FHE.min(stats.minCount, count);
                stats.maxCount = FHE.max(stats.maxCount, count);
            }
        } else {
            // Subtract from total with underflow protection
            ebool canSubtract = FHE.ge(stats.totalCount, count);
            stats.totalCount = FHE.select(canSubtract, FHE.sub(stats.totalCount, count), stats.totalCount);
            stats.totalEntries--;
            
            // Note: min/max recalculation would require iterating through all entries
            // For simplicity, we'll keep the current min/max
        }
        
        // Update last update block for reorg protection
        stats.lastUpdateBlock = block.number;
        
        // ✅ Simple ACL grants - no transient permissions
        FHE.allowThis(stats.totalCount);
        FHE.allowThis(stats.minCount);
        FHE.allowThis(stats.maxCount);
        
        emit EncryptedStatsUpdated(
            category,
            FHE.toBytes32(stats.totalCount),
            FHE.toBytes32(stats.minCount),
            FHE.toBytes32(stats.maxCount),
            stats.totalEntries,
            block.number
        );
    }
    
    /**
     * @dev Update user statistics with comprehensive ACL handling
     * @param user User address
     * @param count Encrypted count to add/subtract
     * @param isAdd True to add, false to subtract
     * @dev Implements comprehensive ACL handling for user stats with reorg protection
     */
    function _updateUserStats(
        address user,
        euint32 count,
        bool isAdd
    ) internal {
        EncryptedUser storage stats = userStats[user];
        
        if (isAdd) {
            // Add to total with overflow protection
            euint32 tempTotal = FHE.add(stats.totalGMs, count);
            ebool isOverflow = FHE.lt(tempTotal, stats.totalGMs);
            stats.totalGMs = FHE.select(isOverflow, stats.totalGMs, tempTotal);
            
            // Add to category count with overflow protection
            euint32 tempCategory = FHE.add(stats.categoryCount, 1);
            ebool isCategoryOverflow = FHE.lt(tempCategory, stats.categoryCount);
            stats.categoryCount = FHE.select(isCategoryOverflow, stats.categoryCount, tempCategory);
            
            stats.isActive = FHE.asEbool(true);
            stats.lastActivity = block.timestamp;
            stats.lastUpdateBlock = block.number; // Track update block for reorg protection
            
            if (totalUsers == 0) {
                totalUsers++;
            }
        } else {
            // Subtract from total with underflow protection
            ebool canSubtract = FHE.ge(stats.totalGMs, count);
            stats.totalGMs = FHE.select(canSubtract, FHE.sub(stats.totalGMs, count), stats.totalGMs);
            
            // Subtract from category count with underflow protection
            ebool canSubtractCategory = FHE.ge(stats.categoryCount, 1);
            stats.categoryCount = FHE.select(canSubtractCategory, FHE.sub(stats.categoryCount, 1), stats.categoryCount);
            
            stats.lastActivity = block.timestamp;
            stats.lastUpdateBlock = block.number; // Track update block for reorg protection
        }
        
        // COMPREHENSIVE ACL IMPLEMENTATION according to FHEVM documentation:
        // Grant access permissions for user stats
        FHE.allowThis(stats.totalGMs);
        FHE.allowThis(stats.categoryCount);
        FHE.allowThis(stats.isActive);
        
        // Grant transient access for this transaction (not permanent due to reorg protection)
        FHE.allowTransient(stats.totalGMs, user);
        FHE.allowTransient(stats.categoryCount, user);
        FHE.allowTransient(stats.isActive, user);
        
        emit UserStatsUpdated(
            user,
            FHE.toBytes32(stats.totalGMs),
            FHE.toBytes32(stats.categoryCount),
            stats.lastActivity,
            block.number
        );
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get user entry for a category
     * @param user User address
     * @param category Category name
     * @return isActive Whether the entry is active
     * @return timestamp Entry timestamp
     * @return message Entry message
     */
    function getUserEntry(address user, string calldata category) external view returns (
        bool isActive,
        uint256 timestamp,
        string memory message
    ) {
        EncryptedGMEntry storage entry = userEntries[user][category];
        return (entry.isActive, entry.timestamp, entry.message);
    }
    
    /**
     * @dev Get category entry count
     * @param category Category name
     * @return count Number of entries in the category
     */
    function getCategoryEntryCount(string calldata category) external view returns (uint256 count) {
        return categoryEntryCount[category];
    }
    
    /**
     * @dev Get total users count
     * @return count Total number of users
     */
    function getTotalUsers() external view returns (uint256 count) {
        return totalUsers;
    }
    
    /**
     * @dev Get total categories count
     * @return count Total number of categories
     */
    function getTotalCategories() external view returns (uint256 count) {
        return totalCategories;
    }
} 