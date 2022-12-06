// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9 <0.9.0;

contract KiteFighterMock {

  address[] private snapshot;
  bool private genOneStarted;
  address public builderContract;
  address public owner;

  constructor(address[] memory _snapshot) {
    snapshot = _snapshot;
    owner = msg.sender;
  }

  modifier onlyAuthorized() {
    require(builderContract == msg.sender || owner == msg.sender, "Caller is not authorized to make the call");
    _;
  }

  modifier onlyOwner() {
    require(owner == msg.sender, "Ownable: caller is not the owner");
    _;
  }

  function setBuilderContract(address _builderContract) public onlyOwner {
    builderContract = _builderContract;
  }

  function getSnapshot() public view returns (address[] memory) {
   return snapshot;
  }

  function setGenOneStarted(bool _started) public {
    genOneStarted = _started;
  }

  function mintGenOne(address _receiver, string memory _url) public onlyAuthorized {
    require(genOneStarted, "Gen 1 can not mint yet!");
  }
}
