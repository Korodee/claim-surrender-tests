pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./structs/GameSession.sol";

interface IHouseHeadStaker {
    function holdTokensForGame(address player, uint256[] memory tokenIds) external;
    function releaseTokensFromGame(address player, uint256[] memory tokenIds) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface HouseHeads is IERC721EnumerableUpgradeable {
    function walletOfOwner(address _owner) external view returns (uint256[] memory);
}


contract ClaimSurrenderGame is OwnableUpgradeable {
    address nftContract;
    address stakingContract;
    uint private randNonce;
    uint256 sessionTime = 7 days;

    mapping(address => GameSession) public gameSessions;
    GameSession[] public finishedGameSessions;

    function initialize(address _nftContract, address _stakingContract) public initializer {
        __Ownable_init();
        nftContract = _nftContract;
        stakingContract = _stakingContract;
    }

    function startSession(uint256[] memory tokenIds) public {
        require(tokenIds.length == 3, "You must provide 3 token ids");
        if(gameSessions[_msgSender()]._exists) {
            if(gameSessions[_msgSender()].timestamp + sessionTime < block.timestamp){
                releaseTokens(_msgSender());
            } else {
                revert("You already have an active session");
            }
        }
        // Verify that all the tokens are unique
        for (uint256 i = 0; i < tokenIds.length; i++) {
            for (uint256 j = i + 1; j < tokenIds.length; j++) {
                require(tokenIds[i] != tokenIds[j], "Tokens must be unique");
            }
        }
        // Verify that the player owns all the tokens
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(HouseHeads(nftContract).ownerOf(tokenIds[i]) == stakingContract, "This token is not staked");
            require(IHouseHeadStaker(stakingContract).ownerOf(tokenIds[i]) == _msgSender(), "You do not own this token");
        }
        holdTokens(_msgSender(), tokenIds);
        GameSession memory session;
        session.player = _msgSender();
        session.tokenIds = tokenIds;
        session.lostTokenIdIndex = -1;
        session.lostTokenId = -1;
        session.gainedTokenId = -1;
        session.coinsWon = calculateCoinsWon(tokenIds);
        session.timestamp = block.timestamp;
        session._exists = true;
        gameSessions[_msgSender()] = session;
    }

    function surrender(address player) public {
        GameSession memory session = gameSessions[player];
        require(session._exists, "No game session found");
        require(session.timestamp + sessionTime > block.timestamp, "Session has expired");
        require(session.lostTokenId == -1, "You have already surrendered");
        require(session.gainedTokenId == -1, "You have already surrendered");
        uint256 lostTokenIdIndex = randMod(3);
        uint256 lostTokenId = session.tokenIds[lostTokenIdIndex];
        uint256[] memory poolOfTokens = HouseHeads(nftContract).walletOfOwner(address(this));
        uint256 gainedTokenId = poolOfTokens[randMod(poolOfTokens.length)];
        for (uint256 i = 0; i < session.tokenIds.length; i++) {
            if(i == lostTokenIdIndex) {
                session.finalTokenIds[i] = gainedTokenId;
            }else{
                session.finalTokenIds[i] = session.tokenIds[i];
            }
        }
        session.lostTokenIdIndex = int256(lostTokenIdIndex);
        session.lostTokenId = int256(lostTokenId);
        session.gainedTokenId = int256(gainedTokenId);
    }

    function finishSession() public {
        require(gameSessions[_msgSender()]._exists, "No game session found");
        releaseTokens(_msgSender());
    }

    // TODO Need to calculate the coins won
    function calculateCoinsWon(uint256[] memory tokenIds) internal view returns (uint256) {
        uint256 amount = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            amount += tokenIds[i];
        }
        return amount;
    }

    function emergencyDeleteSession(address player) public onlyOwner {
        delete gameSessions[player];
    }

    function emergencyReleaseTokens(address player) public onlyOwner {
        releaseTokens(player);
    }

    function holdTokens(address player, uint256[] memory tokenIds) internal {
        IHouseHeadStaker(stakingContract).holdTokensForGame(player, tokenIds);
    }

    function releaseTokens(address player) internal {
        uint256[] memory tokenIds = gameSessions[player].tokenIds;
        IHouseHeadStaker(stakingContract).releaseTokensFromGame(player, tokenIds);
        delete gameSessions[player];
    }

    function randMod(uint _modulus) internal returns(uint)
    {
        randNonce++;
        return uint(keccak256(abi.encodePacked(block.timestamp,
            _msgSender(),
            randNonce))) % _modulus;
    }
}