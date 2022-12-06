// SPDX-License-Identifier: MIT

pragma solidity >=0.8.9 <0.9.0;

contract KiteComponentMock {
  bool public saleIsActive = false;
  bool public burnBatchShouldPass = false;
  address public builderContract;
  address public owner;

  constructor() {
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

  function flipSaleState() external onlyOwner
  {
    saleIsActive = !saleIsActive;
  }

  function setBurnBatchShouldPass(bool _burnBatchShouldPass) external onlyOwner
  {
    burnBatchShouldPass = _burnBatchShouldPass;
  }

  function dappMint(address to, uint256 tokenId, uint256 amount) external onlyAuthorized
  {
    require(saleIsActive, "Sale must be active to mint");
    require(amount > 0, "Must must be a number larger than 0");
  }

  function burnBatch(address account, uint256[] memory ids, uint256[] memory values) public onlyAuthorized
  {
    require(burnBatchShouldPass, "Burn batch did not pass");
  }
}
