// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9 <0.9.0;

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol';
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract HouseHeads is ERC721AUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
  using StringsUpgradeable for uint256;

  bytes32 public merkleRoot;
  bytes32 public merkleRootFree;

  mapping(address => uint256) public whitelistClaimed;
  mapping(address => uint256) public freeMintClaimed;
  mapping(address => uint256) public tokensClaimed;

  string public uriPrefix = "";
  string public uriSuffix = ".json";

  uint256 public cost;
  uint256 public maxSupply;
  uint256 public maxMintAmount;
  uint256 public maxMintAmountWL;
  uint256 public maxMintAmountFree;

  bool public paused = true;
  bool public whitelistMintEnabled = false;
  bool public revealed = false;

  function initialize(
    string memory _tokenName,
    string memory _tokenSymbol,
    uint256 _cost,
    uint256 _maxMintAmountWL,
    uint256 _maxMintAmountFree,
    uint256 _maxSupply,
    uint256 _maxMintAmount,
    string memory _hiddenMetadataUri
) initializer public {
    __ERC721A_init(_tokenName, _tokenSymbol);
    __Ownable_init();
    __ReentrancyGuard_init();
    maxMintAmountWL=_maxMintAmountWL;
    cost = _cost;
    maxSupply = _maxSupply;
    maxMintAmount = _maxMintAmount;
    maxMintAmountFree = _maxMintAmountFree;
    setUriPrefix(_hiddenMetadataUri);
  }

  modifier mintCompliance(uint256 _mintAmount) {
    require(_mintAmount > 0, "Invalid mint amount!");
    require(totalSupply() + _mintAmount <= maxSupply, "Max supply exceeded!");
    _;
  }

  modifier mintPriceCompliance(uint256 _mintAmount) {
    require(msg.value >= cost * _mintAmount, "Insufficient funds!");
    _;
  }

  function whitelistMint(uint256 _mintAmount, bytes32[] calldata _merkleProof) public payable mintCompliance(_mintAmount) mintPriceCompliance(_mintAmount) {
    // Verify whitelist requirements
    require(whitelistMintEnabled, "The whitelist sale is not enabled!");
    require((whitelistClaimed[_msgSender()]+_mintAmount)<=maxMintAmountWL, "Address already claimed!");
    bytes32 leaf = keccak256(abi.encodePacked(_msgSender()));
    require(MerkleProofUpgradeable.verify(_merkleProof, merkleRoot, leaf), "Invalid proof!");

    whitelistClaimed[_msgSender()] = whitelistClaimed[_msgSender()] + _mintAmount;
    _safeMint(_msgSender(), _mintAmount);
  }

  function freeMint(uint256 _mintAmount, bytes32[] calldata _merkleProof) public mintCompliance(_mintAmount) {
    // Verify whitelist requirements
    require(whitelistMintEnabled || !paused, "The free mint is not enabled!");
    require((freeMintClaimed[_msgSender()]+_mintAmount)<=maxMintAmountFree, "Address already claimed!");
    bytes32 leaf = keccak256(abi.encodePacked(_msgSender()));
    require(MerkleProofUpgradeable.verify(_merkleProof, merkleRootFree, leaf), "Invalid proof!");

    freeMintClaimed[_msgSender()] = freeMintClaimed[_msgSender()] + _mintAmount;
    _safeMint(_msgSender(), _mintAmount);
  }

  function mint(uint256 _mintAmount) public payable mintCompliance(_mintAmount) mintPriceCompliance(_mintAmount) {
    require(!paused, "The contract is paused!");
    require((tokensClaimed[_msgSender()]+_mintAmount)<=maxMintAmount, "Address already claimed!");

    tokensClaimed[_msgSender()] = tokensClaimed[_msgSender()] + _mintAmount;
    _safeMint(_msgSender(), _mintAmount);
  }

  function mintForAddress(uint256 _mintAmount, address _receiver) public mintCompliance(_mintAmount) onlyOwner {
    _safeMint(_receiver, _mintAmount);
  }

  function walletOfOwner(address _owner)
    public
    view
    returns (uint256[] memory)
  {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory ownedTokenIds = new uint256[](ownerTokenCount);
    uint256 currentTokenId = 1;
    uint256 ownedTokenIndex = 0;

    while (ownedTokenIndex < ownerTokenCount && currentTokenId <= maxSupply) {
      address currentTokenOwner = ownerOf(currentTokenId);

      if (currentTokenOwner == _owner) {
        ownedTokenIds[ownedTokenIndex] = currentTokenId;

        ownedTokenIndex++;
      }

      currentTokenId++;
    }

    return ownedTokenIds;
  }

  function tokenURI(uint256 _tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(
      _exists(_tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );
    string memory currentBaseURI = _baseURI();
    return bytes(currentBaseURI).length > 0
    ? string(abi.encodePacked(currentBaseURI, _tokenId.toString(), uriSuffix))
    : "";
  }

  function setRevealed(bool _state) public onlyOwner {
    revealed = _state;
  }

  function setCost(uint256 _cost) public onlyOwner {
    cost = _cost;
  }

  function setMaxMintAmount(uint256 _maxMintAmount) public onlyOwner {
    maxMintAmount = _maxMintAmount;
  }

  function setUriPrefix(string memory _uriPrefix) public onlyOwner {
    uriPrefix = _uriPrefix;
  }

  function setUriSuffix(string memory _uriSuffix) public onlyOwner {
    uriSuffix = _uriSuffix;
  }

  function setPaused(bool _state) public onlyOwner {
    paused = _state;
  }

  function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
    merkleRoot = _merkleRoot;
  }

  function setMerkleRootFree(bytes32 _merkleRootFree) public onlyOwner {
    merkleRootFree = _merkleRootFree;
  }

  function setWhitelistMintEnabled(bool _state) public onlyOwner {
    whitelistMintEnabled = _state;
  }

  function withdraw() public onlyOwner nonReentrant {
    // This will transfer the remaining contract balance to the owner.
    // Do not remove this otherwise you will not be able to withdraw the funds.
    // =============================================================================
    (bool os, ) = payable(owner()).call{value: address(this).balance}("");
    require(os);
    // =============================================================================
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return uriPrefix;
  }
}
