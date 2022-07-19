// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

interface IBIdolNFT {
	function mintWhiteList(bytes32[] calldata _merkleProof) external payable;

	function mintByOwner(address _target, uint256 _quantity) external;

	function mintPublic(uint256 _quantity) external payable;

	function withdraw() external;

	function burn(uint256 _tokenId) external;

	function setMaxTokenCount(uint256 _maxTokenCount) external;

	function setPrice(uint256 _price) external;

	function setMerkleRoot(bytes32 _merkleRoot) external;

	function getOwners() external view returns (address[] memory);
}
