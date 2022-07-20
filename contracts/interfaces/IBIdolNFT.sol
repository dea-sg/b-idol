// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

interface IBIdolNFT {
	/**
	 * @dev For whitelist subjects only
	 *
	 * Requirements:
	 *
	 * - `_merkleProof` Hash data for checking.
	 */
	function mintWhiteList(bytes32[] calldata _merkleProof) external payable;

	/**
	 * @dev For owner only
	 *
	 * Requirements:
	 *
	 * - `_target` destination address.
	 * - `_quantity` Number to be issued.
	 */
	function mintByOwner(address _target, uint256 _quantity) external;

	/**
	 * @dev public sale
	 *
	 * Requirements:
	 *
	 * - `_quantity` Number to be issued.
	 */
	function mintPublic(uint256 _quantity) external payable;

	/**
	 * @dev sales withdrawal
	 *
	 * - `_target` target address.
	 */
	function withdraw(address payable _target) external;

	/**
	 * @dev burn
	 *
	 * Requirements:
	 *
	 * - `_tokenId` id of the token you want to burn.
	 */
	function burn(uint256 _tokenId) external;

	/**
	 * @dev set mac token count
	 *
	 * Requirements:
	 *
	 * - `_maxTokenCount` max token count.
	 */
	function setMaxTokenCount(uint256 _maxTokenCount) external;

	/**
	 * @dev set nft price
	 *
	 * Requirements:
	 *
	 * - `_price` nft price.
	 */
	function setPrice(uint256 _price) external;

	/**
	 * @dev set merkle root
	 *
	 * Requirements:
	 *
	 * - `_merkleRoot` merkle root.
	 */
	function setMerkleRoot(bytes32 _merkleRoot) external;

	/**
	 * @dev List of owners holding NFT.
	 */
	function getOwners() external view returns (address[] memory);
}
