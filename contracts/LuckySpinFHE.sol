// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import { FHE, euint8, euint32, externalEuint8, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";

contract LuckySpinFHE is Ownable {
    // ===== 1. PUBLIC POOL REWARDS (KHÔNG CẦN FHE) =====
    struct PoolReward {
        string name;
        string imageUrl;
        uint256 value; // tuỳ ý: số token, id NFT, ...
        uint256 probability; // tỉ lệ trúng (0-10000)
    }
    PoolReward[] public poolRewards;

    // ===== 2. ENCRYPTED USER STATE =====
    mapping(address => euint8) public encryptedSpinCount;         // Số lượt quay còn lại (encrypted)
    mapping(address => euint32) public encryptedScores;           // Điểm số (encrypted)
    mapping(address => euint8) public encryptedLastRewardIndex;   // Pool trúng gần nhất (encrypted)
    mapping(address => euint32) public encryptedTotalSpins;       // Tổng số lần quay (encrypted)
    mapping(address => euint32) public encryptedCheckInDays;      // Số ngày đã điểm danh (encrypted)

    // ===== 3. PUBLIC LEADERBOARD =====
    struct PublicScore {
        address user;
        uint32 score;
        uint32 totalSpins;
        uint32 checkInDays;
        uint256 lastUpdate;
    }
    PublicScore[] public publicLeaderboard;

    // ===== 4. EVENTS =====
    event PoolAdded(uint256 indexed index, string name, string imageUrl, uint256 value, uint256 probability);
    event PoolUpdated(uint256 indexed index, string name, string imageUrl, uint256 value, uint256 probability);
    event PoolRemoved(uint256 indexed index);
    event UserCheckedIn(address indexed user, uint8 spinsAdded);
    event UserSpun(address indexed user, uint8 poolIndex, uint32 points, uint8 spinsLeft);
    event ScoreMadePublic(address indexed user);
    event ScoreSubmitted(address indexed user, uint32 score);

    // ===== 5. ADMIN POOL MANAGEMENT =====
    function addPool(
        string memory name, 
        string memory imageUrl, 
        uint256 value, 
        uint256 probability
    ) external onlyOwner {
        require(probability <= 10000, "Probability must be <= 10000");
        poolRewards.push(PoolReward(name, imageUrl, value, probability));
        emit PoolAdded(poolRewards.length - 1, name, imageUrl, value, probability);
    }

    function updatePool(
        uint256 index, 
        string memory name, 
        string memory imageUrl, 
        uint256 value, 
        uint256 probability
    ) external onlyOwner {
        require(index < poolRewards.length, "Invalid index");
        require(probability <= 10000, "Probability must be <= 10000");
        poolRewards[index] = PoolReward(name, imageUrl, value, probability);
        emit PoolUpdated(index, name, imageUrl, value, probability);
    }

    function removePool(uint256 index) external onlyOwner {
        require(index < poolRewards.length, "Invalid index");
        require(poolRewards.length > 1, "Cannot remove last pool");
        
        // Move last pool to this position
        poolRewards[index] = poolRewards[poolRewards.length - 1];
        poolRewards.pop();
        
        emit PoolRemoved(index);
    }

    function poolCount() external view returns (uint256) {
        return poolRewards.length;
    }

    function getPool(uint256 index) external view returns (
        string memory name,
        string memory imageUrl,
        uint256 value,
        uint256 probability
    ) {
        require(index < poolRewards.length, "Invalid index");
        PoolReward memory pool = poolRewards[index];
        return (pool.name, pool.imageUrl, pool.value, pool.probability);
    }

    // ===== 6. USER CHECK-IN (NHẬN LƯỢT QUAY) =====
    /// @notice User gửi encrypted số lượt quay nhận hôm nay (ví dụ 3)
    function checkIn(externalEuint8 encryptedSpins, bytes calldata attestation) external {
        euint8 spinsToAdd = FHE.fromExternal(encryptedSpins, attestation);
        euint8 currentSpins = encryptedSpinCount[msg.sender];
        encryptedSpinCount[msg.sender] = FHE.add(currentSpins, spinsToAdd);

        // Tăng số ngày điểm danh
        euint32 currentDays = encryptedCheckInDays[msg.sender];
        encryptedCheckInDays[msg.sender] = FHE.add(currentDays, FHE.asEuint32(1));

        // Cho phép user giải mã lượt quay và số ngày điểm danh của mình
        FHE.allow(encryptedSpinCount[msg.sender], msg.sender);
        FHE.allow(encryptedCheckInDays[msg.sender], msg.sender);
    }

    // ===== 7. QUAY VÀ NHẬN PHẦN THƯỞNG =====
    /// @notice User gửi encrypted poolIndex (trúng ô nào) và encrypted point (số điểm nhận được)
    function spinAndClaimReward(
        externalEuint8 encryptedPoolIndex,
        externalEuint32 encryptedPoint,
        bytes calldata attestationPool,
        bytes calldata attestationPoint
    ) external {
        euint8 poolIndex = FHE.fromExternal(encryptedPoolIndex, attestationPool);
        euint32 point = FHE.fromExternal(encryptedPoint, attestationPoint);

        // Kiểm tra còn lượt quay không
        euint8 spinsLeft = encryptedSpinCount[msg.sender];
        ebool hasSpin = FHE.gt(spinsLeft, FHE.asEuint8(0));
        
        // Trừ lượt quay nếu còn, không trừ nếu hết
        euint8 spinConsume = FHE.select(hasSpin, FHE.asEuint8(1), FHE.asEuint8(0));
        encryptedSpinCount[msg.sender] = FHE.sub(spinsLeft, spinConsume);

        // Cộng điểm
        euint32 score = encryptedScores[msg.sender];
        euint32 newScore = FHE.add(score, point);
        encryptedScores[msg.sender] = newScore;

        // Tăng tổng số lần quay
        euint32 totalSpins = encryptedTotalSpins[msg.sender];
        euint32 newTotalSpins = FHE.add(totalSpins, FHE.asEuint32(1));
        encryptedTotalSpins[msg.sender] = newTotalSpins;

        // Lưu poolIndex vừa trúng
        encryptedLastRewardIndex[msg.sender] = poolIndex;

        // Cho phép user đọc điểm, lượt quay, phần thưởng đã claim của mình
        FHE.allow(encryptedSpinCount[msg.sender], msg.sender);
        FHE.allow(encryptedScores[msg.sender], msg.sender);
        FHE.allow(encryptedLastRewardIndex[msg.sender], msg.sender);
        FHE.allow(encryptedTotalSpins[msg.sender], msg.sender);
    }

    // ===== 8. CÔNG KHAI ĐIỂM (CHO PHÉP LÊN BẢNG XẾP HẠNG) =====
    /// @notice User tự công khai điểm (chỉ khi đồng ý)
    function makeScorePublic() external {
        FHE.makePubliclyDecryptable(encryptedScores[msg.sender]);
        FHE.makePubliclyDecryptable(encryptedTotalSpins[msg.sender]);
        FHE.makePubliclyDecryptable(encryptedCheckInDays[msg.sender]);
        emit ScoreMadePublic(msg.sender);
    }

    // ===== 9. ADMIN SUBMIT ĐIỂM LÊN LEADERBOARD =====
    /// @notice Admin (hoặc oracle) submit điểm đã công khai vào publicLeaderboard
    function submitPublicScore(
        address user, 
        uint32 plainScore, 
        uint32 plainTotalSpins, 
        uint32 plainCheckInDays
    ) external onlyOwner {
        // Kiểm tra xem user đã public chưa (có thể verify signature từ Relayer)
        // Thêm vào leaderboard
        publicLeaderboard.push(PublicScore(
            user, 
            plainScore, 
            plainTotalSpins, 
            plainCheckInDays, 
            block.timestamp
        ));
        
        emit ScoreSubmitted(user, plainScore);
    }

    /// @notice Đọc toàn bộ bảng xếp hạng
    function getLeaderboard() external view returns (PublicScore[] memory) {
        return publicLeaderboard;
    }

    /// @notice Đọc top N người chơi
    function getTopPlayers(uint256 count) external view returns (PublicScore[] memory) {
        uint256 length = publicLeaderboard.length;
        if (count > length) {
            count = length;
        }
        
        PublicScore[] memory topPlayers = new PublicScore[](count);
        for (uint256 i = 0; i < count; i++) {
            topPlayers[i] = publicLeaderboard[i];
        }
        return topPlayers;
    }

    // ===== 10. UTILITY FUNCTIONS =====
    /// @notice Kiểm tra user có còn lượt quay không (encrypted)
    function hasSpinsLeft(address user) external view returns (ebool) {
        return FHE.gt(encryptedSpinCount[user], FHE.asEuint8(0));
    }

    /// @notice Lấy số pool hiện tại
    function getPoolRewards() external view returns (PoolReward[] memory) {
        return poolRewards;
    }

    /// @notice Admin có thể reset leaderboard
    function resetLeaderboard() external onlyOwner {
        delete publicLeaderboard;
    }

    /// @notice Admin có thể xóa score cụ thể khỏi leaderboard
    function removeScoreFromLeaderboard(uint256 index) external onlyOwner {
        require(index < publicLeaderboard.length, "Invalid index");
        
        // Move last score to this position
        publicLeaderboard[index] = publicLeaderboard[publicLeaderboard.length - 1];
        publicLeaderboard.pop();
    }
} 