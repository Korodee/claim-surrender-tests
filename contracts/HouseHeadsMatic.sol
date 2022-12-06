// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9 <0.9.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol';
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract HouseHeads is ERC721EnumerableUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
  using StringsUpgradeable for uint256;

  string public uriPrefix = "";
  string public uriSuffix = ".json";

  bool public paused = true;

  address public bridge;

  constructor() {
    _disableInitializers();
  }

  function initialize(
    string memory _tokenName,
    string memory _tokenSymbol,
    string memory _hiddenMetadataUri,
    address _bridge
) initializer public {
    __ERC721_init(_tokenName, _tokenSymbol);
    __Ownable_init();
    __ReentrancyGuard_init();
    setUriPrefix(_hiddenMetadataUri);
    bridge = _bridge;
  }

  modifier onlyBridge() {
    require(_msgSender() == bridge, "Only bridge can call this function");
    _;
  }

  function mint(address to, uint256 tokenId) external onlyBridge {
    require(!paused, "The contract is paused!");
    _safeMint(to, tokenId);
  }

  function walletOfOwner(address _owner)
  public
  view
  returns (uint256[] memory)
  {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory tokenIds = new uint256[](ownerTokenCount);
    for (uint256 i; i < ownerTokenCount; i++) {
      tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
    }
    return tokenIds;
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

  function setUriPrefix(string memory _uriPrefix) public onlyOwner {
    uriPrefix = _uriPrefix;
  }

  function setUriSuffix(string memory _uriSuffix) public onlyOwner {
    uriSuffix = _uriSuffix;
  }

  function setPaused(bool _state) public onlyOwner {
    paused = _state;
  }

  function setBridge(address _bridge) public onlyOwner {
    bridge = _bridge;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return uriPrefix;
  }
}
