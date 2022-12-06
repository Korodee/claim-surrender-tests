// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MLSToken is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, PausableUpgradeable, OwnableUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor

    address stakingContract;

    // TODO check whether this is needed
    constructor() {
        _disableInitializers();
    }

    modifier onlyStakingContract() {
        require(msg.sender == stakingContract, "Only staking contract can mint");
        _;
    }

    function initialize(address _stakingContract) initializer public {
        __ERC20_init("MLSToken", "MLS");
        __ERC20Burnable_init();
        __Pausable_init();
        __Ownable_init();
        stakingContract = _stakingContract;

        _mint(msg.sender, 10 * 10 ** decimals());
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) external onlyStakingContract {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
    internal
    whenNotPaused
    override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}