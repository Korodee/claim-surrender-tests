// SPDX-License-Identifier: MIT LICENSE

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "erc721a-upgradeable/contracts/IERC721AUpgradeable.sol";


contract HHBridge is ReentrancyGuardUpgradeable, OwnableUpgradeable {

    IERC721AUpgradeable nft;
    address public stakingContract;

    mapping(address => uint256) public nonces;
    mapping(uint256 => uint256) public lastUsedNonce;

    address private adminSigner;

    event NFTBridged (uint256 indexed tokenId, address indexed holder, uint256 nonce, uint256 timestamp);
    event NFTReleased (uint256 indexed tokenId, address indexed holder, uint256 nonce, uint256 timestamp);

    struct Coupon {
        bytes32 r;
        bytes32 s;
        uint8 v;
    }

    function initialize(address _nft, address _staker, address _adminSigner) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init();
        nft = IERC721AUpgradeable(_nft);
        stakingContract = _staker;
        adminSigner = _adminSigner;
    }

    function bridge(uint256 tokenId) public nonReentrant {
        address nftOwner = nft.ownerOf(tokenId);
        require(nftOwner != stakingContract, "NFT is staked. Please unstake first");
        require(nftOwner == _msgSender(), "You do not own this NFT");
        nft.transferFrom(_msgSender(), address(this), tokenId);
        uint256 nonce = nonces[_msgSender()];
        nonces[_msgSender()] = nonce + 1;
        emit NFTBridged(tokenId, _msgSender(), nonce, block.timestamp);
    }

    function release(uint256 tokenId, uint256 nonce, Coupon memory coupon) public nonReentrant {
        require(nonce > lastUsedNonce[tokenId], "Nonce is too low");
        bytes32 digest = keccak256(abi.encode(tokenId, nonce, 0, _msgSender()));
        require(_isVerifiedCoupon(digest, coupon), 'Invalid coupon');
        nft.transferFrom(address(this), _msgSender(), tokenId);
        lastUsedNonce[tokenId] = nonce;
        emit NFTReleased(tokenId, _msgSender(), nonce, block.timestamp);
    }

    function _isVerifiedCoupon(bytes32 digest, Coupon memory coupon) internal view returns (bool) {
        address signer = ecrecover(digest, coupon.v, coupon.r, coupon.s);
        require(signer != address(0), 'ECDSA: invalid signature');
        return signer == adminSigner;
    }

    function setAdminSigner(address _adminSigner) public onlyOwner {
        adminSigner = _adminSigner;
    }

}