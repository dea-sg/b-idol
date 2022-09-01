// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.16;

import "@openzeppelin/contracts-upgradeable/interfaces/draft-IERC1822Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import "erc721a/contracts/IERC721A.sol";
import "@a16z/contracts/licenses/ICantBeEvil.sol";
import "../interfaces/IBIdolNFT.sol";

contract SupportInterfaceTest {
	function getBIdolNFTId() external pure returns (bytes4) {
		return type(IBIdolNFT).interfaceId;
	}

	function getERC2981UpgradeableId() external pure returns (bytes4) {
		return type(IERC2981Upgradeable).interfaceId;
	}

	function getERC1822ProxiableUpgradeableId() external pure returns (bytes4) {
		return type(IERC1822ProxiableUpgradeable).interfaceId;
	}

	function getCantBeEvilUpgradableId() external pure returns (bytes4) {
		return type(ICantBeEvil).interfaceId;
	}
}
