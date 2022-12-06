// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "erc721a-upgradeable/contracts/IERC721AUpgradeable.sol";

interface IMLSToken {
    function mint(address to, uint256 amount) external;
}

contract HouseHeadStaker is OwnableUpgradeable {
    IERC721AUpgradeable public nft;
    IMLSToken public token;
    address public gameContract;
    mapping(uint256 => address) public tokenOwnerOf;
    mapping(uint256 => uint256) public tokenStakedAt;
    mapping(uint256 => bool) public tokenHeldByGame;
    uint256 public EMISSION_RATE;

    function initialize(address _nft, address _token, uint256 _emissionRate, address _gameContract) initializer public {
        __Ownable_init();
        nft = IERC721AUpgradeable(_nft);
        token = IMLSToken(_token);
        gameContract = _gameContract;
        EMISSION_RATE = (_emissionRate * 10 ** ERC20Upgradeable(_token).decimals()) / 1 days;
    }

    function stake(uint256 tokenId) external {
        nft.safeTransferFrom(_msgSender(), address(this), tokenId);
        tokenOwnerOf[tokenId] = _msgSender();
        tokenStakedAt[tokenId] = block.timestamp;
    }

    function calculateTokens(uint256 tokenId) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - tokenStakedAt[tokenId];
        return timeElapsed * EMISSION_RATE;
    }

    function unstake(uint256 tokenId) external {
        require(tokenOwnerOf[tokenId] == _msgSender(), "You can't unstake");
        require(!tokenHeldByGame[tokenId], "Token is held by game");
        token.mint(_msgSender(), calculateTokens(tokenId)); // Minting the tokens for staking
        nft.transferFrom(address(this), _msgSender(), tokenId);
        delete tokenOwnerOf[tokenId];
        delete tokenStakedAt[tokenId];
    }

    function holdTokensForGame(address player, uint256[] memory tokenIds) external {
        require(gameContract == _msgSender(), "Only the game can hold tokens");
        for(uint256 i = 0; i < tokenIds.length; i++) {
            nft.transferFrom(address(this), player, tokenIds[i]);
            tokenHeldByGame[tokenIds[i]] = true;
        }
    }

    function releaseTokensFromGame(address player, uint256[] memory tokenIds) external {
        require(gameContract == _msgSender(), "Only the game can hold tokens");
        for(uint256 i = 0; i < tokenIds.length; i++) {
            nft.transferFrom(_msgSender(), player, tokenIds[i]);
            tokenHeldByGame[tokenIds[i]] = false;
        }
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        return tokenOwnerOf[tokenId];
    }
}