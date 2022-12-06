pragma solidity ^0.8.0;

struct GameSession {
    address player;
    uint256[] tokenIds;
    int256 lostTokenIdIndex;
    int256 lostTokenId;
    int256 gainedTokenId;
    uint256 coinsWon;
    uint256 timestamp;
    bool _exists;
    uint256[] finalTokenIds;
    uint256[10] __gap;
}

